import type { Invoice, Payment, Student } from "@/lib/types"
import { apiRequest } from "@/lib/api/client"

export interface PaymentDetail extends Payment {
  studentName: string
  studentEmail: string
  invoiceNumber: string
  invoiceType: string
  invoiceDescription: string
}

export interface PaymentFilters {
  search?: string
  status?: string
  settlement?: string
  method?: string
  currency?: string
}

function enrichPayment(
  payment: Payment,
  studentById: Map<string, Student>,
  invoiceById: Map<string, Invoice>
): PaymentDetail {
  const student = studentById.get(payment.studentId)
  const invoice = invoiceById.get(payment.invoiceId)
  return {
    ...payment,
    studentName: student?.name ?? payment.studentId,
    studentEmail: student?.email ?? "",
    invoiceNumber: invoice?.number ?? payment.invoiceId,
    invoiceType: invoice?.type ?? "Tuition",
    invoiceDescription: invoice?.description ?? "",
  }
}

async function enrichPayments(
  payments: Payment[],
  slug: string
): Promise<PaymentDetail[]> {
  if (payments.length === 0) return []
  const [students, invoices] = await Promise.all([
    apiRequest<{ data: Student[] }>("/api/students?limit=100", { slug }),
    apiRequest<Invoice[]>("/api/invoices", { slug }),
  ])
  const smap = new Map(students.data.map((s) => [s.id, s]))
  const imap = new Map(invoices.map((i) => [i.id, i]))
  return payments.map((p) => enrichPayment(p, smap, imap))
}

export async function getPayments(
  filters: PaymentFilters = {},
  slug?: string
): Promise<PaymentDetail[]> {
  if (!slug) return []
  const qs = new URLSearchParams()
  for (const key of ["search", "status", "settlement", "method", "currency"] as const) {
    const value = filters[key]
    if (value) qs.set(key, value)
  }
  qs.set("limit", "100")
  const payments = await apiRequest<Payment[]>(`/api/payments?${qs}`, { slug })
  return enrichPayments(payments, slug)
}

export async function getPaymentsByStudent(
  studentId: string,
  slug?: string
): Promise<PaymentDetail[]> {
  if (!slug) return []
  const payments = await apiRequest<Payment[]>(
    `/api/students/${encodeURIComponent(studentId)}/payments`,
    { slug }
  )
  return enrichPayments(payments, slug)
}

export async function getPayment(
  id: string,
  slug?: string
): Promise<PaymentDetail> {
  if (!slug) throw new Error("No tenant context")
  const payment = await apiRequest<Payment>(
    `/api/payments/${encodeURIComponent(id)}`,
    { slug }
  )
  const enriched = await enrichPayments([payment], slug)
  return enriched[0]
}
