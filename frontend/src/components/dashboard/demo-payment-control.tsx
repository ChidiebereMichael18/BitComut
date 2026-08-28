"use client"

import { Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { triggerDemoPayment } from "@/lib/events/demo-source"

/**
 * Demonstration-only control that emits a simulated "payment confirmed"
 * event. Clearly isolated from production real-time integration.
 */
export function DemoPaymentControl() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 border-dashed"
      onClick={() => triggerDemoPayment()}
    >
      <Zap className="size-4 text-amber-500" aria-hidden="true" />
      Simulate payment
    </Button>
  )
}
