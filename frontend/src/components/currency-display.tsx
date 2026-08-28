"use client"

import { cn } from "@/lib/utils"
import { useCurrency } from "@/components/currency-provider"

/**
 * Renders an amount in the globally selected display currency, converting
 * from the amount's source currency. Used by server components that receive
 * money values but must re-render live when the display currency changes.
 */
export function Money({
  amount,
  from = "RWF",
  className,
}: {
  amount: number
  from?: string
  className?: string
}) {
  const { format } = useCurrency()
  return (
    <span className={cn("tabular-nums", className)}>
      {format(amount, from)}
    </span>
  )
}