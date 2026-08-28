"use client"

import Link from "next/link"
import { Download, Eye } from "lucide-react"

import type { ReceiptDetail } from "@/lib/services/receipts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { downloadCsv } from "@/lib/export"
import { Badge } from "@/components/ui/badge"
import { useCurrency } from "@/components/currency-provider"

export function ReceiptTable({ receipts }: { receipts: ReceiptDetail[] }) {
  const { format } = useCurrency()
  const downloadReceipt = (r: ReceiptDetail) => {
    downloadCsv(
      `${r.number}.csv`,
      ["Field", "Value"],
      [
        ["Receipt", r.number],
        ["Student", r.studentName],
        ["Student ID", r.studentId],
        ["Invoice", r.invoiceLabel],
        ["Amount", formatCurrency(r.amount, r.currency)],
        ["Date", formatDate(r.date)],
        ["Status", r.status],
      ]
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receipt</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="hidden lg:table-cell">Invoice</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell className="font-medium">{receipt.number}</TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/students/${receipt.studentId}`}
                  className="hover:underline"
                >
                  {receipt.studentName}
                </Link>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {receipt.invoiceNumber}
              </TableCell>
              <TableCell className="text-right font-medium">
                {format(receipt.amount, receipt.currency)}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                {formatDate(receipt.date)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{receipt.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button asChild variant="ghost" size="icon" aria-label={`View receipt ${receipt.number}`}>
                    <Link href={`/dashboard/receipts/${receipt.id}`}>
                      <Eye className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadReceipt(receipt)}
                    aria-label={`Download receipt ${receipt.number}`}
                  >
                    <Download className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
