import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"

import type { Metadata } from "next"

import { getInvoiceDetail } from "@/lib/services/invoices"
import { getPaymentsByInvoice } from "@/lib/services/payments"
import { getCurrentTenantSlug, getCurrentTenant } from "@/lib/tenant-server"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { DetailSection } from "@/components/shared/detail-section"
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
  return { title: `Invoice ${id}` }
}

export default async function InvoiceDetailPage({
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
  let invoice
  try {
    invoice = await getInvoiceDetail(id, slug)
  } catch {
    notFound()
  }

  const payments = await getPaymentsByInvoice(id, slug)

  const progress =
    invoice.amount > 0
      ? Math.min(100, Math.round((invoice.amountPaid / invoice.amount) * 100))
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/invoices">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Invoices
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2 ml-auto">
          <Link href={`/dashboard/invoices/${invoice.id}?edit=1`}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{invoice.number}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Created {formatDateTime(invoice.created)}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-3xl font-bold tracking-tight">
              {formatCurrency(invoice.amount, invoice.currency)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {invoice.type} · Due {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection
          title="Invoice Details"
          rows={[
            { label: "Type", value: invoice.type },
            { label: "Description", value: invoice.description },
            { label: "Due Date", value: formatDate(invoice.dueDate) },
            { label: "Created", value: formatDateTime(invoice.created) },
          ]}
        />

        <DetailSection
          title="Student"
          rows={[
            {
              label: "Name",
              value: (
                <Link
                  href={`/dashboard/students/${invoice.studentId}`}
                  className="hover:underline"
                >
                  {invoice.studentName}
                </Link>
              ),
            },
            { label: "Student ID", value: invoice.studentId },
            { label: "Email", value: invoice.studentEmail },
          ]}
        />
      </div>

      <DetailSection title="Payment Progress">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(invoice.amountPaid, currency)} paid of{" "}
              {formatCurrency(invoice.amount, currency)}
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </DetailSection>

      <div>
        <h2 className="mb-3 text-base font-semibold">Payments</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No payments have been received for this invoice yet.
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
