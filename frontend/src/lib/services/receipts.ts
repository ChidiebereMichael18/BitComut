import type { Invoice, Payment, Receipt, Student } from "@/lib/types"
import { apiRequest } from "@/lib/api/client"

export interface ReceiptDetail extends Receipt {
  studentName: string
  studentId: string
  invoiceNumber: string
  invoiceLabel: string
  payment?: Payment
}

async function enrichReceipts(
  receipts: Receipt[],
  slug: string
): Promise<ReceiptDetail[]> {
  if (receipts.length === 0) return []
  const [students, invoices, payments] = await Promise.all([
    apiRequest<{ data: Student[] }>("/api/students?limit=100", { slug }),
    apiRequest<Invoice[]>("/api/invoices", { slug }),
    apiRequest<Payment[]>("/api/payments?limit=100", { slug }),
  ])
  const smap = new Map(students.data.map((s) => [s.id, s]))
  const imap = new Map(invoices.map((i) => [i.id, i]))
  const pmap = new Map(payments.map((p) => [p.id, p]))
  return receipts.map((r) => {
    const invoice = imap.get(r.invoiceId)
    const invoiceLabel = invoice
      ? `${invoice.type} — ${invoice.description}`
      : r.invoiceId
    return {
      ...r,
      studentName: smap.get(r.studentId)?.name ?? r.studentId,
      invoiceNumber: invoice?.number ?? r.invoiceId,
      invoiceLabel,
      payment: pmap.get(r.paymentId),
    }
  })
}

export async function getReceipts(slug?: string): Promise<ReceiptDetail[]> {
  if (!slug) return []
  const receipts = await apiRequest<Receipt[]>("/api/receipts", { slug })
  return enrichReceipts(receipts, slug)
}

export async function getReceipt(
  id: string,
  slug?: string
): Promise<ReceiptDetail> {
  if (!slug) throw new Error("No tenant context")
  const receipt = await apiRequest<Receipt>(
    `/api/receipts/${encodeURIComponent(id)}`,
    { slug }
  )
  const enriched = await enrichReceipts([receipt], slug)
  return enriched[0]
}

export async function getReceiptByPaymentId(
  paymentId: string,
  slug?: string
): Promise<ReceiptDetail | undefined> {
  if (!slug) return undefined
  try {
    const receipt = await apiRequest<Receipt>(
      `/api/payments/${encodeURIComponent(paymentId)}/receipt`,
      { slug }
    )
    const enriched = await enrichReceipts([receipt], slug)
    return enriched[0]
  } catch {
    return undefined
  }
}