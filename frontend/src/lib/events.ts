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

export interface PaymentEventSource {
  subscribe(listener: PaymentEventListener): () => void
  disconnect(): void
}

export class PaymentEventBus implements PaymentEventSource {
  private listeners = new Set<PaymentEventListener>()
  private source: PaymentEventSource | null = null

  subscribe(listener: PaymentEventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  connect(source: PaymentEventSource): void {
    this.source = source
  }

  disconnect(): void {
    this.source?.disconnect()
    this.source = null
  }

  dispatch(event: PaymentEvent): void {
    this.listeners.forEach((listener) => listener(event))
  }
}

export const paymentEvents = new PaymentEventBus()
