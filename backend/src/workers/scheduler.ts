import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { paymentService } from '../modules/payments/service-instance';
import { SettlementWorker } from '../modules/settlements/settlement.worker';
import { WithdrawalWorker } from '../modules/withdrawals/withdrawal.worker';
import { ReconcileWorker } from './reconcile.worker';

/**
 * Background schedulers.
 *
 * - settlement worker: drives simulated Pending → Processing → Settled.
 * - withdrawal worker: drives simulated Pending → Processing → Completed.
 * - reconcile worker: polls LNbits for missed payment webhooks.
 */
export function startSchedulers(): void {
  const settlementWorker = new SettlementWorker();
  const withdrawalWorker = new WithdrawalWorker();
  const reconcileWorker = new ReconcileWorker(paymentService);

  // Run once shortly after boot, then on schedule.
  const runSettlement = () => {
    settlementWorker.tick().catch((err) => logger.error({ err }, 'settlement tick failed'));
  };
  const runWithdrawal = () => {
    withdrawalWorker.tick().catch((err) => logger.error({ err }, 'withdrawal tick failed'));
  };
  const runReconcile = () => {
    reconcileWorker.tick().catch((err) => logger.error({ err }, 'reconcile tick failed'));
  };

  setTimeout(runSettlement, 2000);
  setTimeout(runWithdrawal, 2500);

  cron.schedule('*/5 * * * * *', runSettlement); // every 5s
  cron.schedule('*/5 * * * * *', runWithdrawal);
  cron.schedule(env.RECONCILE_CRON, runReconcile);

  logger.info(
    { reconcile: env.RECONCILE_CRON },
    'Background schedulers started (settlement, withdrawal, reconcile)',
  );
}
