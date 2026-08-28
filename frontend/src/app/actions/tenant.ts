"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { TENANT_COOKIE, registerTenant } from "@/lib/tenants"
import { setExtraStudents } from "@/lib/mock/tenant-data"
import { apiRequest, newIdempotencyKey } from "@/lib/api/client"
import type { Invoice, InvoiceType, Student, Student as StudentRecord, Tenant } from "@/lib/types"

export async function setTenantCookie(slug: string): Promise<void> {
  const store = await cookies()
  store.set(TENANT_COOKIE, slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  })
  revalidatePath("/dashboard", "layout")
}

export async function clearTenantCookie(): Promise<void> {
  const store = await cookies()
  store.delete(TENANT_COOKIE)
  revalidatePath("/", "layout")
  revalidatePath("/dashboard", "layout")
}

export async function onboardTenant(
  tenant: Tenant,
  students: Student[] = []
): Promise<void> {
  // The backend has no tenant-provisioning endpoint yet; onboarding stays
  // local (registry + cookie) so the new university can immediately browse
  // the dashboard. Rows are written to the backend lazily (e.g. via imports).
  registerTenant(tenant)
  if (students.length > 0) setExtraStudents(tenant.slug, students)
  const store = await cookies()
  store.set(TENANT_COOKIE, tenant.slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  })
  revalidatePath("/dashboard", "layout")
}

export async function addStudentToTenant(
  slug: string,
  student: Student
): Promise<void> {
  await apiRequest<StudentRecord>("/api/students", {
    slug,
    method: "POST",
    idempotencyKey: newIdempotencyKey(),
    body: {
      name: student.name,
      email: student.email,
      phone: student.phone ?? null,
      program: student.program,
      year: student.year,
      status: student.status,
    },
  })
  revalidatePath("/dashboard/students", "page")
  revalidatePath("/dashboard", "layout")
}

export interface ImportStudentsSummary {
  imported: number
  updated: number
  duplicates: number
  failed: number
}

export interface CreateInvoiceInput {
  studentId: string
  type: InvoiceType
  description: string
  amount: number
  currency: string
  dueDate: string
}

/**
 * Create a new invoice in the backend (single tenant-scoped POST). The created
 * record is returned so the form can acknowledge it; the relevant pages are
 * revalidated so it shows up in the invoices list, the student's detail page
 * and the create-invoice picker.
 */
export async function addInvoiceToTenant(
  slug: string,
  input: CreateInvoiceInput
): Promise<Invoice> {
  const invoice = await apiRequest<Invoice>("/api/invoices", {
    slug,
    method: "POST",
    body: {
      studentId: input.studentId,
      type: input.type,
      description: input.description.trim(),
      amount: input.amount,
      currency: input.currency,
      dueDate: new Date(input.dueDate).toISOString(),
    },
  })

  revalidatePath("/dashboard/invoices/", "page")
  revalidatePath("/dashboard/invoices", "page")
  revalidatePath("/dashboard", "layout")

  return invoice
}

/**
 * Bulk-import student records into the backend via CSV upload. The backend
 * computes imported/updated/duplicates itself (by student_id per tenant) and
 * reports per-row failures; the summary handed to the UI reports the count of
 * failed rows.
 */
export async function importStudentsToTenant(
  slug: string,
  students: Student[]
): Promise<ImportStudentsSummary> {
  if (students.length === 0) {
    return { imported: 0, updated: 0, duplicates: 0, failed: 0 }
  }

  const csv = await buildImportCsv(students)
  const form = new FormData()
  form.append("file", new Blob([csv], { type: "text/csv" }), "students.csv")

  const result = await apiRequest<{
    imported: number
    updated: number
    duplicates: number
    failed: { student_id: string; errors: string }[]
  }>("/api/students/import", {
    slug,
    method: "POST",
    formData: form,
    idempotencyKey: newIdempotencyKey(),
  })

  revalidatePath("/dashboard/students", "page")
  revalidatePath("/dashboard", "layout")

  return {
    imported: result.imported,
    updated: result.updated,
    duplicates: result.duplicates,
    failed: (result.failed ?? []).length,
  }
}

/** RFC 4180 CSV matching the backend import contract: student_id,name,email,status. */
async function buildImportCsv(students: Student[]): Promise<string> {
  const escape = (v: string) => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
    return v
  }
  const rows = [
    "student_id,name,email,status",
    ...students.map(
      (s) =>
        `${escape(s.id)},${escape(s.name)},${escape(s.email)},${(s.status ?? "Active").toUpperCase()}`
    ),
  ]
  return rows.join("\n")
}