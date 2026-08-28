"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import type { PaymentEvent } from "@/lib/events"
import { paymentEvents } from "@/lib/events"
import { connectBackendSource } from "@/lib/realtime/backend-source"
import { playSettlementChime } from "@/lib/sounds"
import { useTenant } from "@/components/tenant-provider"

interface RealTimeContextValue {
  latestEvent: PaymentEvent | null
  events: PaymentEvent[]
  clear: () => void
}

const RealTimeContext = createContext<RealTimeContextValue>({
  latestEvent: null,
  events: [],
  clear: () => {},
})

export function useRealTime() {
  return useContext(RealTimeContext)
}

export function RealTimeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [events, setEvents] = useState<PaymentEvent[]>([])
  const tenant = useTenant()
  const slug = tenant.slug

  useEffect(() => {
    // Connect the backend WebSocket source for the active tenant so real
    // payment/settlement events flow into the shared bus.
    const stop = connectBackendSource(slug)

    const unsubscribe = paymentEvents.subscribe((event) => {
      setEvents((prev) => [event, ...prev].slice(0, 20))
      if (
        event.type === "payment.confirmed" ||
        event.type === "settlement.completed"
      ) {
        if (!document.hidden) {
          playSettlementChime()
        }
      }
    })

    return () => {
      stop()
      unsubscribe()
    }
  }, [slug])

  const clear = useCallback(() => {
    setEvents([])
  }, [])

  // Events are stored newest-first, so the latest one is simply the head of
  // the list. Deriving it (instead of mirroring it in a ref) keeps the value
  // consistent during render with no stale reads.
  const value = useMemo<RealTimeContextValue>(
    () => ({
      latestEvent: events[0] ?? null,
      events,
      clear,
    }),
    [events, clear]
  )

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  )
}
