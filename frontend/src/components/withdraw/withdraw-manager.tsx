"use client"

import { useEffect, useState } from "react"
import { ArrowDownToLine, Landmark, Smartphone, Wallet } from "lucide-react"

import type { PaymentAccount, Withdrawal } from "@/lib/types"
import { useTenant } from "@/components/tenant-provider"
import { useAsync } from "@/hooks/use-async"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { paymentAccountLabel } from "@/lib/api/settlement"
import { AddPaymentMethodDialog } from "@/components/withdraw/add-payment-method-dialog"
import {
  fetchWithdrawalOverview,
  fetchWithdrawals,
  fetchPaymentMethods,
  requestWithdrawal,
  onWithdrawalUpdate,
  type WithdrawalOverview,
} from "@/lib/services/withdrawals"

export function WithdrawManager() {
  const tenant = useTenant()
  const slug = tenant.slug
  const currency = tenant.settlementCurrency || tenant.currency

  const { data, loading, reload } = useAsync(
    async () => {
      const [ov, wd, ac] = await Promise.all([
        fetchWithdrawalOverview(slug, currency),
        fetchWithdrawals(slug),
        fetchPaymentMethods(slug, currency),
      ])
      return { overview: ov, withdrawals: wd, methods: ac }
    },
    [slug, currency]
  )

  const overview: WithdrawalOverview | null = data?.overview ?? null
  const withdrawals: Withdrawal[] = data?.withdrawals ?? []
  const methods: PaymentAccount[] = data?.methods ?? []

  const [amount, setAmount] = useState("")
  const [paymentMethodId, setPaymentMethodId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  // Live updates mirror a WebSocket: when the (simulated) pipeline advances a
  // withdrawal's status we re-query so the UI reflects it without a refresh.
  useEffect(() => {
    return onWithdrawalUpdate(slug, () => reload())
  }, [slug, reload])

  const inFlight = withdrawals.find(
    (w) => w.status === "Pending" || w.status === "Processing"
  )

  // Default to the first (preferred) payment method until the user picks one.
  const selectedMethodId =
    paymentMethodId || methods.find((a) => a.isDefault)?.id || methods[0]?.id || ""

  const available = overview?.availableBalance ?? 0
  const numericAmount = Number.parseFloat(amount) || 0
  const validAmount = numericAmount > 0 && numericAmount <= available
  const canSubmit =
    !submitting && !inFlight && validAmount && selectedMethodId.length > 0

  const withdrawAll = () => setAmount(String(available))

  const handleSubmit = async () => {
    setError(null)
    if (!validAmount) {
      setError(
        numericAmount <= 0
          ? "Enter an amount to withdraw."
          : `Amount exceeds your available balance of ${formatCurrency(available, currency)}.`
      )
      return
    }
    if (inFlight) {
      setError(
        `A withdrawal (${inFlight.reference}) is already in progress. Wait for it to complete first.`
      )
      return
    }
    if (!selectedMethodId) {
      setError("Select a payment method.")
      return
    }
    setSubmitting(true)
    try {
      await requestWithdrawal({ slug, amount: numericAmount, paymentAccountId: selectedMethodId, currency })
      setAmount("")
    } catch {
      setError("Something went wrong submitting the withdrawal. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border">
        <LoadingSpinner />
      </div>
    )
  }

  const displayed = showAll ? withdrawals : withdrawals.slice(0, 5)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header & balance banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Withdraw</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Request payouts directly to your linked bank account.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Available Balance</span>
          <div className="text-2xl font-bold text-emerald-500">
            {formatCurrency(available, currency)}
          </div>
        </div>
      </div>

      {/* Withdrawal action */}
      <Card>
        <CardHeader>
          <CardTitle>Withdraw your balance</CardTitle>
          <CardDescription>
            Transfer available {currency} to one of your linked bank accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount ({currency})</Label>
              <div className="relative">
                <Input
                  id="withdraw-amount"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setError(null)
                  }}
                  className="pr-16"
                  aria-label="Withdrawal amount"
                />
                <button
                  type="button"
                  onClick={withdrawAll}
                  disabled={available <= 0}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
                >
                  Max
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="withdraw-bank">Payment method</Label>
                <AddPaymentMethodDialog slug={slug} currency={currency} onAdded={reload} />
              </div>
              {methods.length === 0 ? (
                <div className="flex h-9 items-center rounded-md border border-dashed px-3 text-sm text-muted-foreground">
                  No payment methods linked yet
                </div>
              ) : (
                <Select value={selectedMethodId} onValueChange={(v) => { setPaymentMethodId(v); setError(null) }}>
                  <SelectTrigger id="withdraw-bank" className="w-full">
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <span className="flex items-center gap-1.5">
                          {m.type === "mobile_money" ? (
                            <Smartphone className="size-3.5 text-muted-foreground" aria-hidden="true" />
                          ) : (
                            <Landmark className="size-3.5 text-muted-foreground" aria-hidden="true" />
                          )}
                          {paymentAccountLabel(m)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? "Submitting..." : "Request Withdrawal"}
          </Button>
          {inFlight ? (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <ArrowDownToLine className="size-3.5" aria-hidden="true" />
              A withdrawal ({inFlight.reference}) is in progress — limited to one
              at a time.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Withdrawal history */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Withdrawal History</h2>

        {withdrawals.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Wallet}
                title="No withdrawals yet"
                description="Withdraw your collected balance to a bank account and it will appear here."
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Destination</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {displayed.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(w.createdAt)}</td>
                      <td className="px-3 py-3">{w.bankAccountLabel}</td>
                      <td className="px-3 py-3">
                        <div className="inline-flex">
                          <StatusBadge status={w.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(w.amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {withdrawals.length > 5 ? (
              <div className="border-t border-border/40 p-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll((s) => !s)}
                >
                  {showAll ? "Show Less" : "See More"}
                </Button>
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </div>
  )
}
