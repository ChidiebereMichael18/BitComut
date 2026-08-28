import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FlaskConical } from "lucide-react"

import type { Metadata } from "next"

import { getSettlement } from "@/lib/services/settlements"
import { getPaymentRaw } from "@/lib/services/payments"
import { getStudentRecord } from "@/lib/services/students"
import { getCurrentTenantSlug } from "@/lib/tenant-server"
import { formatSats, formatCurrency, formatDateTime, formatNumber } from "@/lib/format"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { DetailSection } from "@/components/shared/detail-section"
import { SettlementTimeline } from "@/components/settlements/settlement-timeline"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return { title: `Settlement ${id}` }
}

export default async function SettlementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const slug = await getCurrentTenantSlug()
  let settlement
  try {
    settlement = await getSettlement(id, slug)
  } catch {
    notFound()
  }

  const [student, payment] = await Promise.all([
    getStudentRecord(settlement.studentId, slug),
    getPaymentRaw(settlement.paymentId, slug),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/settlements">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Settlements
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{settlement.reference}</h1>
              <StatusBadge status={settlement.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {student?.name ?? settlement.studentId} · {settlement.studentId}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-3xl font-bold tracking-tight">
              {formatCurrency(settlement.netAmount, settlement.currency)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Net settlement
            </p>
          </div>
        </div>
      </div>

      {settlement.isSimulated ? (
        <Alert>
          <FlaskConical className="size-4" aria-hidden="true" />
          <AlertTitle>Simulated settlement data</AlertTitle>
          <AlertDescription>
            This settlement is simulated for demonstration. No payout provider
            is connected yet — real settlement will be processed once a backend
            payout integration is available.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection
          title="Settlement"
          rows={[
            {
              label: "Payment Amount",
              value: formatCurrency(settlement.localAmount, settlement.currency),
            },
            { label: "Bitcoin Received", value: formatSats(settlement.btcSats) },
            {
              label: `BTC/${settlement.currency} Rate`,
              value: `1 BTC = ${formatNumber(settlement.exchangeRate)}`,
            },
            {
              label: "Fees",
              value: formatCurrency(settlement.fees, settlement.currency),
            },
            {
              label: "Net Settlement",
              value: (
                <span className="font-bold">
                  {formatCurrency(settlement.netAmount, settlement.currency)}
                </span>
              ),
            },
          ]}
        />

        <div className="space-y-6">
          <DetailSection
            title="Payment"
            rows={[
              {
                label: "Payment",
                value: payment ? (
                  <Link
                    href={`/dashboard/payments/${payment.id}`}
                    className="hover:underline"
                  >
                    {payment.reference}
                  </Link>
                ) : (
                  settlement.paymentId
                ),
              },
              {
                label: "Student",
                value: student ? (
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="hover:underline"
                  >
                    {student.name}
                  </Link>
                ) : (
                  settlement.studentId
                ),
              },
              {
                label: "Status",
                value: <StatusBadge status={settlement.status} />,
              },
              { label: "Date", value: formatDateTime(settlement.date) },
            ]}
          />
          <DetailSection title="Settlement Timeline">
            <SettlementTimeline settlement={settlement} />
          </DetailSection>
        </div>
      </div>
    </div>
  )
}
