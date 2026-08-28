import { HandCoins, Activity, Clock, ShieldCheck } from "lucide-react"

import { getDashboardStats } from "@/lib/services/analytics"
import { getPayments } from "@/lib/services/payments"
import { getCurrentTenant } from "@/lib/tenant-server"
import { formatNumber } from "@/lib/format"
import { StatCard } from "@/components/dashboard/stat-card"
import { DateRange } from "@/components/dashboard/date-range"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { RecentPayments } from "@/components/dashboard/recent-payments"
import { Money } from "@/components/currency-display"

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export const metadata = {
  title: "Overview",
}

export default async function DashboardPage() {
  const tenant = await getCurrentTenant()
  const slug = tenant.slug
  const [stats, payments] = await Promise.all([
    getDashboardStats(slug),
    getPayments({}, slug),
  ])

  const recent = payments.slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}, Finance Team
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s what&apos;s happening with your university payments today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRange />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Received"
          value={<Money amount={stats.totalReceived} from={tenant.currency} />}
          icon={HandCoins}
          trend={{
            value: `+${stats.totalChangePct}%`,
            direction: "up",
            label: "vs previous period",
          }}
        />
        <StatCard
          title="Today's Payments"
          value={<Money amount={stats.todayAmount} from={tenant.currency} />}
          icon={Activity}
          footer={
            <p className="text-sm text-muted-foreground">
              {stats.todayCount} transaction{stats.todayCount === 1 ? "" : "s"}
            </p>
          }
        />
        <StatCard
          title="Pending Payments"
          value={formatNumber(stats.pendingPayments)}
          icon={Clock}
          footer={
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {formatNumber(stats.pendingAttention)}{" "}
              {stats.pendingAttention === 1 ? "requires" : "require"} attention
            </p>
          }
        />
        <StatCard
          title="Settled"
          value={formatNumber(stats.settledCount)}
          icon={ShieldCheck}
          footer={
            <p className="text-sm text-muted-foreground">
              {stats.settlementRate}% settlement rate
            </p>
          }
        />
      </div>

      <PaymentChart />

      <RecentPayments payments={recent} />
    </div>
  )
}
