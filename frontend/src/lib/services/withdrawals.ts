import type { PaymentAccount, PaymentAccountType, Withdrawal } from "@/lib/types"
import {
  getBalance,
  getPaymentMethods,
  addPaymentMethod as addMethodToApi,
  listWithdrawals,
  requestWithdrawal as requestFromApi,
  hasInFlightWithdrawal,
  subscribe,
  type SettlementBalance,
} from "@/lib/api/settlement"

/**
 * Settlement/withdrawals service layer.
 *
 * UI components only ever talk to this module; the actual network calls live
 * in lib/api/settlement.ts and hit the real backend.
 */

export type WithdrawalOverview = SettlementBalance

export function onWithdrawalUpdate(slug: string, cb: () => void): () => void {
  return subscribe(slug, cb)
}

export async function fetchWithdrawalOverview(
  slug: string,
  currency: string
): Promise<WithdrawalOverview> {
  const balance = await getBalance(slug, currency)
  return { ...balance, currency: balance.currency || currency }
}

export async function fetchWithdrawals(slug: string): Promise<Withdrawal[]> {
  return listWithdrawals(slug)
}

export async function fetchPaymentMethods(
  slug: string,
  currency: string
): Promise<PaymentAccount[]> {
  return getPaymentMethods(slug, currency)
}

export async function requestWithdrawal(input: {
  slug: string
  amount: number
  paymentAccountId: string
  currency: string
}): Promise<Withdrawal> {
  return requestFromApi(input)
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
  return addMethodToApi(slug, input)
}

export async function isWithdrawalInFlight(slug: string): Promise<boolean> {
  return hasInFlightWithdrawal(slug)
}