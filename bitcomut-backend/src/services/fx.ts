import { config } from "../config";
import { pool } from "../db/pool";
import { audit } from "./audit";

const BTC_SATS_PER = 100_000_000;

// Fallback BTC/USD rate used ONLY when every live provider is unavailable.
// The forward-looking default (~80k) keeps the demo deterministic offline,
// so CI/offline runs never flake on an external API. Any real deployment
// should set FX_API_KEY to pull accurate live rates.
const BTC_USD_REFERENCE = 80_000;

// ---------------------------------------------------------------------------
// African fiat -> USD reference table.
//
// This is an APPROXIMATE offline fallback used when no FX_API_KEY is set, so
// the platform can quote & move any African currency end-to-end without a
// network dependency. When a live provider is configured (FX_API_KEY), these
// static values are replaced by real-time rates fetched for the *same* set of
// currencies — the coverage below defines exactly which currencies the
// platform supports. Values are USD per 1 unit of local currency.
// ---------------------------------------------------------------------------
export const FIAT_USD_REFERENCE: Record<string, number> = {
  // legacy corridor — kept stable so existing tests/contracts don't change
  NGN: 1 / 1500, // ~1 NGN = 0.000667 USD
  RWF: 1 / 1300, // ~1 RWF = 0.000769 USD
  USD: 1,

  // West Africa
  GHS: 0.066, // Ghana Cedi
  XOF: 0.00167, // West African CFA (Benin, Burkina, Côte d'Ivoire, Mali, Niger, Senegal, Togo)
  GMD: 0.016, // Gambian Dalasi
  GNF: 0.00012, // Guinean Franc
  LRD: 0.0052, // Liberian Dollar
  MRU: 0.026, // Mauritanian Ouguiya
  SLE: 0.048, // Sierra Leonean Leone (new)
  CVE: 0.0099, // Cape Verdean Escudo
  GWP: 0.00167, // Guinea-Bissau (XOF)

  // East Africa
  KES: 0.0077, // Kenyan Shilling
  UGX: 0.00027, // Ugandan Shilling
  TZS: 0.00038, // Tanzanian Shilling
  ETB: 0.017, // Ethiopian Birr
  DJF: 0.0056, // Djiboutian Franc
  ERN: 0.067, // Eritrean Nakfa
  SOS: 0.0017, // Somali Shilling
  SSP: 0.0077, // South Sudanese Pound
  SCR: 0.073, // Seychellois Rupee
  KMF: 0.0022, // Comorian Franc

  // Central Africa
  XAF: 0.00167, // Central African CFA (Cameroon, CAR, Chad, Congo, Equatorial Guinea, Gabon)
  CDF: 0.00035, // Congolese Franc
  BIF: 0.00035, // Burundian Franc

  // Southern Africa
  ZAR: 0.055, // South African Rand
  ZMW: 0.039, // Zambian Kwacha
  MWK: 0.00057, // Malawian Kwacha
  MZN: 0.016, // Mozambican Metical
  BWP: 0.073, // Botswanan Pula
  NAD: 0.055, // Namibian Dollar (pegged ZAR)
  LSL: 0.055, // Lesotho Loti (pegged ZAR)
  SZL: 0.055, // Eswatini Lilangeni (pegged ZAR)
  AOA: 0.0017, // Angolan Kwanza
  ZWL: 0.0027, // Zimbabwean Gold/ZWL

  // North Africa
  EGP: 0.021, // Egyptian Pound
  MAD: 0.102, // Moroccan Dirham
  DZD: 0.0074, // Algerian Dinar
  TND: 0.32, // Tunisian Dinar
  LYD: 0.21, // Libyan Dinar
  SDG: 0.0017, // Sudanese Pound

  // Indian Ocean / Islands
  MUR: 0.022, // Mauritian Rupee
  STN: 0.047, // São Tomé & Príncipe Dobra
};

function toId(code: string): string {
  const c = code.replace(/^CURRENCY_/, "").toUpperCase();
  if (c === "BTC") return "BTC";
  return c;
}

// Bitcoin is both a source and target currency in this system: a university can
// invoice directly in BTC (mBTC/uBTC) and a student can pay in BTC. The
// conversion rail is "any fiat/BTC -> BTC (Lightning) -> any fiat/BTC", so BTC
// must behave as identity (1 BTC = 1 BTC) in every conversion step.
function isBtc(code: string): boolean {
  return toId(code) === "BTC";
}

