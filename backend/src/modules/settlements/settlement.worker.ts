import { pool } from '../../config/db';
import { logger } from '../../config/logger';
import { bus } from '../../lib/realtime/bus';
import {
  getSettlementByIdUnscoped,
  updateSettlementStatus,
} from '../settlements/settlements.repo';
import {
  updatePaymentByIdUnscopedStatus,
} from '../payments/settlement-payments';

/**
 * Settlement worker — advances simulated settlements off the DB job table.
 *
 * State machine: Pending → Processing → Settled.
 * On reaching Settled, marks Payment.status = 'Settled' (feeds
 * SettlementBalance.totalCollected) and emits realtime events.
 */
export class SettlementWorker {
  async tick(): Promise<void> {
    // 1. due 'scheduled' jobs → start processing
    const due = await pool.query<{ id: string; settlement_id: string }>(
      `SELECT id, settlement_id FROM settlement_jobs
       WHERE state='scheduled' AND run_at <= now()`,
    );
    for (const row of due.rows) {
      const s = await getSettlementByIdUnscoped(row.settlement_id);
      if (!s) continue;
      await updateSettlementStatus(s.id, 'Processing');
      await pool.query(
        `UPDATE settlement_jobs SET state='processing', updated_at=now() WHERE id=$1`,
        [row.id],
      );
      bus.emitSettlementStatus(s.tenant_id, {
        id: s.id,
        reference: s.reference,
        status: 'Processing',
        tenantId: s.tenant_id,
        paymentId: s.payment_id,
        updatedAt: new Date().toISOString(),
      });
      logger.info({ settlement: s.id }, 'settlement -> Processing');
    }

    // 2. 'processing' jobs → complete (simulated)
    const processing = await pool.query<{ id: string; settlement_id: string }>(
      `SELECT id, settlement_id FROM settlement_jobs WHERE state='processing'`,
    );
    for (const row of processing.rows) {
      const s = await getSettlementByIdUnscoped(row.settlement_id);
      if (!s) continue;
      await updateSettlementStatus(s.id, 'Settled');
      await pool.query(
        `UPDATE settlement_jobs SET state='settled', updated_at=now() WHERE id=$1`,
        [row.id],
      );
      // Mark the payment Settled → this feeds totalCollected.
      const p = await updatePaymentByIdUnscopedStatus(s.payment_id, 'Settled', {
        settlementDate: new Date(),
      });
      bus.emitSettlementStatus(s.tenant_id, {
        id: s.id,
        reference: s.reference,
        status: 'Settled',
        tenantId: s.tenant_id,
        paymentId: s.payment_id,
        updatedAt: new Date().toISOString(),
      });
      if (p) {
        bus.emitPayment(s.tenant_id, {
          type: 'settlement.completed',
          paymentId: p.id,
          reference: p.reference,
          studentId: p.student_id,
          studentName: p.student_name ?? '',
          invoiceDescription: p.invoice_description ?? '',
          amount: Number(p.amount),
          currency: p.currency,
          timestamp: new Date().toISOString(),
        });
      }
      logger.info({ settlement: s.id }, 'settlement -> Settled');
    }
  }
}
