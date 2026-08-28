import type { Invoice, Payment, Student } from "@/lib/types"
import { apiRequest } from "@/lib/api/client"

export interface SearchResultItem {
  id: string
  kind: "student" | "payment" | "invoice"
  title: string
  meta: string
  href: string
}

export interface GlobalSearchResults {
  students: SearchResultItem[]
  payments: SearchResultItem[]
  invoices: SearchResultItem[]
}

// Tenant-aware global search backed by the backend's `search` endpoints.
export async function globalSearch(
  query: string,
  slug?: string
): Promise<GlobalSearchResults> {
  const q = query.trim()
  if (!q || !slug) {
    return { students: [], payments: [], invoices: [] }
  }

  const [students, payments, invoices] = await Promise.all([
    apiRequest<{ data: Student[] }>(
      `/api/students?search=${encodeURIComponent(q)}&limit=5`,
      { slug }
    ).catch(() => ({ data: [] as Student[] })),
    apiRequest<Payment[]>(
      `/api/payments?search=${encodeURIComponent(q)}&limit=5`,
      { slug }
    ).catch(() => [] as Payment[]),
    apiRequest<Invoice[]>(
      `/api/invoices?search=${encodeURIComponent(q)}`,
      { slug }
    ).catch(() => [] as Invoice[]),
  ])

  return {
    students: students.data.slice(0, 5).map((s) => ({
      id: s.id,
      kind: "student" as const,
      title: s.name,
      meta: `${s.id} · ${s.program}`,
      href: `/dashboard/students/${s.id}`,
    })),
    payments: payments.slice(0, 5).map((p) => ({
      id: p.id,
      kind: "payment" as const,
      title: p.studentId,
      meta: `${p.reference} · ${p.status}`,
      href: `/dashboard/payments/${p.id}`,
    })),
    invoices: invoices.slice(0, 5).map((inv) => ({
      id: inv.id,
      kind: "invoice" as const,
      title: inv.number,
      meta: `${inv.type} · ${inv.studentId}`,
      href: `/dashboard/invoices/${inv.id}`,
    })),
  }
}