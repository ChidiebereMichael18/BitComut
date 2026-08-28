export type PaymentEventType =
  | "payment.created"
  | "payment.detected"
  | "payment.confirmed"
  | "payment.failed"
  | "settlement.processing"
  | "settlement.completed"

export interface PaymentEvent {
  type: PaymentEventType
  paymentId: string
  reference: string
  studentId: string
  studentName: string
  invoiceDescription: string
  amount: number
  currency: string
  timestamp: string
}

export type PaymentEventListener = (event: PaymentEvent) => void

export class PaymentEventBus {
  private listeners = new Set<PaymentEventListener>()

  subscribe(listener: PaymentEventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  dispatch(event: PaymentEvent): void {
    this.listeners.forEach((listener) => listener(event))
  }
}

export const paymentEvents = new PaymentEventBus()
