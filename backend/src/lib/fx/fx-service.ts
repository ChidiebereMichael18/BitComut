import { env } from '../../config/env';

/**
 * FX service — Bitcomut owns FX.
 *
 * RWF (and other local currencies) are never assumed to be "known" to LNbits.
 * Bitcomut's FXService is the source of truth for the currencies the platform
 * supports and for the exchange-rate snapshot taken at invoice-creation time.
 *
 * The quote is computed ONCE when the Lightning invoice is created and the
 * resulting { sats, rate } is persisted on the payments row. It is never
 * recomputed later: exchange_rate is a snapshot, not a live value.
 */

export interface FxQuote {
  sats: number;
  /** local currency units per 1 BTC (e.g. 480000000 RWF per BTC) */
  rate: number;
}

export interface FxProvider {
  getRateForCurrency(currency: string): Promise<number>;
}

/** Static provider seeded from env fallback. */
export class StaticFxProvider implements FxProvider {
  constructor(
    private baseRate: number = env.BTC_RWF_RATE_FALLBACK,
    private supportedCurrencies: Record<string, number> = {
      RWF: env.BTC_RWF_RATE_FALLBACK,
      KES: Math.round(env.BTC_RWF_RATE_FALLBACK / 3.15),
      UGX: Math.round(env.BTC_RWF_RATE_FALLBACK / 1.32),
    },
  ) {}

  async getRateForCurrency(currency: string): Promise<number> {
    const key = currency.toUpperCase();
    const rate = this.supportedCurrencies[key];
    if (!rate) {
      // Fall back to the base RWF rate scaled synthetically so sats stay
      // proportional (mirrors frontend mock tenant-data.ts).
      if (key === 'RWF' || key === '') return this.baseRate;
      const scaled = Math.round(this.baseRate / 1.0);
      return scaled;
    }
    return rate;
  }
}

/** LNbits-backed provider — ONE possible rate source, never authoritative. */
export class LnbitsFxProvider implements FxProvider {
  constructor(private baseUrl: string, private adminKey: string) {}
  async getRateForCurrency(currency: string): Promise<number> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/rate/${encodeURIComponent(currency.toUpperCase())}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': this.adminKey },
    });
    if (!res.ok) throw new Error(`FX provider (lnbits) returned ${res.status}`);
    const data = (await res.json()) as { rate: number };
    return data.rate;
  }
}

/** External provider stub — swap in a real feed later without touching callers. */
export class ExternalFxProvider implements FxProvider {
  async getRateForCurrency(_currency: string): Promise<number> {
    throw new Error('FX_PROVIDER=external not implemented; use static or lnbits');
  }
}

export function createFxProvider(): FxProvider {
  switch (env.FX_PROVIDER) {
    case 'lnbits':
      return new LnbitsFxProvider(env.LNBITS_BASE_URL, env.LNBITS_ADMIN_KEY);
    case 'external':
      return new ExternalFxProvider();
    case 'static':
    default:
      return new StaticFxProvider();
  }
}

const btcrelabel = 100_000_000; // sats per BTC

export class FxService {
  constructor(private provider: FxProvider = createFxProvider()) {}

  /**
   * Compute sats for a fiat amount at the current (snapshotted) rate.
   * sats = round( fiatAmount / rate * 100_000_000 )
   */
  async quote(currency: string, fiatAmount: number): Promise<FxQuote> {
    const rate = await this.provider.getRateForCurrency(currency);
    const sats = Math.max(
      1,
      Math.round((fiatAmount / rate) * btcrelabel),
    );
    return { sats, rate };
  }

  /** Convert sats back to fiat using a previously-snapshotted rate. */
  toFiat(rate: number, sats: number): number {
    return Math.round((sats / btcrelabel) * rate * 100) / 100;
  }

  static SATS_PER_BTC = btcrelabel;
}
