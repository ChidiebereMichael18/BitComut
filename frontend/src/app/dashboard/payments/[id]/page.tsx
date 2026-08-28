import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, Zap } from "lucide-react"

import type { Metadata } from "next"

import { getPayment } from "@/lib/services/payments"
import { getSettlementByPaymentId } from "@/lib/services/settlements"
import { getReceiptByPaymentId } from "@/lib/services/receipts"
import { getCurrentTenantSlug } from "@/lib/tenant-server"
import { formatCurrency, formatSats, formatBtc, formatDate, formatDateTime, formatExchangeRate, formatNumber } from "@/lib/format"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { DetailSection } from "@/components/shared/detail-section"
import { PaymentTimeline } from "@/components/payments/payment-timeline"
import { Badge } from "@/components/ui/badge"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return { title: `Payment ${id}` }
}

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const slug = await getCurrentTenantSlug()
  let payment
  try {
    payment = await getPayment(id, slug)
  } catch {
    notFound()
  }

  const [settlement, receipt] = await Promise.all([
    getSettlementByPaymentId(payment.id, slug),
    getReceiptByPaymentId(payment.id, slug),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/payments">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Payments
          </Link>
        </Button>
        {receipt ? (
          <Button asChild variant="outline" size="sm" className="gap-2 ml-auto">
            <Link href={`/dashboard/receipts/${receipt.id}`}>
              <FileText className="size-4" aria-hidden="true" />
              View Receipt
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{payment.reference}</h1>
              <StatusBadge status={payment.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Payment {formatDate(payment.date, { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-3xl font-bold tracking-tight">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{payment.method}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <DetailSection
              title="Student"
              rows={[
                {
                  label: "Name",
                  value: (
                    <Link
                      href={`/dashboard/students/${payment.studentId}`}
                      className="hover:underline"
                    >
                      {payment.studentName}
                    </Link>
                  ),
                },
                { label: "Student ID", value: payment.studentId },
                { label: "Email", value: payment.studentEmail },
              ]}
            />

            <DetailSection
              title="Invoice"
              rows={[
                { label: "Type", value: payment.invoiceType },
                { label: "Description", value: payment.invoiceDescription },
                {
                  label: "Invoice #",
                  value: (
                    <Link
                      href={`/dashboard/invoices/${payment.invoiceId}`}
                      className="hover:underline"
                    >
                      {payment.invoiceNumber}
                    </Link>
                  ),
                },
              ]}
            />
          </div>

          <DetailSection
            title="Bitcoin Information"
            rows={[
              {
                label: "Bitcoin Paid",
                value: (
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="size-3.5 text-amber-500" aria-hidden="true" />
                    {formatSats(payment.btcSats)}
                  </span>
                ),
              },
              { label: "BTC Equivalent", value: formatBtc(payment.btcSats) },
              {
                label: "Exchange Rate",
                value: formatExchangeRate(payment.exchangeRate, payment.currency),
              },
              { label: "Payment Network", value: payment.network },
            ]}
          />

          <DetailSection
            title="Transaction"
            rows={[
              { label: "Transaction Reference", value: payment.reference },
              {
                label: "Lightning Payment Reference",
                value: `lnbc_${payment.reference.toLowerCase()}`,
              },
              { label: "Created", value: formatDateTime(payment.date) },
              { label: "Confirmed", value: payment.confirmedAt ? formatDateTime(payment.confirmedAt) : "—" },
            ]}
          />
        </div>

        <div className="space-y-6">
          {settlement ? (
            <DetailSection
              title="Settlement"
              rows={[
                {
                  label: "Settlement ID",
                  value: (
                    <Link
                      href={`/dashboard/settlements/${settlement.id}`}
                      className="hover:underline"
                    >
                      {settlement.reference}
                    </Link>
                  ),
                },
                {
                  label: "Status",
                  value: <StatusBadge status={settlement.status} />,
                },
                {
                  label: "Net Settlement",
                  value: formatCurrency(settlement.netAmount, settlement.currency),
                },
                {
                  label: "Fees",
                  value: formatCurrency(settlement.fees, settlement.currency),
                },
                {
                  label: "BTC Rate",
                  value: formatNumber(settlement.exchangeRate),
                },
              ]}
            />
          ) : (
            <DetailSection
              title="Settlement"
              rows={[{ label: "Status", value: <Badge variant="secondary">Not scheduled</Badge> }]}
            />
          )}

          <DetailSection title="Payment Timeline">
            <PaymentTimeline payment={payment} />
          </DetailSection>
        </div>
      </div>
    </div>
  )
}
