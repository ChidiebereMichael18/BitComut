import { Check, Loader2 } from "lucide-react"

import type { Settlement } from "@/lib/types"
import { cn } from "@/lib/utils"

type StepState = "done" | "active" | "pending"

const STEPS = [
  "Bitcoin Payment",
  "Payment Confirmed",
  "Conversion",
  "Settlement",
  "University Account",
]

function statesFor(status: Settlement["status"]): StepState[] {
  switch (status) {
    case "Settled":
      return ["done", "done", "done", "done", "done"]
    case "Processing":
      return ["done", "done", "done", "active", "pending"]
    case "Pending":
      return ["done", "done", "active", "pending", "pending"]
    case "Failed":
      return ["done", "done", "done", "pending", "pending"]
    default:
      return ["done", "done", "done", "done", "done"]
  }
}

export function SettlementTimeline({ settlement }: { settlement: Settlement }) {
  const states = statesFor(settlement.status)

  return (
    <ol className="relative space-y-0">
      {STEPS.map((label, index) => {
        const state = states[index]
        const isLast = index === STEPS.length - 1
        return (
          <li key={label} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-7 left-3.5 h-full w-px",
                  state === "done" ? "bg-emerald-500/40" : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                state === "done" && "border-emerald-500 bg-emerald-500 text-white",
                state === "active" && "border-sky-500 bg-background text-sky-500",
                state === "pending" && "border-border bg-background text-muted-foreground"
              )}
              aria-hidden="true"
            >
              {state === "done" ? (
                <Check className="size-3.5" />
              ) : state === "active" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </div>
            <p
              className={cn(
                "pt-1 text-sm font-medium",
                state === "pending" && "text-muted-foreground"
              )}
            >
              {label}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
