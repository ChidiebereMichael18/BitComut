import crypto from "crypto";
import { LightningRail, PaymentRequest, GeneratedInvoice, PaymentStatus, NodeBalance } from "./types";

// Simulated Lightning rail. Mirrors the LND interface so the whole app can
// run configurable without a live node — important while protecting a 4GB
// development machine. Swap to LndRail when a real node is reachable.
export class SimulatedRail implements LightningRail {
  readonly kind = "simulated";
  private settled: Map<string, boolean> = new Map();
  private simulatedSats = 1_000_000;

  async createInvoice(req: PaymentRequest): Promise<GeneratedInvoice> {
    const paymentHash = crypto.randomBytes(32).toString("hex");
    const paymentRequest = "lnbcrt_sim_" + paymentHash;
    this.settled.set(paymentHash, false);
    return { paymentRequest, paymentHash };
  }

  async lookupInvoice(paymentHash: string): Promise<PaymentStatus> {
    return { settled: this.settled.get(paymentHash) ?? false, amountSat: null };
  }

  async getBalance(): Promise<NodeBalance> {
    return { totalSat: this.simulatedSats, onChainSat: this.simulatedSats, channelSat: 0 };
  }

  // Test helper — simulates a payer settling the invoice.
  async simulateSettlement(paymentHash: string, amountSat?: number): Promise<void> {
    this.settled.set(paymentHash, true);
  }
}