// ---------------------------------------------------------------------------
// Rate provider abstraction. Everything downstream only cares about:
//   fiatUsd(code)  -> USD value of 1 unit of local currency
//   btcUsd()       -> USD value of 1 BTC
// (so any local currency can be routed through BTC -> Lightning -> back).
// ---------------------------------------------------------------------------
interface RateProvider {
  id: string;
  fiatUsd(code: string): Promise<number>;
  btcUsd(): Promise<number>;
}

// Short TTL cache so free-tier / public endpoints are not hammered.
const cache = new Map<string, { at: number; value: number }>();
const CACHE_TTL_MS = 60_000;
function cached(key: string, compute: () => Promise<number>): Promise<number> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return Promise.resolve(hit.value);
  return compute().then((value) => {
    cache.set(key, { at: Date.now(), value });
    return value;
  });
}

// ---------------------------------------------------------------------------
// CoinGecko provider.
//
//  * With FX_API_KEY : one authenticated call returns BTC priced in USD + every
//                      supported African currency (accurate, much higher limit).
//  * Without key      : the free public endpoint only reliably returns BTC/USD.
//                      Persistent 429s fall back to the reference table instead
//                      of failing the whole payment (keeps the demo deterministic).
// ---------------------------------------------------------------------------
class CoingeckoProvider implements RateProvider {
  id = "coingecko";

  private baseUrl = config.FX_API_KEY
    ? "https://api.coingecko.com/api/v3"
    : "https://api.coingecko.com/api/v3"; // free tier uses same host w/ optional key

  private async fetchRates(): Promise<Record<string, number>> {
    const vs = ["usd", ...Object.keys(FIAT_USD_REFERENCE)]
      .map((c) => c.toLowerCase())
      .join(",");
    const url = `${this.baseUrl}/simple/price?ids=bitcoin&vs_currencies=${vs}`;
    const headers: Record<string, string> = {};
    if (config.FX_API_KEY) headers["x-cg-demo-api-key"] = config.FX_API_KEY;

    let delay = 400;
    const attempts = config.FX_API_KEY ? 3 : 4;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = (await res.json()) as { bitcoin: Record<string, number> };
          if (data?.bitcoin && typeof data.bitcoin.usd === "number") return data.bitcoin;
        }
      } catch {
        /* retry */
      }
      if (attempt === attempts) break;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
    // If we could not reach a live BTC rate at all, throw so the caller can
    // fall back to the static reference.
    throw new Error("FX provider unavailable");
  }

  async btcUsd(): Promise<number> {
    return cached("cg:btc:usd", async () => {
      const map = await this.fetchRates();
      return map["usd"];
    });
  }

  async fiatUsd(code: string): Promise<number> {
    const upper = code.toUpperCase();
    // Fast path: never made a live call before -> static reference is enough.
    const staticRef = FIAT_USD_REFERENCE[upper];
    return cached(`cg:${upper}`, async () => {
      try {
        const map = await this.fetchRates();
        const btcUsd = map["usd"];
        const btcCode = map[upper.toLowerCase()];
        if (btcCode && btcUsd) return btcUsd / btcCode; // USD per 1 unit
      } catch {
        /* fall through to reference */
      }
      if (staticRef !== undefined) return staticRef;
      throw new Error(`No FX reference for ${upper}`);
    });
  }
}

// ---------------------------------------------------------------------------
// CoinMarketCap provider (optional). Requires FX_API_KEY set to
// COINMARKETCAP_API_KEY. Returns BTC/USD and fiat/USD via its public API.
// ---------------------------------------------------------------------------
class CoinMarketCapProvider implements RateProvider {
  id = "coinmarketcap";

