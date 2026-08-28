import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

export function LoadingSpinner({
  className,
  label = "Loading...",
}: {
  className?: string
  label?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}
    >
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}
