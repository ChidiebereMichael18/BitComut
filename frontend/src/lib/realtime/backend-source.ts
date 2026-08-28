import type { PaymentEvent } from "@/lib/events"
import { paymentEvents } from "@/lib/events"
import {
  subscribeToRealtime,
  type RealtimeMessage,
} from "@/lib/realtime/socket"

/**
 * Real backend realtime source.
 *
 * Opens the backend WebSocket for the active tenant and forwards payment-kind
 * messages (payment.confirmed, settlement.processing, ...) into the shared
 * `paymentEvents` bus. The message wire format matches the frontend
 * `PaymentEvent` shape 1:1, so no mapping is needed.
 */

const PAYMENT_EVENT_TYPES = new Set([
  "payment.created",
  "payment.detected",
  "payment.confirmed",
  "payment.failed",
  "settlement.processing",
  "settlement.completed",
])

function isPaymentEvent(m: RealtimeMessage): m is PaymentEvent {
  return (
    PAYMENT_EVENT_TYPES.has(String(m?.type)) &&
    typeof m?.paymentId === "string"
  )
}

/** Subscribe to the backend source for a tenant; returns an unsubscribe fn. */
export function connectBackendSource(slug: string): () => void {
  return subscribeToRealtime(slug, (msg) => {
    if (isPaymentEvent(msg)) paymentEvents.dispatch(msg)
  })
}