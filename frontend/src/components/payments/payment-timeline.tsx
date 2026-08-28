import { Check, Loader2 } from "lucide-react"

import type { Payment } from "@/lib/types"
import { cn } from "@/lib/utils"

type StepState = "done" | "active" | "pending"

interface Step {
  label: string
  description: string
}

function buildSteps(payment: Payment): Array<{ step: Step; state: StepState }> {
  const steps: Step[] = [
    { label: "Invoice Created", description: "Invoice issued to student" },
    { label: "Payment Requested", description: "Lightning invoice generated" },
    { label: "Lightning Payment Detected", description: "Payment seen on the network" },
    { label: "Payment Confirmed", description: "Payment settled on Lightning" },
    { label: "Settlement Processed", description: "Converted to local currency" },
    { label: "Completed", description: "Records updated, receipt generated" },
  ]

  const map = (): StepState[] => {
    switch (payment.status) {
      case "Settled":
        return ["done", "done", "done", "done", "done", "done"]
      case "Settlement Pending":
        return ["done", "done", "done", "done", "active", "pending"]
      case "Processing":
        return ["done", "done", "done", "active", "pending", "pending"]
      case "Paid":
        return ["done", "done", "done", "done", "pending", "pending"]
      case "Pending":
        return ["done", "done", "active", "pending", "pending", "pending"]
      case "Failed":
        return ["done", "done", "done", "pending", "pending", "pending"]
      default:
        return ["done", "done", "done", "done", "done", "done"]
    }
  }

  const states = map()
  return steps.map((step, i) => ({ step, state: states[i] }))
}

export function PaymentTimeline({ payment }: { payment: Payment }) {
  const steps = buildSteps(payment)

  return (
    <ol className="relative space-y-0">
      {steps.map(({ step, state }, index) => {
        const isLast = index === steps.length - 1
        return (
          <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
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
            <div className="min-w-0 pt-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  state === "pending" && "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
