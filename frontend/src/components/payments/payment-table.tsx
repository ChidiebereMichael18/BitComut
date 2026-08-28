import Link from "next/link"

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
import { formatSats, formatDate } from "@/lib/format"
import { Money } from "@/components/currency-display"

export function PaymentTable({ payments }: { payments: PaymentDetail[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-muted/40">
                <TableCell>
                  <Link
                    href={`/dashboard/payments/${payment.id}`}
                    className="block font-medium hover:underline"
                  >
                    {payment.studentName}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {payment.studentId}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.invoiceDescription}
                  <span className="block text-xs">{payment.invoiceNumber}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/dashboard/payments/${payment.id}`}
                    className="font-semibold hover:underline"
                  >
                    <Money
                      amount={payment.amount}
                      from={payment.currency}
                      className="font-semibold"
                    />
                  </Link>
                    <span className="block text-xs text-muted-foreground">
                      {formatSats(payment.btcSats)}
                    </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex">
                    <StatusBadge status={payment.status} />
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                  {formatDate(payment.date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {payments.map((payment) => (
          <Link
            key={payment.id}
            href={`/dashboard/payments/${payment.id}`}
            className="block rounded-lg border p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{payment.studentName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {payment.invoiceDescription}
                </p>
              </div>
              <StatusBadge status={payment.status} />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-lg font-bold">
                  <Money amount={payment.amount} from={payment.currency} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatSats(payment.btcSats)} · {payment.method}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(payment.date)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
