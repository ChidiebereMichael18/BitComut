import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * Thin LNbits API wrapper.
 *
 * LNbits is the Lightning *engine only* for this system: it creates invoices,
 * reports payment status, and that's it. All business logic (tenants, invoices,
 * FX, settlement bookkeeping) lives in Bitcomut's own services/tables.
 *
 * NEVER send the LNbits API keys to the browser/mobile app. They live only in
 * backend env vars.
 */

export interface LnbitsInvoice {
  payment_hash: string;
  payment_request: string; // BOLT11
  checking_id: string;
  amount: number; // msat
  memo?: string | null;
  pending?: boolean;
  paid?: boolean;
}

export interface LnbitsPaymentStatus {
  paid: boolean;
  preimage?: string | null;
  status?: string;
  amount?: number;
  details?: {
    memo?: string;
    payment_hash?: string;
    [k: string]: unknown;
  } | null;
}

interface LnbitsWallet {
  id: string;
  name: string;
  balance: number; // msat
  [k: string]: unknown;
}

/**
 * Verify the configured wallet health + optionally also verify that invoices
 * can be created. Throws on failure.
 */
async function apiFetch<T>(
  path: string,
  key: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${env.LNBITS_BASE_URL.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': key,
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.error(
      { url: path, status: res.status, body: text.slice(0, 500) },
      'LNbits API error',
    );
    throw new Error(
      `LNbits ${init.method ?? 'GET'} ${path} failed: ${res.status} ${text.slice(0, 200)}`,
    );
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export class LnbitsClient {
  constructor(
    private invoiceKey: string,
    private adminKey: string,
  ) {}

  /**
   * Create a Lightning invoice for a given sats amount.
   * Bitcomut computes `sats` itself via FXService; we never send fiat amounts.
   */
  async createInvoice(opts: {
    amountSats: number;
    memo: string;
    webhook?: string;
    expiry?: number;
  }): Promise<LnbitsInvoice> {
    const body = {
      out: false,
      unit: 'sat',
      amount: opts.amountSats,
      memo: opts.memo,
      webhook: opts.webhook,
    };
    if (opts.expiry) (body as { expiry?: number }).expiry = opts.expiry;

    return apiFetch<LnbitsInvoice>(
      '/api/v1/payments',
      this.invoiceKey,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  }

  /** Poll payment status by payment_hash (fallback/reconcile path). */
  async getPayment(paymentHash: string): Promise<LnbitsPaymentStatus> {
    return apiFetch<LnbitsPaymentStatus>(
      `/api/v1/payments/${paymentHash}`,
      this.invoiceKey,
    );
  }

  /** Wallet balance for the invoice-key wallet. */
  async checkWallet(): Promise<LnbitsWallet> {
    return apiFetch<LnbitsWallet>('/api/v1/wallet', this.invoiceKey);
  }

  /** Optional rate source only — never authoritative. */
  async getCurrencies(): Promise<Record<string, string>> {
    return apiFetch<Record<string, string>>(
      '/api/v1/currencies',
      this.adminKey || this.invoiceKey,
    );
  }

  /** Optional rate source only. Returns e.g. { rate: number } */
  async getRate(currency: string): Promise<{ rate: number }> {
    return apiFetch<{ rate: number }>(
      `/api/v1/rate/${currency}`,
      this.adminKey || this.invoiceKey,
    );
  }
}

export const lnbits = new LnbitsClient(
  env.LNBITS_INVOICE_KEY,
  env.LNBITS_ADMIN_KEY,
);

/**
 * Health check: reachable + a wallet is authorized. Used at boot / readiness.
 */
export async function checkLnbitsHealth(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const wallet = await lnbits.checkWallet();
    return { ok: true, message: `Wallet ${wallet.id} connected` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}
