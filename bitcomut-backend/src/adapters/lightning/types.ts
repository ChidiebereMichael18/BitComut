// Payment rail abstraction.
//
// The platform's core promise: students pay in local currency, we convert
// to BTC and move it over Lightning, then settle to the university in its
// local currency. End users never touch Bitcoin.
//
// This file defines the interfaces. The Lightning adapter talks to LND;
// the settlement adapter simulates (or later performs real) local
// currency settlement.

export interface PaymentRequest {
  amountSat: number;
  memo?: string;
}

export interface GeneratedInvoice {
  paymentRequest: string;
  paymentHash: string;
  addIndex?: string;
}

export interface PaymentStatus {
  settled: boolean;
  amountSat: number | null;
  preimage?: string | null;
}

export interface NodeBalance {
  // total spendable/confirmed balance on the node (channels + wallet)
  totalSat: number;
  onChainSat: number;
  channelSat: number;
}

export interface LightningRail {
  readonly kind: string;
  createInvoice(req: PaymentRequest): Promise<GeneratedInvoice>;
  lookupInvoice(paymentHash: string): Promise<PaymentStatus>;
  getBalance(): Promise<NodeBalance>;
}
