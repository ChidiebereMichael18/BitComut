import { EventEmitter } from 'events';

/**
 * Realtime bus — per-tenant pub/sub.
 *
 * Events are emitted ONLY by real state transitions (LNbits webhook/poll →
 * confirmed → settlement worker → settled → payout worker). There is no
 * synthetic/demo timer that fakes progress here; that pattern belongs only in
 * the (now obsolete) frontend mock layer.
 *
 * The WebSocket server subscribes to this bus and fans events out per tenant.
 */

export type PaymentEventType =
  | 'payment.created'
  | 'payment.detected'
  | 'payment.confirmed'
  | 'payment.failed'
  | 'settlement.processing'
  | 'settlement.completed';

export interface PaymentEvent {
  type: PaymentEventType;
  paymentId: string;
  reference: string;
  studentId: string;
  studentName: string;
  invoiceDescription: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface WithdrawalStatusEvent {
  id: string;
  reference: string;
  status: string;
  updatedAt: string;
}

export interface SettlementStatusEvent {
  id: string;
  reference: string;
  status: string;
  tenantId: string;
  paymentId: string;
  updatedAt: string;
}

/**
 * Each message carries a tenantId so the WS server can route to the right
 * tenant room. Using a single global emitter + tenantId-tagged payloads keeps
 * the bus simple and lets one WS connection serve all tenants via rooms.
 */
type BusPayload =
  | { tenantId: string; kind: 'payment'; data: PaymentEvent }
  | { tenantId: string; kind: 'withdrawal'; data: WithdrawalStatusEvent }
  | { tenantId: string; kind: 'settlement'; data: SettlementStatusEvent };

class RealtimeBus {
  private emitter = new EventEmitter();
  private channel = 'bitcomut';

  private publish(payload: BusPayload) {
    // single listener; payloads are tenant-tagged
    this.emitter.emit(this.channel, payload);
  }

  emitPayment(tenantId: string, ev: PaymentEvent) {
    this.publish({ tenantId, kind: 'payment', data: ev });
  }

  emitWithdrawalStatus(tenantId: string, ev: WithdrawalStatusEvent) {
    this.publish({ tenantId, kind: 'withdrawal', data: ev });
  }

  emitSettlementStatus(tenantId: string, ev: SettlementStatusEvent) {
    this.publish({ tenantId, kind: 'settlement', data: ev });
  }

  /** Subscribe to all realtime messages. Returns unsubscribe fn. */
  subscribe(listener: (payload: BusPayload) => void): () => void {
    this.emitter.on(this.channel, listener);
    return () => this.emitter.removeListener(this.channel, listener);
  }
}

export const bus = new RealtimeBus();
export type { BusPayload };
