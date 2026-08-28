import type { Invoice, Payment, Receipt, Settlement, Student } from "@/lib/types"
import { students } from "@/lib/mock/students"
import { invoices } from "@/lib/mock/invoices"
import { payments } from "@/lib/mock/payments"
import { settlements } from "@/lib/mock/settlements"
import { receipts } from "@/lib/mock/receipts"
import { getTenantDataset, getExtraStudents, getExtraInvoices } from "@/lib/mock/tenant-data"

const kiuStudents: Student[] = students
const kiuInvoices: Invoice[] = invoices
const kiuPayments: Payment[] = payments
const kiuSettlements: Settlement[] = settlements
const kiuReceipts: Receipt[] = receipts

export function datasetFor(slug?: string): {
  students: Student[]
  invoices: Invoice[]
  payments: Payment[]
  settlements: Settlement[]
  receipts: Receipt[]
} {
  if (!slug || slug === "kigali-international-university") {
    return {
      students: kiuStudents,
      invoices: kiuInvoices,
      payments: kiuPayments,
      settlements: kiuSettlements,
      receipts: kiuReceipts,
    }
  }
  return getTenantDataset(slug)
}

export function getAllStudents(slug?: string): Student[] {
  const key =
    slug && slug !== "kigali-international-university"
      ? slug
      : "kigali-international-university"
  return [...datasetFor(slug).students, ...getExtraStudents(key)]
}
export function getAllInvoices(slug?: string): Invoice[] {
  const key =
    slug && slug !== "kigali-international-university"
      ? slug
      : "kigali-international-university"
  return [...datasetFor(slug).invoices, ...getExtraInvoices(key)]
}
export function getAllPayments(slug?: string): Payment[] {
  return datasetFor(slug).payments
}
export function getAllSettlements(slug?: string): Settlement[] {
  return datasetFor(slug).settlements
}
export function getAllReceipts(slug?: string): Receipt[] {
  return datasetFor(slug).receipts
}

export function getStudent(id: string, slug?: string): Student | undefined {
  return getAllStudents(slug).find((s) => s.id === id)
}
export function getInvoice(id: string, slug?: string): Invoice | undefined {
  return getAllInvoices(slug).find((i) => i.id === id)
}
export function getPayment(id: string, slug?: string): Payment | undefined {
  return getAllPayments(slug).find((p) => p.id === id)
}
export function getSettlement(id: string, slug?: string): Settlement | undefined {
  return getAllSettlements(slug).find((s) => s.id === id)
}
export function getReceipt(id: string, slug?: string): Receipt | undefined {
  return getAllReceipts(slug).find((r) => r.id === id)
}
