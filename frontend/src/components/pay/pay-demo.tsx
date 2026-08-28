"use client"

import { useRef, useState } from "react"
import QRCode from "react-qr-code"
import {
  Check,
  Copy,
  Loader2,
  PartyPopper,
  Search,
  TriangleAlert,
  WalletCards,
} from "lucide-react"
import { toast } from "sonner"

import { ApiError, apiRequest, newIdempotencyKey } from "@/lib/api/client"
import { DEFAULT_SLUG } from "@/lib/tenant-meta"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Student {
  id: string
  name: string
  email: string
  program: string
  year: string
  status: string
}

interface Invoice {
  id: string
  number?: string
  type: string
  description: string
  amount: number
  currency: string
  dueDate: string
  status: string
}

interface PaymentInfo {
  id: string
  reference: string
  amount: number
  currency: string
  status: string
  btcSats: number
  paymentRequest?: string | null
}

interface SettlementInfo {
  id: string
  reference: string
  status: string
  createdAt?: string
}

interface CreatePaymentResult {
  invoice: Invoice
  payment: PaymentInfo
  lightning: {
    paymentRequest: string
    paymentHash: string
    sats: number
    rate: number
  }
}

const SLUG = DEFAULT_SLUG
const DONE_STATUSES = new Set([
  "Paid",
  "Settled",
  "Settlement Pending",
  "Failed",
  "Refunded",
])

const money = (n: number, currency: string) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n)

