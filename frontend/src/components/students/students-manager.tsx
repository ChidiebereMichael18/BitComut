"use client"

import { useMemo, useState } from "react"
import { Search, Users } from "lucide-react"

import { getStudents, type StudentSummary } from "@/lib/services/students"
import { useAsync } from "@/hooks/use-async"
import { useTenantSlug } from "@/components/tenant-provider"
import { StudentTable } from "@/components/students/student-table"
import { ImportStudentsDialog } from "@/components/students/import-students-dialog"
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

const PAGE_SIZE = 8

const STATUS_FILTERS = ["All", "Fully Paid", "Partially Paid", "Outstanding"] as const

export function StudentsManager() {
  const slug = useTenantSlug()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [page, setPage] = useState(1)

  const { data: allStudents, loading, reload } = useAsync<StudentSummary[]>(
    () => getStudents("", slug),
    [slug]
  )

  const filtered = useMemo(() => {
    if (!allStudents) return []
    const q = search.toLowerCase()
    return allStudents.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === "All" || s.paymentStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [allStudents, search, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

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
            placeholder="Search by name, ID, or email..."
            className="pl-9"
            aria-label="Search students"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatus}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by payment status">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ImportStudentsDialog onImported={reload} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="There are no students matching your current filters."
          actionLabel="Clear filters"
          onAction={() => {
            handleSearch("")
            handleStatus("All")
          }}
        />
      ) : (
        <>
          <StudentTable students={pageItems} />
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
