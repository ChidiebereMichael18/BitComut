import type { Settlement, SettlementStatus } from '../../modules/types';

/**
 * SettlementProvider — pluggable BTC → fiat → bank/mobile-money payout leg.
 *
 * IMPORTANT (per project spec): Because this build uses LNbits only, there is
 * NO real BTC→fiat→bank leg. This interface is the future integration point
 * for a real payout provider for the university's country/currency corridor.
 * The only implementation shipped here, `SimulatedSettlementProvider`,
 * intentionally does NOT move real money — it only advances the settlement
 * state machine (see simulated-settlement.ts) via a DB-backed job table.
 *
 * Swapping in a real provider later requires no changes to controllers, DB
 * schema use, or the frontend contract — only this implementation.
 */
export interface SettlementProvider {
  /** Kicks off an outbound settlement/payout for a confirmed payment. */
  initiate(payment: {
    id: string;
    reference: string;
    tenantId: string;
    studentId: string;
    btcSats: number;
    localAmount: number;
    currency: string;
    exchangeRate: number;
  }): Promise<{ providerRef: string }>;

  /** Queries the provider for the current status of a settlement. */
  getStatus(providerRef: string): Promise<SettlementStatus>;

  /**
   * Called periodically by the worker for a settlement row. Returns the new
   * state to persist.
   */
  nextState(current: Settlement, elapsedMs: number): SettlementStatus;
}

export abstract class BaseSettlementProvider {
  getStatus(providerRef: string): Promise<SettlementStatus> {
    void providerRef;
    return Promise.resolve('Processing');
  }
}
