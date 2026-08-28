import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../../config/env';

/**
 * LNbits payment webhook parsing.
 *
 * LNbits POSTs the full `Payment` model JSON to the configured webhook URL when
 * a Lightning invoice is paid. It does not cryptographically sign webhooks by
 * default, so beyond the standard authenticity checks we anchor trust in the
 * fact that the payload's `payment_hash` must correspond to a Lightning
 * invoice *we ourselves created* (looked up in our payments table). Optionally
 * an `X-LNbits-Signature` header can be validated with LNBITS_WEBHOOK_SECRET.
 */

export interface LnbitsWebhookPayload {
  payment_hash?: string;
  checking_id?: string;
  wallet_id?: string;
  amount?: number; // msat; positive = incoming
  fee?: number;
  bolt11?: string;
  status?: string; // 'PENDING' | 'SUCCESS' | 'FAILED'
  preimage?: string | null;
  memo?: string | null;
  time?: string;
  expiry?: string | null;
}

/**
 * Validate the inbound webhook request.
 *
 * Returns { ok: true } if authentic, { ok: false, reason } otherwise.
 * If LNBITS_WEBHOOK_SECRET is set and an X-LNbits-Signature header is present,
 * an HMAC-SHA256 over the raw body with that secret must match. If the header
 * is absent we fall back to a lenient path (still requires a recognised
 * payment_hash downstream) — the presence of a webhook secret turns the
 * signature check into a hard requirement.
 */
export function verifyWebhook(body: Buffer, headers: Record<string, unknown>): {
  ok: boolean;
  reason?: string;
} {
  const secret = env.LNBITS_WEBHOOK_SECRET;
  const signatureHeader =
    (headers['x-lnbits-signature'] as string) ??
    (headers['x-hub-signature-256'] as string) ??
    '';

  const wantSignature =
    signatureHeader || (secret && secret !== 'change-me-webhook-secret');

  if (!wantSignature) {
    // No signature infrastructure configured; downstream payment-hash lookup
    // remains the authenticity gate.
    return { ok: true };
  }

  if (!signatureHeader) {
    return {
      ok: false,
      reason: 'Missing webhook signature header',
    };
  }

  // Accept either X-LNbits-Signature (raw hex HMAC) or X-Hub-Signature-256
  // (sha256=<hex>) convention.
  let provided = signatureHeader;
  if (provided.startsWith('sha256=')) provided = provided.slice(7);

  const computed = createHmac('sha256', secret).update(body).digest('hex');

  const a = Buffer.from(provided, 'hex');
  const b = Buffer.from(computed, 'hex');
  if (a.length !== b.length) return { ok: false, reason: 'Bad signature length' };

  return timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: 'Signature mismatch' };
}

export function parseWebhookPayload(raw: Buffer): LnbitsWebhookPayload | null {
  try {
    return JSON.parse(raw.toString('utf8')) as LnbitsWebhookPayload;
  } catch {
    return null;
  }
}

/** A webhook is for an incoming (received) payment. */
export function isIncoming(payload: LnbitsWebhookPayload): boolean {
  // amount is in msat; incoming payments are positive.
  return (payload.amount ?? 0) >= 0;
}

/** Convert LNbits payment.state to a canonical paid flag. */
export function isPaid(payload: LnbitsWebhookPayload): boolean {
  const s = (payload.status ?? '').toUpperCase();
  return s === 'SUCCESS' || s === 'PAID';
}
