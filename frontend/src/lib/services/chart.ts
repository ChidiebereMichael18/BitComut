import { apiRequest } from "@/lib/api/client"

export interface ChartPoint {
  date: string
  volume: number
  count: number
}

interface ChartRow {
  date: string
  volume: number
  count: number
}

export async function getChartSeries(
  range: "7D" | "30D" | "90D",
  slug?: string
): Promise<ChartPoint[]> {
  if (!slug) return []
  const rows = await apiRequest<ChartRow[]>(
    `/api/dashboard/chart?period=${range}`,
    { slug }
  )
  return rows.map((p) => ({
    date: p.date,
    volume: Number(p.volume ?? 0),
    count: Number(p.count ?? 0),
  }))
}