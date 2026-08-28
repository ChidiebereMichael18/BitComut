"use client"

import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

interface PageErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function PageError({
  title = "Something went wrong",
  message = "We couldn't load this data. Please try again.",
  onRetry,
}: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlert className="size-6 text-destructive" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button onClick={onRetry}>Try Again</Button>
      ) : null}
    </div>
  )
}
