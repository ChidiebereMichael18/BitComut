import type { PaymentEvent, PaymentEventListener, PaymentEventSource } from "@/lib/events"
import { paymentEvents } from "@/lib/events"

/**
 * Demo-only event source for the hackathon demonstration.
 *
 * This does NOT connect to the production backend or a real Lightning
 * node. It is explicitly isolated so it can be removed/replaced by the
 * real WebSocket integration without touching production UI logic.
 */

interface DemoStudent {
  studentId: string
  studentName: string
  invoiceDescription: string
  amount: number
}

const DEMO_STUDENTS: DemoStudent[] = [
  {
    studentId: "STU-2026-0042",
    studentName: "John Doe",
    invoiceDescription: "Tuition — Semester 1",
    amount: 1500000,
  },
  {
    studentId: "STU-2026-0196",
    studentName: "Ariane Mukeshimana",
    invoiceDescription: "Tuition — Semester 1",
    amount: 1500000,
  },
  {
    studentId: "STU-2026-0051",
    studentName: "Alice Mukamana",
    invoiceDescription: "Registration — Semester 1",
    amount: 150000,
  },
]

let counter = 0

export function buildDemoPaymentEvent(): PaymentEvent {
  const student = DEMO_STUDENTS[counter % DEMO_STUDENTS.length]
  counter += 1
  const seq = 9000 + counter
  const ts = new Date().toISOString()
  return {
    type: "payment.confirmed",
    paymentId: `PAY-DEMO-${seq}`,
    reference: `PAY-DEMO-${seq}`,
    studentId: student.studentId,
    studentName: student.studentName,
    invoiceDescription: student.invoiceDescription,
    amount: student.amount,
    currency: "RWF",
    timestamp: ts,
  }
}

class DemoPaymentSource implements PaymentEventSource {
  private listeners = new Set<PaymentEventListener>()

  subscribe(listener: PaymentEventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  disconnect(): void {
    this.listeners.clear()
  }

  emitDemoEvent(): void {
    const event = buildDemoPaymentEvent()
    this.listeners.forEach((listener) => listener(event))
  }
}

export const demoEventSource = new DemoPaymentSource()

/** Wire the demo source into the shared bus. Safe to call more than once. */
export function connectDemoSource(): void {
  paymentEvents.connect(demoEventSource)
}

/** Emit one demo "payment confirmed" event through the shared bus. */
export function triggerDemoPayment(): void {
  const event = buildDemoPaymentEvent()
  paymentEvents.dispatch(event)
}
