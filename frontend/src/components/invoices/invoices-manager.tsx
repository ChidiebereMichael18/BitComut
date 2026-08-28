"use client"

import { useMemo, useState } from "react"
import { Search, FileText } from "lucide-react"

import { getInvoices, type InvoiceDetail } from "@/lib/services/invoices"
import { useAsync } from "@/hooks/use-async"
import { useTenantSlug } from "@/components/tenant-provider"
import { InvoiceTable } from "@/components/invoices/invoice-table"
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

const STATUS_FILTERS = [
  "All",
  "Unpaid",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Cancelled",
] as const

export function InvoicesManager() {
  const slug = useTenantSlug()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [page, setPage] = useState(1)

  const { data: invoices, loading } = useAsync<InvoiceDetail[]>(
    () => getInvoices(slug),
    [slug]
  )

  const filtered = useMemo(() => {
    if (!invoices) return []
    const q = search.toLowerCase()
    return invoices.filter((invoice) => {
      const matchesSearch =
        !q ||
        invoice.number.toLowerCase().includes(q) ||
        invoice.studentName.toLowerCase().includes(q) ||
        invoice.studentId.toLowerCase().includes(q) ||
        invoice.description.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === "All" || invoice.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [invoices, search, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const clear = () => {
    setSearch("")
    setStatusFilter("All")
    setPage(1)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatus = (value: string) => {
    setStatusFilter(value)
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
            placeholder="Search by invoice, student, or description..."
            className="pl-9"
            aria-label="Search invoices"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatus}>
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
        <button
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={clear}
        >
          Reset
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description="There are no invoices matching your current filters."
          actionLabel="Clear filters"
          onAction={clear}
        />
      ) : (
        <>
          <InvoiceTable invoices={pageItems} />
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
