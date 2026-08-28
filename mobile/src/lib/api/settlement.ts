import type { PaymentAccount, PaymentAccountType, Withdrawal } from "@/lib/types"
import { ApiError, apiRequest, newIdempotencyKey } from "@/lib/api/client"

export interface SettlementBalance {
  currency: string
  totalCollected: number
  totalWithdrawn: number
  pendingAmount: number
  availableBalance: number
  lastWithdrawalAt?: string
}

export function maskAccountNumber(number?: string): string {
  const digits = (number ?? "").replace(/\D/g, "")
  if (!digits) return "\u2022\u2022\u2022\u2022"
  return `\u2022\u2022\u2022\u2022 ${digits.slice(-4)}`
}

export async function getBalance(
  slug: string,
  currency?: string
): Promise<SettlementBalance> {
  const q = currency ? `?currency=${encodeURIComponent(currency)}` : ""
  const balance = await apiRequest<SettlementBalance>(
    `/api/settlement/balance${q}`,
    { slug }
  )
  return {
    ...balance,
    currency: balance.currency || currency || "RWF",
    totalCollected: Number(balance.totalCollected ?? 0),
    totalWithdrawn: Number(balance.totalWithdrawn ?? 0),
    pendingAmount: Number(balance.pendingAmount ?? 0),
    availableBalance: Number(balance.availableBalance ?? 0),
  }
}

export async function getPaymentMethods(
  slug: string,
  currency?: string
): Promise<PaymentAccount[]> {
  const q = currency ? `?currency=${encodeURIComponent(currency)}` : ""
  const methods = await apiRequest<PaymentAccount[]>(
    `/api/settlement/methods${q}`,
    { slug }
  )
  return [...methods].sort(
    (a, b) => Number(b.isDefault ?? false) - Number(a.isDefault ?? false)
  )
}

export interface AddPaymentMethodInput {
  type: PaymentAccountType
  label: string
  holderName: string
  number: string
  provider?: string
  currency: string
  isDefault?: boolean
}

export async function addPaymentMethod(
  slug: string,
  input: AddPaymentMethodInput
): Promise<PaymentAccount> {
  return apiRequest<PaymentAccount>("/api/settlement/methods", {
    slug,
    method: "POST",
    idempotencyKey: newIdempotencyKey(),
    body: input,
  })
}

export async function removePaymentMethod(
  slug: string,
  id: string
): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `/api/settlement/methods/${encodeURIComponent(id)}`,
    { slug, method: "DELETE" }
  )
}

export async function listWithdrawals(slug: string): Promise<Withdrawal[]> {
  return apiRequest<Withdrawal[]>("/api/settlement/withdrawals", { slug })
}

export async function getWithdrawal(
  id: string,
  slug?: string
): Promise<Withdrawal | undefined> {
  if (!slug) return undefined
  try {
    return await apiRequest<Withdrawal>(
      `/api/settlement/withdrawals/${encodeURIComponent(id)}`,
      { slug }
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined
    throw err
  }
}

export interface RequestWithdrawalInput {
  slug: string
  amount: number
  paymentAccountId: string
  currency: string
}

export async function requestWithdrawal(
  input: RequestWithdrawalInput
): Promise<Withdrawal> {
  return apiRequest<Withdrawal>("/api/settlement/withdraw", {
    slug: input.slug,
    method: "POST",
    idempotencyKey: newIdempotencyKey(),
    body: {
      amount: input.amount,
      paymentAccountId: input.paymentAccountId,
      currency: input.currency,
    },
  })
}
