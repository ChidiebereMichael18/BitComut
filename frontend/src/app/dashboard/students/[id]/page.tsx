import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react"

import type { Metadata } from "next"

import { getStudentSummary } from "@/lib/services/students"
import { getInvoicesByStudent } from "@/lib/services/invoices"
import { getPaymentsByStudent } from "@/lib/services/payments"
import { getCurrentTenantSlug, getCurrentTenant } from "@/lib/tenant-server"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DetailSection } from "@/components/shared/detail-section"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return { title: `Student ${id}` }
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [slug, tenant] = await Promise.all([
    getCurrentTenantSlug(),
    getCurrentTenant(),
  ])
  const currency = tenant.currency
  let student
  try {
    student = await getStudentSummary(id, slug)
  } catch {
    notFound()
  }

  const [invoices, payments] = await Promise.all([
    getInvoicesByStudent(id, slug),
    getPaymentsByStudent(id, slug),
  ])

  const progress = student.totalInvoiced > 0
    ? Math.min(100, Math.round((student.totalPaid / student.totalInvoiced) * 100))
    : 0

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/students">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Students
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
          <Avatar className="size-16">
            <AvatarFallback className="text-xl">
              {initials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{student.name}</h1>
              <StatusBadge status={student.paymentStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {student.program} · {student.year}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" aria-hidden="true" />
                {student.email}
              </span>
              {student.phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" aria-hidden="true" />
                  {student.phone}
                </span>
              ) : null}
              {student.status ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {student.status}
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-sm text-muted-foreground sm:text-right">
            <p>Student ID</p>
            <p className="font-medium text-foreground">{student.id}</p>
          </div>
        </CardContent>
      </Card>

      <DetailSection
        title="Financial Summary"
        rows={[
          { label: "Total Invoiced", value: formatCurrency(student.totalInvoiced, currency) },
          { label: "Total Paid", value: formatCurrency(student.totalPaid, currency) },
          {
            label: "Outstanding",
            value: (
              <span className={student.outstanding > 0 ? "text-amber-600 dark:text-amber-400" : ""}>
                {formatCurrency(student.outstanding, currency)}
              </span>
            ),
          },
        ]}
      >
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance status</span>
            <span className="font-medium">{progress}% paid</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </DetailSection>

      <div>
        <h2 className="mb-3 text-base font-semibold">Invoices</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Due</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No invoices for this student.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium hover:underline"
                      >
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.type} — {invoice.description}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.amount, currency)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Payment History</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No payments for this student.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/payments/${payment.id}`}
                        className="font-medium hover:underline"
                      >
                        {payment.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount, currency)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDateTime(payment.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={payment.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
