"use client"

import { Printer, Download } from "lucide-react"

import type { ReceiptDetail } from "@/lib/services/receipts"
import { Button } from "@/components/ui/button"
import { downloadCsv } from "@/lib/export"
import { formatCurrency, formatDate } from "@/lib/format"

export function PrintToolbar({ receipt }: { receipt: ReceiptDetail }) {
  const handleDownload = () => {
    downloadCsv(
      `${receipt.number}.csv`,
      ["Field", "Value"],
      [
        ["Receipt", receipt.number],
        ["Student", receipt.studentName],
        ["Student ID", receipt.studentId],
        ["Invoice", receipt.invoiceLabel],
        ["Invoice Number", receipt.invoiceNumber],
        ["Amount", formatCurrency(receipt.amount, receipt.currency)],
        ["Date", formatDate(receipt.date)],
        ["Status", receipt.status],
      ]
    )
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button variant="outline" className="gap-2" onClick={() => window.print()}>
        <Printer className="size-4" aria-hidden="true" />
        Print
      </Button>
      <Button className="gap-2" onClick={handleDownload}>
        <Download className="size-4" aria-hidden="true" />
        Download
      </Button>
    </div>
  )
}