export function PayDemo() {
  const [recordId, setRecordId] = useState("")
  const [looking, setLooking] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [invoices, setInvoices] = useState<Invoice[] | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [bolt11, setBolt11] = useState<string | null>(null)
  const [settlement, setSettlement] = useState<SettlementInfo | null>(null)
  const [settlementLoading, setSettlementLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const idemKeys = useRef<Record<string, string>>({})
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }

  const handleLookup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!recordId.trim()) return
    setLooking(true)
    try {
      const s = await apiRequest<Student>(
        `/api/students/${encodeURIComponent(recordId.trim())}`,
        { slug: SLUG }
      )
      const inv = await apiRequest<Invoice[]>(`/api/students/${s.id}/invoices`, {
        slug: SLUG,
      })
      setStudent(s)
      setInvoices(inv)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to look up student.")
    } finally {
      setLooking(false)
    }
  }

  const pollPayment = (paymentId: string) => {
    stopPolling()
    timer.current = setInterval(async () => {
      try {
        const p = await apiRequest<PaymentInfo>(`/api/payments/${paymentId}`, {
          slug: SLUG,
        })
        setPayment(p)
        if (p.paymentRequest) setBolt11(p.paymentRequest)
        if (DONE_STATUSES.has(p.status)) {
          stopPolling()
          setSettlementLoading(true)
          const s = await apiRequest<SettlementInfo>(
            `/api/payments/${paymentId}/settlement`,
            { slug: SLUG }
          ).catch(() => null)
          setSettlement(s)
          setSettlementLoading(false)
        }
      } catch {
        // transient — keep polling
      }
    }, 3000)
  }

  const handlePay = async (inv: Invoice) => {
    if (!student) return
    setError(null)
    setPayingId(inv.id)
    stopPolling()
    setSettlement(null)
    setBolt11(null)
    try {
      const key =
        idemKeys.current[inv.id] ?? (idemKeys.current[inv.id] = newIdempotencyKey())
      const res = await apiRequest<CreatePaymentResult>(`/api/payments`, {
          method: "POST",
          slug: SLUG,
          idempotencyKey: key,
          body: {
            studentId: student.id,
            invoiceId: inv.id,
            type: inv.type,
            description: inv.description,
            amount: inv.amount,
            currency: inv.currency,
            dueDate: inv.dueDate,
          },
        }
      )
      setPayment(res.payment)
      setBolt11(res.lightning.paymentRequest ?? null)
      toast.success("Lightning invoice generated", {
        description: "Scan the QR or copy the invoice to pay from your wallet.",
      })
      pollPayment(res.payment.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create payment.")
    } finally {
      setPayingId(null)
    }
  }

  const handleCopy = async () => {
    if (!bolt11) return
    try {
      await navigator.clipboard.writeText(bolt11)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Copy failed — select the invoice text below.")
    }
  }

  const done = payment && DONE_STATUSES.has(payment.status)
  const paidLabel =
    settlement?.status === "Settled"
      ? "Paid & settled in RWF"
      : payment?.status === "Settlement Pending" || payment?.status === "Paid"
        ? "Paid — settling in RWF…"
        : undefined
  const failed = payment?.status === "Failed" || payment?.status === "Refunded"

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Student checkout</h1>
        <p className="text-sm text-muted-foreground">
          Enter your student record number to see outstanding bills and pay with
          Lightning.
        </p>
      </div>

      {error ? (
        <p
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {!student ? (
        <form
          onSubmit={handleLookup}
          className="rounded-2xl border bg-card p-6 sm:p-8"
        >
          <div className="grid gap-3">
            <Label htmlFor="pay-record">Student record number</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                id="pay-record"
                className="h-12 flex-1 font-mono"
                placeholder="e.g. STU-001"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
              />
              <Button type="submit" className="h-12 gap-2" disabled={looking}>
                {looking ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="size-4" aria-hidden="true" />
                )}
                Find my bills
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <div>
              <p className="font-semibold">{student.name}</p>
              <p className="text-sm text-muted-foreground">
                {student.program || "Program unset"} · Year {student.year || "—"}{" "}
                · Record {student.id}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStudent(null)
                setInvoices(null)
                setPayment(null)
                setSettlement(null)
                setBolt11(null)
                stopPolling()
              }}
            >
              Change
            </Button>
          </div>

          {invoices && invoices.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <PartyPopper className="size-8 text-emerald-500" aria-hidden="true" />
              <p className="font-medium">You have no bills!</p>
              <p className="text-sm text-muted-foreground">
                Nothing outstanding for this record right now.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {(invoices ?? []).map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{inv.description}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {inv.type} · {inv.number ?? inv.id} · Due{" "}
                      {new Date(inv.dueDate).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{money(inv.amount, inv.currency)}</p>
                      <p className="text-xs text-muted-foreground">{inv.status}</p>
                    </div>
                    {inv.status !== "Paid" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={payingId === inv.id}
                        onClick={() => handlePay(inv)}
                      >
                        {payingId === inv.id ? (
                          <Loader2
                            className="mr-2 size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : null}
                        Pay
                      </Button>
                    ) : (
                      <Check
                        className="size-5 text-emerald-500"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {payment && bolt11 && !done ? (
        <div className="rounded-2xl border bg-card p-6 text-center">
          <div className="mx-auto mb-4 w-fit rounded-full bg-primary/10 p-3 text-primary">
            <WalletCards className="size-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold">Pay with Lightning</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {money(payment.amount, payment.currency)} ·{" "}
            {payment.btcSats.toLocaleString()} sats
          </p>

          <div className="mx-auto mt-4 w-fit rounded-2xl border bg-white p-4">
            <QRCode value={`lightning:${bolt11}`} size={200} level="M" />
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-xs text-muted-foreground">
              Scan with any LNbits wallet, or copy the invoice:
            </p>
            <div className="mx-auto mt-2 flex max-w-lg items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border bg-muted px-3 py-2 text-left font-mono text-xs">
                {bolt11}
              </code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-4 text-emerald-500" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <p className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-amber-500" />
            Waiting for payment… confirmation can take up to 30s
          </p>
        </div>
      ) : null}

      {done && paidLabel ? (
        <div className="rounded-2xl border bg-emerald-500/10 p-6 text-center">
          <PartyPopper
            className="mx-auto mb-3 size-8 text-emerald-500"
            aria-hidden="true"
          />
          <h2 className="text-lg font-bold text-emerald-600">
            {settlementLoading ? "Finalizing settlement…" : paidLabel}
          </h2>
          {settlement ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Settlement {settlement.reference} · {settlement.status}
            </p>
          ) : null}
        </div>
      ) : null}

      {failed ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-semibold text-destructive">
            This payment failed — please try again.
          </p>
        </div>
      ) : null}
    </div>
  )
}