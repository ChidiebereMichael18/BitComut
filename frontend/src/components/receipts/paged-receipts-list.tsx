"use client"

import { useState } from "react"

import type { ReceiptDetail } from "@/lib/services/receipts"
import { ReceiptTable } from "@/components/receipts/receipt-table"
import { PaginationControls } from "@/components/shared/pagination"

const PAGE_SIZE = 10

export function PagedReceiptsList({ receipts }: { receipts: ReceiptDetail[] }) {
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(receipts.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = receipts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <ReceiptTable receipts={pageItems} />
      <PaginationControls
        page={safePage}
        pageSize={PAGE_SIZE}
        total={receipts.length}
        onPageChange={setPage}
      />
    </div>
  )
}
