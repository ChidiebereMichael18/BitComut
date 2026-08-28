import { GraduationCap } from "lucide-react"

import { cn } from "@/lib/utils"
import { APP_NAME } from "@/lib/constants"

export const LOGO_COLOR_CLASSES: Record<string, string> = {
  indigo: "bg-indigo-600 text-white",
  emerald: "bg-emerald-600 text-white",
  amber: "bg-amber-500 text-white",
  rose: "bg-rose-600 text-white",
  sky: "bg-sky-600 text-white",
  violet: "bg-violet-600 text-white",
}

interface LogoProps {
  name: string
  shortName: string
  color?: string
  className?: string
}

export function Logo({ name, shortName, color = "indigo", className }: LogoProps) {
  const colorClass = LOGO_COLOR_CLASSES[color] ?? LOGO_COLOR_CLASSES.indigo
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", colorClass)}>
        <GraduationCap className="size-5" aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold" title={name}>{shortName}</span>
        <span className="truncate text-xs text-muted-foreground">
          {APP_NAME}
        </span>
      </div>
    </div>
  )
}
