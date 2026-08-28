import { pool } from '../../config/db';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { bus } from '../../lib/realtime/bus';
import {
  getWithdrawalByIdUnscoped,
  updateWithdrawalStatusByIdUnscoped,
} from './withdrawals.repo';

/**
 * Withdrawal worker — advances simulated withdrawals off the DB job table.
 *
 * State machine: Pending → Processing → Completed (or Failed).
 * Triggered by POST /api/settlement/withdraw which schedules a job in
 * `withdrawal_jobs` at now + WITHDRAWAL_DELAY_MS. This is the simulated payout
 * leg — no real money moves, by design.
 */
export class WithdrawalWorker {
  async tick(): Promise<void> {
    const due = await pool.query<{ id: string; withdrawal_id: string }>(
      `SELECT id, withdrawal_id FROM withdrawal_jobs
       WHERE state='scheduled' AND run_at <= now()`,
    );
    for (const row of due.rows) {
      const w = await getWithdrawalByIdUnscoped(row.withdrawal_id);
      if (!w) continue;
      await updateWithdrawalStatusByIdUnscoped(w.id, 'Processing');
      await pool.query(
        `UPDATE withdrawal_jobs SET state='processing', updated_at=now() WHERE id=$1`,
        [row.id],
      );
      bus.emitWithdrawalStatus(w.tenant_id, {
        id: w.id,
        reference: w.reference,
        status: 'Processing',
        updatedAt: new Date().toISOString(),
      });
      logger.info({ withdrawal: w.id }, 'withdrawal -> Processing');
    }

    const processing = await pool.query<{ id: string; withdrawal_id: string }>(
      `SELECT id, withdrawal_id FROM withdrawal_jobs WHERE state='processing'`,
    );
    for (const row of processing.rows) {
      const w = await getWithdrawalByIdUnscoped(row.withdrawal_id);
      if (!w) continue;
      await updateWithdrawalStatusByIdUnscoped(w.id, 'Completed', new Date());
      await pool.query(
        `UPDATE withdrawal_jobs SET state='completed', updated_at=now() WHERE id=$1`,
        [row.id],
      );
      bus.emitWithdrawalStatus(w.tenant_id, {
        id: w.id,
        reference: w.reference,
        status: 'Completed',
        updatedAt: new Date().toISOString(),
      });
      logger.info({ withdrawal: w.id }, 'withdrawal -> Completed');
    }
  }
}

/** Schedule a withdrawal job at now + delay. */
export async function scheduleWithdrawalJob(withdrawalId: string, tenantId: string): Promise<void> {
  const runAt = new Date(Date.now() + env.WITHDRAWAL_DELAY_MS);
  await pool.query(
    `INSERT INTO withdrawal_jobs (id, withdrawal_id, tenant_id, provider_ref, state, run_at)
     VALUES ($1, $2, $3, $4, 'scheduled', $5)`,
    [`job_${Math.random().toString(36).slice(2, 14)}`, withdrawalId, tenantId, `sim-${withdrawalId}`, runAt],
  );
}
