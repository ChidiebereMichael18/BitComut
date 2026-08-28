import type { Invoice, Payment, Settlement, Student, Tenant } from "@/lib/types"
import {
  apiRequest,
  newIdempotencyKey,
  setStudentAuthToken,
  clearStudentAuthToken,
} from "@/lib/api/client"

export interface StudentWithAccount extends Student {
  hasAccount: boolean
}

export interface StudentAuthResponse {
  student: StudentWithAccount
  tenant: Tenant
  token: string
}

export interface StudentMeResponse {
  student: StudentWithAccount
  tenant: Tenant
}

export interface StudentBalance {
  currency: string
  totalInvoiced: number
  totalPaid: number
  outstanding: number
  unpaidInvoices: number
  dueSoonInvoices: number
}

export interface LightningInfo {
  paymentRequest: string
  paymentHash: string
  sats: number
  rate: number
}

export interface StudentPayResponse {
  invoice: Invoice
  payment: Payment
  lightning: LightningInfo
}

async function request<T>(path: string, options: Parameters<typeof apiRequest>[1] = {}) {
  return apiRequest<T>(path, { ...options, student: true })
}

export async function studentRegister(input: {
  tenantSlug: string
  studentId: string
  email: string
  password: string
  name?: string
}): Promise<StudentAuthResponse> {
  const res = await request<StudentAuthResponse>("/api/student/register", {
    method: "POST",
    body: input,
  })
  await setStudentAuthToken(res.token)
  return res
}

export async function studentLogin(
  email: string,
  password: string,
  tenantSlug: string
): Promise<StudentAuthResponse> {
  const res = await request<StudentAuthResponse>("/api/student/login", {
    method: "POST",
    body: { email, password, tenantSlug },
  })
  await setStudentAuthToken(res.token)
  return res
}

export async function studentLogout(): Promise<void> {
  try {
    await request<{ success: boolean }>("/api/student/logout", { method: "POST" })
  } catch {}
  await clearStudentAuthToken()
}

export async function studentMe(): Promise<StudentMeResponse | null> {
  try {
    return await request<StudentMeResponse>("/api/student/me")
  } catch {
    return null
  }
}

export async function getMyInvoices(): Promise<Invoice[]> {
  return request<Invoice[]>("/api/student/me/invoices")
}

export async function getMyBalance(): Promise<StudentBalance> {
  return request<StudentBalance>("/api/student/me/balance")
}

export async function getMyPayments(): Promise<Payment[]> {
  return request<Payment[]>("/api/student/me/payments")
}

export async function getMyPayment(id: string): Promise<Payment> {
  return request<Payment>(`/api/student/me/payments/${encodeURIComponent(id)}`)
}

export async function getMyPaymentSettlement(id: string): Promise<Settlement> {
  return request<Settlement>(
    `/api/student/me/payments/${encodeURIComponent(id)}/settlement`
  )
}

export async function payInvoice(invoiceId: string): Promise<StudentPayResponse> {
  return request<StudentPayResponse>("/api/student/me/pay", {
    method: "POST",
    body: { invoiceId },
    idempotencyKey: newIdempotencyKey(),
  })
}
