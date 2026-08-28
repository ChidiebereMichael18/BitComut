"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ChartPoint } from "@/lib/services/chart"
import { getChartSeries } from "@/lib/services/chart"
import { useTenant } from "@/components/tenant-provider"
import { useCurrency } from "@/components/currency-provider"
import { useAsync } from "@/hooks/use-async"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const chartConfig = {
  volume: {
    label: "Payment volume",
    color: "var(--chart-1)",
  },
  count: {
    label: "Transactions",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const METRICS = ["volume", "count"] as const
type Metric = (typeof METRICS)[number]

const RANGES = ["7D", "30D", "90D"] as const

function rangeLabel(range: (typeof RANGES)[number]) {
  switch (range) {
    case "7D":
      return "Last 7 days"
    case "30D":
      return "Last 30 days"
    default:
      return "Last 90 days"
  }
}

export function PaymentChart() {
  const tenant = useTenant()
  const { format } = useCurrency()
  const [activeChart, setActiveChart] = useState<Metric>("volume")
  const [range, setRange] = useState<(typeof RANGES)[number]>("30D")
  const { data, loading } = useAsync(
    () => getChartSeries(range, tenant.slug),
    [range, tenant.slug]
  )

  const points: ChartPoint[] = data ?? []
  const totalVolume = points.reduce((sum, p) => sum + p.volume, 0)
  const totalCount = points.reduce((sum, p) => sum + p.count, 0)
  const totals = { volume: totalVolume, count: totalCount }

  return (
    <Card className="py-0">
      <div className="flex flex-col items-stretch border-b sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0">
          <CardTitle>Payment Analytics</CardTitle>
          <CardDescription>
            {rangeLabel(range)} · {format(totalVolume, tenant.currency)} across{" "}
            {totalCount} transactions
          </CardDescription>
          <div className="mt-2 inline-flex w-fit items-center gap-1 rounded-lg border p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  range === r
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex">
          {METRICS.map((key) => {
            const chart = key as Metric
            return (
              <button
                key={chart}
                type="button"
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {chart === "volume"
                    ? format(totals.volume, tenant.currency)
                    : totals.count.toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-2 sm:p-6">
        {loading || !data ? (
          <div className="flex h-[250px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No payment activity in this period.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart
              accessibilityLayer
              data={points}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="w-[170px]"
                    labelKey="date"
                    labelFormatter={(value) =>
                      new Date(String(value)).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                    formatter={(value) =>
                      activeChart === "volume"
                        ? format(Number(value), tenant.currency)
                        : Number(value).toLocaleString()
                    }
                  />
                }
              />
              <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </Card>
  )
}