import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: React.ReactNode
  icon: LucideIcon
  trend?: {
    value: string
    direction: "up" | "down" | "neutral"
    label: string
  }
  footer?: React.ReactNode
  iconClassName?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  footer,
  iconClassName,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn("size-4 text-muted-foreground", iconClassName)}
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {trend ? (
          <div className="mt-1 flex items-center gap-1 text-sm">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                trend.direction === "up" && "text-emerald-600 dark:text-emerald-400",
                trend.direction === "down" && "text-destructive",
                trend.direction === "neutral" && "text-muted-foreground"
              )}
            >
              {trend.direction === "up" && (
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              )}
              {trend.direction === "down" && (
                <ArrowDownRight className="size-3.5" aria-hidden="true" />
              )}
              {trend.value}
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        ) : null}
        {footer ? <div className="mt-2">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}
