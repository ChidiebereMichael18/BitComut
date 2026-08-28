import { GraduationCap } from "lucide-react"

import type { ReceiptDetail } from "@/lib/services/receipts"
import type { University } from "@/lib/types"
import { formatSats, formatCurrency, formatBtc, formatDate } from "@/lib/format"
import { Separator } from "@/components/ui/separator"

export function ReceiptPreview({
  receipt,
  university,
}: {
  receipt: ReceiptDetail
  university: University
}) {
  const payment = receipt.payment

  return (
    <div className="rounded-xl border bg-white p-6 text-foreground sm:p-10 [color-scheme:light]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-bold">{university.name}</p>
            <p className="text-sm text-muted-foreground">{university.address}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Receipt #{receipt.number}</p>
      </div>

      <Separator className="my-8" />

      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">PAYMENT RECEIPT</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Official payment confirmation
        </p>
      </div>

      <Separator className="my-8" />

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Student
          </p>
          <p className="mt-1 font-medium">{receipt.studentName}</p>
          <p className="text-sm text-muted-foreground">Student ID: {receipt.studentId}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Invoice
          </p>
          <p className="mt-1 font-medium">{receipt.invoiceLabel}</p>
          <p className="text-sm text-muted-foreground">{receipt.invoiceNumber}</p>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Amount Paid
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(receipt.amount, receipt.currency)}
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Bitcoin Equivalent</span>
            <span className="font-medium">
              {payment ? formatSats(payment.btcSats) : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">BTC Equivalent</span>
            <span className="font-medium">
              {payment ? formatBtc(payment.btcSats) : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Exchange Rate</span>
            <span className="font-medium">
              {payment
                ? `1 BTC = ${payment.exchangeRate.toLocaleString()}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-medium">{payment?.method ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Transaction Reference</span>
            <span className="font-medium">{receipt.paymentId}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Payment Date</span>
            <span className="font-medium">
              {formatDate(receipt.date, { day: "2-digit", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Status</span>
        <span className="font-semibold text-emerald-600">PAID</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Settlement</span>
        <span className="font-semibold text-emerald-600">
          {payment?.status === "Settled" ? "SETTLED" : "—"}
        </span>
      </div>

      <Separator className="my-8" />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">Thank you.</p>
        <p className="mt-2 text-xs text-muted-foreground">
          This receipt confirms that {receipt.studentName}&apos;s payment has been
          received and recorded by {university.shortName}.
        </p>
      </div>
    </div>
  )
}
