import type { Invoice, Student } from "@/lib/types"
import { apiRequest } from "@/lib/api/client"

export interface InvoiceDetail extends Invoice {
  studentName: string
  studentEmail: string
}

export async function getInvoices(slug?: string): Promise<InvoiceDetail[]> {
  if (!slug) return []
  const [invoices, students] = await Promise.all([
    apiRequest<Invoice[]>("/api/invoices", { slug }),
    apiRequest<{ data: Student[] }>("/api/students?limit=100", { slug }),
  ])
  const byId = new Map(students.data.map((s) => [s.id, s]))
  return invoices.map((i) => enrichInvoice(i, byId))
}

function enrichInvoice(
  invoice: Invoice,
  studentById: Map<string, Student>
): InvoiceDetail {
  const student = studentById.get(invoice.studentId)
  return {
    ...invoice,
    studentName: student?.name ?? invoice.studentId,
    studentEmail: student?.email ?? "",
  }
}

export async function getInvoicesByStudent(
  studentId: string,
  slug?: string
): Promise<InvoiceDetail[]> {
  if (!slug) return []
  const [invoices, student] = await Promise.all([
    apiRequest<Invoice[]>(`/api/students/${encodeURIComponent(studentId)}/invoices`, {
      slug,
    }),
    apiRequest<Student>(`/api/students/${encodeURIComponent(studentId)}`, { slug }),
  ])
  const byId = new Map([[student.id, student]])
  return invoices.map((i) => enrichInvoice(i, byId))
}

export async function getInvoiceDetail(
  id: string,
  slug?: string
): Promise<InvoiceDetail> {
  if (!slug) throw new Error("No tenant context")
  const invoice = await apiRequest<Invoice>(
    `/api/invoices/${encodeURIComponent(id)}`,
    { slug }
  )
  const student = await apiRequest<Student>(
    `/api/students/${encodeURIComponent(invoice.studentId)}`,
    { slug }
  )
  const byId = new Map([[student.id, student]])
  return enrichInvoice(invoice, byId)
}