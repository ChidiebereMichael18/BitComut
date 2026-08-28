import Link from "next/link"

import type { SettlementDetail } from "@/lib/services/settlements"
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

export function SettlementTable({
  settlements,
}: {
  settlements: SettlementDetail[]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Settlement</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="hidden text-right lg:table-cell">BTC</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Net</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settlements.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <Link
                  href={`/dashboard/settlements/${s.id}`}
                  className="font-medium hover:underline"
                >
                  {s.reference}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {s.paymentReference}
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/students/${s.studentId}`}
                  className="hover:underline"
                >
                  {s.studentName}
                </Link>
              </TableCell>
              <TableCell className="hidden text-right text-muted-foreground lg:table-cell">
                {formatSats(s.btcSats)}
              </TableCell>
              <TableCell className="text-right font-medium">
                <Money amount={s.localAmount} from={s.currency} />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                <Money amount={s.netAmount} from={s.currency} />
              </TableCell>
              <TableCell className="text-right">
                <StatusBadge status={s.status} />
              </TableCell>
              <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                {formatDate(s.date)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
