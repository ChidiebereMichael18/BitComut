import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../../config/logger';
import {
  verifyWebhook,
  parseWebhookPayload,
  isPaid,
  isIncoming,
  type LnbitsWebhookPayload,
} from '../../lib/lnbits/webhook';
import { paymentService } from '../payments/service-instance';
import { getPaymentByHash } from '../payments/payments.repo';

export const webhooksRouter = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

webhooksRouter.post('/lnbits', limiter, async (req, res) => {
  const raw: Buffer =
    (req as unknown as { rawBody?: Buffer }).rawBody ??
    Buffer.from(JSON.stringify(req.body ?? {}));

  const check = verifyWebhook(raw, req.headers as unknown as Record<string, unknown>);
  if (!check.ok) {
    logger.warn({ reason: check.reason }, 'LNbits webhook verification failed');
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } });
    return;
  }

  const payload: LnbitsWebhookPayload | null = parseWebhookPayload(raw);
  if (!payload || !payload.payment_hash) {
    res.status(200).json({ ok: true, handled: false });
    return;
  }

  // Only handle incoming (received) Lightning payments we issued.
  if (!isIncoming(payload)) {
    res.status(200).json({ ok: true, handled: false });
    return;
  }

  const known = await getPaymentByHash(payload.payment_hash);
  if (!known) {
    logger.warn({ hash: payload.payment_hash }, 'webhook for unknown payment_hash');
    res.status(200).json({ ok: true, handled: false });
    return;
  }

  if (isPaid(payload)) {
    try {
      const payment = await paymentService.confirmPayment(payload.payment_hash);
      res.status(200).json({ ok: true, handled: true, paymentId: payment?.id });
      return;
    } catch (err) {
      logger.error({ err, hash: payload.payment_hash }, 'confirmPayment via webhook failed');
      res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to process webhook' } });
      return;
    }
  }

  // Not paid yet (PENDING) — ack and rely on polling to reconcile later.
  res.status(200).json({ ok: true, handled: false, pending: true });
});
