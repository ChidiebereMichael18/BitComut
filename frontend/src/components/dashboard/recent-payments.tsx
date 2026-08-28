import Link from "next/link"
import { ChevronRight } from "lucide-react"

import type { PaymentDetail } from "@/lib/services/payments"
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
import { formatDate } from "@/lib/format"
import { Money } from "@/components/currency-display"

export function RecentPayments({ payments }: { payments: PaymentDetail[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Recent Payments</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/payments">
            View all
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden md:table-cell">Method</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/dashboard/payments/${payment.id}`}
                    className="block font-medium hover:underline"
                  >
                    {payment.studentName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.invoiceDescription}
                </TableCell>
                <TableCell className="text-right font-medium">
                  <Money amount={payment.amount} from={payment.currency} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {payment.method}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {formatDate(payment.date)}
                </TableCell>
                <TableCell className="text-right">
                  <StatusBadge status={payment.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
