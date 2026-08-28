import { logger } from '../config/logger';
import { lnbits } from '../lib/lnbits/client';
import { listPendingPayments } from '../modules/payments/payments.repo';
import { PaymentService } from '../modules/payments/payments.service';
import type { SettlementProvider } from '../lib/settlement/settlement-provider';

/**
 * Polling reconciliation worker.
 *
 * Webhooks can be missed, so on a schedule (default every 30s) we poll LNbits
 * directly for any payment still Pending/Processing and confirm it if paid.
 */
export class ReconcileWorker {
  constructor(private paymentService: PaymentService) {}

  async tick(): Promise<void> {
    const pending = await listPendingPayments();
    for (const p of pending) {
      if (!p.lnbits_payment_hash) continue;
      try {
        const status = await lnbits.getPayment(p.lnbits_payment_hash);
        if (status.paid) {
          logger.info({ payment: p.id, hash: p.lnbits_payment_hash }, 'reconcile: payment paid, confirming');
          await this.paymentService.confirmPayment(p.lnbits_payment_hash);
        }
      } catch (err) {
        logger.warn({ err, payment: p.id }, 'reconcile poll failed');
      }
    }
  }
}

export function createReconcileWorker(settlementProvider: SettlementProvider): ReconcileWorker {
  const service = new PaymentService(settlementProvider);
  return new ReconcileWorker(service);
}
