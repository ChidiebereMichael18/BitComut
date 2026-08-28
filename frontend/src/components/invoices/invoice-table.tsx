import Link from "next/link"
import { Eye } from "lucide-react"

import type { InvoiceDetail } from "@/lib/services/invoices"
import { StatusBadge } from "@/components/ui/status-badge"
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

export function InvoiceTable({ invoices }: { invoices: InvoiceDetail[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="hidden lg:table-cell">Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="hidden sm:table-cell">Due</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.number}</TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/students/${invoice.studentId}`}
                  className="hover:underline"
                >
                  {invoice.studentName}
                </Link>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {invoice.description}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(invoice.amount, invoice.currency)}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                {formatDate(invoice.dueDate)}
              </TableCell>
              <TableCell className="text-right">
                <StatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="icon" aria-label={`View invoice ${invoice.number}`}>
                  <Link href={`/dashboard/invoices/${invoice.id}`}>
                    <Eye className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
