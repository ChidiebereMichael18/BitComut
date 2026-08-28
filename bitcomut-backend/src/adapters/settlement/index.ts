import { config } from "../../config";

// Settlement adapter: delivers local currency to the university.
// For the MVP, `simulated` mode returns a reference without a real bank
// integration. A `real` adapter would call a local payment provider here.
export interface SettlementResult {
  ok: boolean;
  reference?: string;
  message?: string;
}

export async function settleToUniversity(
  universityId: string,
  currency: string,
  amount: number
): Promise<SettlementResult> {
  if (config.SETTLEMENT_MODE === "simulated") {
    console.log(`[settlement] simulated ${currency} ${amount} -> university ${universityId}`);
    return { ok: true, reference: "SIM-" + Date.now().toString(36) };
  }

  // Real mode: integrate with a local payment provider here.
  throw new Error("Real settlement provider not configured");
}
