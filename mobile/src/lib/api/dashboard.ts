import type { Payment } from "@/lib/types"
import { apiRequest } from "@/lib/api/client"

export interface DashboardStats {
  totalReceived: number
  totalChangePct: number
  todayAmount: number
  todayCount: number
  pendingPayments: number
  pendingAttention: number
  settledCount: number
  totalPayments: number
  settlementRate: number
}

function isToday(date: string): boolean {
  const d = new Date(date)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

interface BackendStats {
  totalReceived: number
  totalInvoiced: number
  totalOutstanding: number
  totalWithdrawn: number
  collectionRate: number
  settlementRate: number
  todayAmount: number
  recentPayments: unknown[]
}

export async function getDashboardStats(slug?: string): Promise<DashboardStats> {
  if (!slug) {
    return {
      totalReceived: 0,
      totalChangePct: 0,
      todayAmount: 0,
      todayCount: 0,
      pendingPayments: 0,
      pendingAttention: 0,
      settledCount: 0,
      totalPayments: 0,
      settlementRate: 0,
    }
  }
  const [stats, payments] = await Promise.all([
    apiRequest<BackendStats>("/api/dashboard/stats", { slug }),
    apiRequest<Payment[]>("/api/payments?limit=100", { slug }),
  ])

  const today = payments.filter((p) => isToday(p.date))
  const pendingCount = payments.filter(
    (p) => p.status === "Pending" || p.status === "Settlement Pending"
  ).length
  const pendingAttention = payments.filter(
    (p) => p.status === "Pending" || p.status === "Failed"
  ).length
  const settledCount = payments.filter((p) => p.status === "Settled").length

  const DAY = 86_400_000
  const now = Date.now()
  const cur = payments
    .filter((p) => now - new Date(p.date).getTime() < 7 * DAY)
    .reduce((s, p) => s + p.amount, 0)
  const prev = payments
    .filter((p) => {
      const t = new Date(p.date).getTime()
      return t >= now - 14 * DAY && t < now - 7 * DAY
    })
    .reduce((s, p) => s + p.amount, 0)
  const totalChangePct =
    prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur > 0 ? 100 : 0

  return {
    totalReceived: stats.totalReceived,
    totalChangePct,
    todayAmount: stats.todayAmount,
    todayCount: today.length,
    pendingPayments: pendingCount,
    pendingAttention,
    settledCount,
    totalPayments: payments.length,
    settlementRate: Math.round(stats.settlementRate * 1000) / 10,
  }
}

export interface ChartPoint {
  date: string
  volume: number
  count: number
}

export async function getChartSeries(
  range: "7D" | "30D" | "90D",
  slug?: string
): Promise<ChartPoint[]> {
  if (!slug) return []
  const rows = await apiRequest<ChartPoint[]>(
    `/api/dashboard/chart?period=${range}`,
    { slug }
  )
  return rows.map((p) => ({
    date: p.date,
    volume: Number(p.volume ?? 0),
    count: Number(p.count ?? 0),
  }))
}
