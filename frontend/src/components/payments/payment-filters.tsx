"use client"

import { Search, SlidersHorizontal } from "lucide-react"

import { CURRENCY_OPTIONS } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export const PAYMENT_STATUSES = [
  "Paid",
  "Pending",
  "Processing",
  "Failed",
  "Refunded",
  "Settlement Pending",
  "Settled",
] as const

export const SETTLEMENT_STATUSES = ["Settled", "Pending"] as const

export const PAYMENT_METHODS = [
  "Bitcoin / Lightning",
  "Lightning Network",
] as const

export interface FilterState {
  search: string
  status: string
  settlement: string
  method: string
  currency: string
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  status: "",
  settlement: "",
  method: "",
  currency: "",
}

interface PaymentFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
}

export function PaymentFilters({ filters, onChange, onClear }: PaymentFiltersProps) {
  const activeCount = [
    filters.status,
    filters.settlement,
    filters.method,
    filters.currency,
  ].filter(Boolean).length

  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search name, ID, invoice, transaction, LN ref..."
            className="pl-9"
            aria-label="Search payments"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={filters.status} onValueChange={(v) => set({ status: v })}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                More filters
                {activeCount > 0 && <Badge className="ml-1 h-5 px-1.5">{activeCount}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Payment method</label>
                <Select value={filters.method} onValueChange={(v) => set({ method: v })}>
                  <SelectTrigger aria-label="Filter by method">
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Settlement</label>
                <Select value={filters.settlement} onValueChange={(v) => set({ settlement: v })}>
                  <SelectTrigger aria-label="Filter by settlement">
                    <SelectValue placeholder="All settlements" />
                  </SelectTrigger>
                  <SelectContent>
                    {SETTLEMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Currency</label>
                <Select value={filters.currency} onValueChange={(v) => set({ currency: v })}>
                  <SelectTrigger aria-label="Filter by currency">
                    <SelectValue placeholder="All currencies" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-2">
                          <span aria-hidden="true">{c.flag}</span>
                          <span>{c.code}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.symbol}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={onClear}>
                Clear filters
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {activeCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            {activeCount} active filter{activeCount === 1 ? "" : "s"}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Showing all payments
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={activeCount === 0 && filters.search === ""}
        >
          Clear all
        </Button>
      </div>
    </div>
  )
}