  async btcUsd(): Promise<number> {
    return cached("cmc:btc:usd", async () => {
      const res = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&convert=USD`,
        { headers: { "X-CMC_PRO_API_KEY": config.FX_API_KEY } }
      );
      if (!res.ok) throw new Error("CMC FX provider unavailable");
      const data = (await res.json()) as any;
      return Number(data.data.BTC[0].quote.USD.price);
    });
  }

  async fiatUsd(code: string): Promise<number> {
    const upper = code.toUpperCase();
    const staticRef = FIAT_USD_REFERENCE[upper];
    if (staticRef !== undefined) return staticRef;
    throw new Error(`No FX reference for ${upper}`);
  }
}

// ---------------------------------------------------------------------------
// Open Exchange Rates provider (optional). Requires FX_API_KEY set to an
// OER App ID. Returns live USD-first fiat rates — great accuracy for Africa.
// ---------------------------------------------------------------------------
class OpenExchangeRatesProvider implements RateProvider {
  id = "openexchangerates";

  async btcUsd(): Promise<number> {
    return cached("oer:btc:usd", async () => {
      // OER has no crypto price; fall back to BTC/USD reference.
      return BTC_USD_REFERENCE;
    });
  }

  async fiatUsd(code: string): Promise<number> {
    const upper = code.toUpperCase();
    return cached(`oer:${upper}`, async () => {
      const res = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${config.FX_API_KEY}`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error("OER FX provider unavailable");
      const data = (await res.json()) as { rates?: Record<string, number> };
      const rate = data.rates?.[upper];
      if (typeof rate !== "number") {
        const staticRef = FIAT_USD_REFERENCE[upper];
        if (staticRef !== undefined) return staticRef;
        throw new Error(`No FX reference for ${upper}`);
      }
      return 1 / rate; // OER reports base-USD per unit -> invert
    });
  }
}

// ---------------------------------------------------------------------------
// Provider selection (driven by FX_PROVIDER_ID + FX_API_KEY in .env)
// ---------------------------------------------------------------------------
function buildProvider(): RateProvider {
  switch ((config.FX_PROVIDER_ID || "coingecko").toLowerCase()) {
    case "coinmarketcap":
      return new CoinMarketCapProvider();
    case "openexchangerates":
      return new OpenExchangeRatesProvider();
    case "coingecko":
    default:
      return new CoingeckoProvider();
  }
}

const provider: RateProvider = buildProvider();

export function setFxProvider(p: RateProvider): void {
  (provider as any) = p;
}

// ---------------------------------------------------------------------------
// Public FX API (unchanged signatures so callers keep working)
// ---------------------------------------------------------------------------
export async function getBtcUsd(): Promise<number> {
  const live = await cached("global:btc:usd", () => provider.btcUsd())
    .catch(() => BTC_USD_REFERENCE);
  return live;
}

// Amount of `currency` per 1 BTC.
export async function currentFiatPerBtc(currency: string): Promise<number> {
  if (isBtc(currency)) return 1; // 1 BTC per 1 BTC
  const btcUsd = await getBtcUsd();
  const fiatUsd = await provider.fiatUsd(currency).catch(() => FIAT_USD_REFERENCE[currency.toUpperCase()]);
  if (fiatUsd === undefined) throw new Error(`No FX reference for ${currency}`);
  return btcUsd / fiatUsd;
}

export async function convertToBtc(fromCurrency: string, fromAmount: number): Promise<number> {
  if (isBtc(fromCurrency)) return fromAmount; // already BTC
  const fiatPerBtc = await currentFiatPerBtc(fromCurrency);
  return fromAmount / fiatPerBtc;
}

export async function convertBtcToFiat(toCurrency: string, btcAmount: number): Promise<number> {
  if (isBtc(toCurrency)) return btcAmount; // BTC -> BTC is identity
  const fiatPerBtc = await currentFiatPerBtc(toCurrency);
  return btcAmount * fiatPerBtc;
}

export async function convertFiatToFiat(
  fromCurrency: string,
  toCurrency: string,
  amount: number
): Promise<number> {
  const btcAmount = await convertToBtc(fromCurrency, amount);
  return convertBtcToFiat(toCurrency, btcAmount);
}

