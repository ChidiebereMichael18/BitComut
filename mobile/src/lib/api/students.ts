import type { Student, Invoice, Payment } from "@/lib/types"
import { apiRequest } from "@/lib/api/client"

export interface StudentSummary extends Student {
  totalInvoiced: number
  totalPaid: number
  outstanding: number
  lastPayment?: Payment
  lastPaymentDate?: string
  paymentStatus: "Fully Paid" | "Partially Paid" | "Outstanding" | "No Invoices"
}

const RECEIVED_PAYMENT_STATUSES = new Set([
  "Paid",
  "Settled",
  "Settlement Pending",
  "Processing",
])

function summarizeStudent(
  student: Student,
  invoices: Invoice[],
  payments: Payment[]
): StudentSummary {
  const studentInvoices = invoices.filter((i) => i.studentId === student.id)
  const studentPayments = payments.filter((p) => p.studentId === student.id)

  const totalInvoiced = studentInvoices.reduce(
    (sum, i) => sum + (i.status === "Cancelled" ? 0 : i.amount),
    0
  )
  const totalPaid = studentPayments
    .filter((p) => RECEIVED_PAYMENT_STATUSES.has(p.status))
    .reduce((sum, p) => sum + p.amount, 0)
  const outstanding = Math.max(0, totalInvoiced - totalPaid)

  const lastPayment = [...studentPayments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0]

  let paymentStatus: StudentSummary["paymentStatus"]
  if (totalInvoiced === 0) paymentStatus = "No Invoices"
  else if (outstanding <= 0) paymentStatus = "Fully Paid"
  else if (totalPaid > 0) paymentStatus = "Partially Paid"
  else paymentStatus = "Outstanding"

  return {
    ...student,
    totalInvoiced,
    totalPaid,
    outstanding,
    lastPayment,
    lastPaymentDate: lastPayment?.date,
    paymentStatus,
  }
}

async function summarizeMany(
  students: Student[],
  slug: string
): Promise<StudentSummary[]> {
  if (students.length === 0) return []
  const [invoices, payments] = await Promise.all([
    apiRequest<Invoice[]>("/api/invoices", { slug }),
    apiRequest<Payment[]>("/api/payments?limit=100", { slug }),
  ])
  return students.map((s) => summarizeStudent(s, invoices, payments))
}

export async function getStudents(
  search = "",
  slug?: string
): Promise<StudentSummary[]> {
  if (!slug) return []
  const qs = `search=${encodeURIComponent(search)}&limit=100`
  const res = await apiRequest<{ data: Student[] }>(`/api/students?${qs}`, {
    slug,
  })
  return summarizeMany(res.data, slug)
}

export async function getStudentSummary(
  id: string,
  slug?: string
): Promise<StudentSummary> {
  if (!slug) throw new Error("No tenant context")
  const [student, invoices, payments] = await Promise.all([
    apiRequest<Student>(`/api/students/${encodeURIComponent(id)}`, { slug }),
    apiRequest<Invoice[]>("/api/invoices", { slug }),
    apiRequest<Payment[]>("/api/payments?limit=100", { slug }),
  ])
  return summarizeStudent(student, invoices, payments)
}

export async function getStudentRecord(
  id: string,
  slug?: string
): Promise<Student | undefined> {
  if (!slug) return undefined
  try {
    return await apiRequest<Student>(
      `/api/students/${encodeURIComponent(id)}`,
      { slug }
    )
  } catch {
    return undefined
  }
}
