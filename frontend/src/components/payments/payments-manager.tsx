"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Loader2, SearchX } from "lucide-react"

import { getPayments, type PaymentDetail } from "@/lib/services/payments"
import { useRealTime } from "@/components/real-time-provider"
import { useTenantSlug } from "@/components/tenant-provider"
import { PaymentFilters, EMPTY_FILTERS, type FilterState } from "@/components/payments/payment-filters"
import { PaymentTable } from "@/components/payments/payment-table"
import { PaginationControls } from "@/components/shared/pagination"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { downloadCsv } from "@/lib/export"
import { formatDate } from "@/lib/format"

const PAGE_SIZE = 10

export function PaymentsManager() {
  const slug = useTenantSlug()
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [payments, setPayments] = useState<PaymentDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const { latestEvent } = useRealTime()
  const lastEventRef = useRef<string | null>(null)
  const requestSeqRef = useRef(0)

  const load = async (f: FilterState = filters) => {
    const requestId = ++requestSeqRef.current
    setLoading(true)
    const data = await getPayments(
      {
        search: f.search || undefined,
        status: f.status || undefined,
        settlement: f.settlement || undefined,
        method: f.method || undefined,
        currency: f.currency || undefined,
      },
      slug
    )
    // Ignore responses that raced ahead of a newer request (e.g. a real-time
    // event arriving mid-refresh) so a stale result never overwrites newer data.
    if (requestId !== requestSeqRef.current) return
    setPayments(data)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load(filters)
    }, filters.search ? 250 : 0)
    return () => {
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    if (latestEvent && lastEventRef.current !== latestEvent.reference) {
      lastEventRef.current = latestEvent.reference
      load(filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestEvent])

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const handleFiltersChange = (f: FilterState) => {
    setFilters(f)
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(payments.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = payments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleExport = () => {
    downloadCsv(
      "payments.csv",
      [
        "Payment",
        "Student",
        "Student ID",
        "Invoice",
        "Amount",
        "Currency",
        "BTC (sats)",
        "Method",
        "Status",
        "Date",
      ],
      payments.map((p) => [
        p.reference,
        p.studentName,
        p.studentId,
        p.invoiceNumber,
        p.amount,
        p.currency,
        p.btcSats,
        p.method,
        p.status,
        formatDate(p.date),
      ])
    )
  }

  return (
    <div className="space-y-4">
      <PaymentFilters
        filters={filters}
        onChange={handleFiltersChange}
        onClear={clearFilters}
      />

      <div className="flex items-center justify-between gap-2">
        {!loading ? (
          <p className="text-sm text-muted-foreground">
            {payments.length} payment{payments.length === 1 ? "" : "s"}
          </p>
        ) : (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExport}
          disabled={loading || payments.length === 0}
        >
          <Download className="size-4" aria-hidden="true" />
          Export
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No payments found"
          description="There are no payments matching your current filters."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <PaymentTable payments={pageItems} />
      )}

      {!loading && payments.length > 0 && (
        <PaginationControls
          page={safePage}
          pageSize={PAGE_SIZE}
          total={payments.length}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