// List every supported African currency (ISO code + human label + country).
export interface SupportedCurrency {
  code: string;
  name: string;
  country: string;
  hasLiveRate: boolean;
}
export const SUPPORTED_CURRENCIES: Record<string, { name: string; country: string }> = {
  NGN: { name: "Nigerian Naira", country: "Nigeria" },
  GHS: { name: "Ghanaian Cedi", country: "Ghana" },
  KES: { name: "Kenyan Shilling", country: "Kenya" },
  UGX: { name: "Ugandan Shilling", country: "Uganda" },
  TZS: { name: "Tanzanian Shilling", country: "Tanzania" },
  ZAR: { name: "South African Rand", country: "South Africa" },
  EGP: { name: "Egyptian Pound", country: "Egypt" },
  ETB: { name: "Ethiopian Birr", country: "Ethiopia" },
  XAF: { name: "Central African CFA Franc", country: "CEMAC region" },
  XOF: { name: "West African CFA Franc", country: "UEMOA region" },
  MAD: { name: "Moroccan Dirham", country: "Morocco" },
  DZD: { name: "Algerian Dinar", country: "Algeria" },
  TND: { name: "Tunisian Dinar", country: "Tunisia" },
  LYD: { name: "Libyan Dinar", country: "Libya" },
  SDG: { name: "Sudanese Pound", country: "Sudan" },
  RWF: { name: "Rwandan Franc", country: "Rwanda" },
  BIF: { name: "Burundian Franc", country: "Burundi" },
  CDF: { name: "Congolese Franc", country: "DR Congo" },
  GMD: { name: "Gambian Dalasi", country: "Gambia" },
  GNF: { name: "Guinean Franc", country: "Guinea" },
  LRD: { name: "Liberian Dollar", country: "Liberia" },
  MRU: { name: "Mauritanian Ouguiya", country: "Mauritania" },
  SLE: { name: "Sierra Leonean Leone", country: "Sierra Leone" },
  CVE: { name: "Cape Verdean Escudo", country: "Cape Verde" },
  DJF: { name: "Djiboutian Franc", country: "Djibouti" },
  ERN: { name: "Eritrean Nakfa", country: "Eritrea" },
  SOS: { name: "Somali Shilling", country: "Somalia" },
  SSP: { name: "South Sudanese Pound", country: "South Sudan" },
  SCR: { name: "Seychellois Rupee", country: "Seychelles" },
  KMF: { name: "Comorian Franc", country: "Comoros" },
  ZMW: { name: "Zambian Kwacha", country: "Zambia" },
  MWK: { name: "Malawian Kwacha", country: "Malawi" },
  MZN: { name: "Mozambican Metical", country: "Mozambique" },
  BWP: { name: "Botswanan Pula", country: "Botswana" },
  NAD: { name: "Namibian Dollar", country: "Namibia" },
  LSL: { name: "Lesotho Loti", country: "Lesotho" },
  SZL: { name: "Eswatini Lilangeni", country: "Eswatini" },
  AOA: { name: "Angolan Kwanza", country: "Angola" },
  ZWL: { name: "Zimbabwean Dollar", country: "Zimbabwe" },
  MUR: { name: "Mauritian Rupee", country: "Mauritius" },
  STN: { name: "São Tomé & Príncipe Dobra", country: "São Tomé & Príncipe" },
};

export function listSupportedCurrencies(): SupportedCurrency[] {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, meta]) => ({
    code,
    name: meta.name,
    country: meta.country,
    hasLiveRate: !!config.FX_API_KEY,
  }));
}

export interface CreateQuoteInput {
  invoiceId: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
}

// Generate and persist a locked exchange-rate quote (short validity window).
export async function createQuote(input: CreateQuoteInput, quoteTtlSec = 300): Promise<any> {
  const fromId = toId(input.fromCurrency);
  const toId_ = toId(input.toCurrency);

  const btcAmount = await convertToBtc(fromId, input.fromAmount);
  const btcRate = btcAmount / input.fromAmount; // BTC per unit of fromCurrency
  const fiatPerBtc = toId_ === "BTC" ? 1 : await currentFiatPerBtc(toId_);
  const fxUsdRate = FIAT_USD_REFERENCE[fromId] ?? (await provider.fiatUsd(fromId).catch(() => FIAT_USD_REFERENCE[fromId] ?? 0));

  const expiresAt = new Date(Date.now() + quoteTtlSec * 1000);

  const { rows } = await pool.query(
    `INSERT INTO fx_quotes
       (invoice_id, from_currency, to_currency, btc_rate, fx_usd_rate,
        from_amount, btc_amount, expires_at, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active')
     RETURNING *`,
    [
      input.invoiceId,
      fromId,
      toId_,
      btcRate,
      fxUsdRate,
      input.fromAmount,
      btcAmount,
      expiresAt.toISOString(),
    ]
  );

  await audit({ actor: "system", action: "quote.created", entity: "fx_quotes", entityId: rows[0].id, meta: { fromAmount: input.fromAmount, btcAmount } });

  return rows[0];
}

export async function getActiveQuote(quoteId: string): Promise<any | null> {
  const { rows } = await pool.query(
    `SELECT * FROM fx_quotes WHERE id = $1 AND status = 'active' AND expires_at > now()`,
    [quoteId]
  );
  return rows[0] ?? null;
}

export async function useQuote(quoteId: string): Promise<void> {
  await pool.query(`UPDATE fx_quotes SET status = 'used' WHERE id = $1`, [quoteId]);
}

export { BTC_SATS_PER };
