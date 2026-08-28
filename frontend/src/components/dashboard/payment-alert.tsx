"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { Zap, CheckCircle2 } from "lucide-react"

import { useRealTime } from "@/components/real-time-provider"
import { useCurrency } from "@/components/currency-provider"

/**
 * Surfaces real-time payment events as toasts.
 * Pure UI listener — event source wiring lives in RealTimeProvider.
 */
export function PaymentAlert() {
  const { events } = useRealTime()
  const { format } = useCurrency()
  const shownRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    for (const event of events) {
      if (shownRef.current.has(event.reference)) continue
      shownRef.current.add(event.reference)

      toast.custom(
        (id) => (
          <div
            className="flex w-72 items-start gap-3 rounded-lg border bg-background p-4 shadow-lg"
            role="status"
            aria-live="polite"
          >
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
              <Zap className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">New Payment Received</p>
                <button
                  onClick={() => toast.dismiss(id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  Dismiss
                </button>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {event.studentName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {event.invoiceDescription}
              </p>
              <p className="mt-2 text-lg font-bold">
                {format(event.amount, event.currency)}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Payment confirmed
              </p>
            </div>
          </div>
        ),
        { duration: 6000 }
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  return null
}
