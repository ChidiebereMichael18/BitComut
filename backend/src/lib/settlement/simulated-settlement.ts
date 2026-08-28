import { pool } from '../../config/db';
import { env } from '../../config/env';
import type {
  Settlement,
  SettlementStatus,
} from '../../modules/types';
import type { SettlementProvider } from './settlement-provider';

/**
 * SimulatedSettlementProvider
 *
 * Implements the SettlementProvider interface without moving real money.
 * It models the future BTC→fiat→bank/mobile-money payout via a DB-backed job
 * table (`settlement_jobs`) rather than in-process timers, so the behavior
 * survives server restarts and is testable. A worker cron tick advances
 *   Pending → Processing → Settled
 * over a short, configurable delay (SETTLEMENT_DELAY_MS).
 *
 * When a settlement reaches Settled the worker marks the parent
 * Payment.status = 'Settled', which is what feeds SettlementBalance.totalCollected.
 *
 * This layer is the future integration point for a real payout provider; it is
 * intentionally NOT wired to move real money.
 */
export class SimulatedSettlementProvider implements SettlementProvider {
  constructor(private delayMs: number = env.SETTLEMENT_DELAY_MS) {}

  async initiate(payment: {
    id: string;
    reference: string;
    tenantId: string;
    studentId: string;
    btcSats: number;
    localAmount: number;
    currency: string;
    exchangeRate: number;
  }): Promise<{ providerRef: string }> {
    const providerRef = `sim-${payment.id}`;
    const runAt = new Date(Date.now() + this.delayMs);

    // There is (by design) exactly one settlement per payment.
    const settled = await pool.query<{ id: string }>(
      `SELECT id FROM settlement_jobs WHERE settlement_id=$1`,
      [payment.id],
    );
    const jobId = settled.rows[0]?.id ?? `job_${Math.random().toString(36).slice(2, 14)}`;

    if (!settled.rows[0]) {
      await pool.query(
        `INSERT INTO settlement_jobs (id, settlement_id, tenant_id, provider_ref, state, run_at)
         VALUES ($1, $2, $3, $4, 'scheduled', $5)`,
        [jobId, payment.id, payment.tenantId, providerRef, runAt],
      );
    } else {
      await pool.query(
        `UPDATE settlement_jobs SET run_at=$2, state='scheduled', attempts=0, updated_at=now()
         WHERE id=$1`,
        [jobId, runAt],
      );
    }

    return { providerRef };
  }

  async getStatus(_providerRef: string): Promise<SettlementStatus> {
    return 'Processing';
  }

  /** Simulated progression based on elapsed time since creation. */
  nextState(current: Settlement, _elapsedMs: number): SettlementStatus {
    // In a real provider this would query the payout provider. Simulated:
    // Pending → Processing → Settled on successive worker ticks.
    if (current.status === 'Pending') return 'Processing';
    if (current.status === 'Processing') return 'Settled';
    if (current.status === 'Failed') return 'Failed';
    return 'Settled';
  }
}
