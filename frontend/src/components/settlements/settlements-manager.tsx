"use client"

import { useMemo, useState } from "react"
import { Search, ArrowLeftRight } from "lucide-react"

import { getSettlements, type SettlementDetail } from "@/lib/services/settlements"
import { useAsync } from "@/hooks/use-async"
import { useTenantSlug } from "@/components/tenant-provider"
import { SettlementTable } from "@/components/settlements/settlement-table"
import { PaginationControls } from "@/components/shared/pagination"
import { EmptyState } from "@/components/shared/empty-state"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAGE_SIZE = 10

const STATUS_FILTERS = ["All", "Pending", "Processing", "Settled", "Failed"] as const

export function SettlementsManager() {
  const slug = useTenantSlug()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("All")
  const [page, setPage] = useState(1)

  const { data: settlements, loading } = useAsync<SettlementDetail[]>(
    () => getSettlements(slug),
    [slug]
  )

  const filtered = useMemo(() => {
    if (!settlements) return []
    const q = search.toLowerCase()
    return settlements.filter((s) => {
      const matchesSearch =
        !q ||
        s.reference.toLowerCase().includes(q) ||
        s.paymentReference.toLowerCase().includes(q) ||
        s.studentName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
      const matchesStatus = status === "All" || s.status === status
      return matchesSearch && matchesStatus
    })
  }, [settlements, search, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const clear = () => {
    setSearch("")
    setStatus("All")
    setPage(1)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatus = (value: string) => {
    setStatus(value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search settlement, payment, or student..."
            className="pl-9"
            aria-label="Search settlements"
          />
        </div>
        <Select value={status} onValueChange={handleStatus}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No settlements found"
          description="There are no settlements matching your current filters."
          actionLabel="Clear filters"
          onAction={clear}
        />
      ) : (
        <>
          <SettlementTable settlements={pageItems} />
          <PaginationControls
            page={safePage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
