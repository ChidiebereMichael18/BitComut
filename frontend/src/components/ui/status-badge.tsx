import {
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  TriangleAlert,
  XCircle,
  FileX,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

interface StatusConfig {
  label: string
  icon: LucideIcon
  className: string
  iconClassName: string
}

const EMPTY = {
  iconClassName: "text-muted-foreground",
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  Paid: {
    label: "Paid",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  Settled: {
    label: "Settled",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  Completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  "Fully Paid": {
    label: "Fully Paid",
    icon: Check,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  Pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
  "Settlement Pending": {
    label: "Settlement Pending",
    icon: Clock,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    iconClassName: "text-sky-600 dark:text-sky-400",
  },
  Processing: {
    label: "Processing",
    icon: Loader2,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    iconClassName: "text-sky-600 dark:text-sky-400 animate-spin",
  },
  "Partially Paid": {
    label: "Partially Paid",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
  Failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
    iconClassName: "text-destructive",
  },
  Unpaid: {
    label: "Unpaid",
    icon: Clock,
    className: "bg-muted text-muted-foreground",
    iconClassName: "text-muted-foreground",
  },
  Refunded: {
    label: "Refunded",
    icon: RotateCcw,
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    iconClassName: "text-violet-600 dark:text-violet-400",
  },
  Overdue: {
    label: "Overdue",
    icon: TriangleAlert,
    className: "bg-destructive/10 text-destructive",
    iconClassName: "text-destructive",
  },
  Cancelled: {
    label: "Cancelled",
    icon: FileX,
    className: "bg-muted text-muted-foreground",
    iconClassName: "text-muted-foreground",
  },
  Outstanding: {
    label: "Outstanding",
    icon: TriangleAlert,
    className: "bg-destructive/10 text-destructive",
    iconClassName: "text-destructive",
  },
  "No Invoices": {
    label: "No Invoices",
    icon: FileX,
    className: "bg-muted text-muted-foreground",
    iconClassName: "text-muted-foreground",
  },
}

interface StatusBadgeProps {
  status: string
  className?: string
  iconClassName?: string
}

export function StatusBadge({ status, className, iconClassName }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    icon: Clock,
    className: "bg-muted text-muted-foreground",
    ...EMPTY,
  }
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon
        className={cn("size-3.5 shrink-0", config.iconClassName, iconClassName)}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  )
}
