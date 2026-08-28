import { SimulatedSettlementProvider } from './simulated-settlement';
import type { SettlementProvider } from './settlement-provider';

/**
 * Singleton settlement provider.
 *
 * SHIPPED IMPLEMENTATION IS SIMULATED by design — see simulated-settlement.ts
 * and the README. To plug in a real payout provider, replace this instance with
 * a real implementation; no other code needs to change.
 */
export const settlementProvider: SettlementProvider =
  new SimulatedSettlementProvider();
