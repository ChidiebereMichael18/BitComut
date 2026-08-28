import type { StudentSummary } from "@/lib/services/students"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"

export interface InvoiceReviewValues {
  studentId?: string
  type?: string
  description?: string
  amount?: number
  currency?: string
  dueDate?: string
  notes?: string
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 border-b border-border/50 pb-2 text-sm font-semibold">
        {title}
      </h3>
      <dl className="divide-y divide-border/40">{children}</dl>
    </section>
  )
}

export function InvoiceReview({
  values,
  selectedStudent,
}: {
  values: InvoiceReviewValues
  selectedStudent?: StudentSummary
}) {
  const currency = values.currency ?? ""
  const amount = values.amount ?? 0

  return (
    <div className="space-y-4">
      <Section title="Student">
        <Row label="Name">
          {selectedStudent ? (
            <span className="flex items-center gap-2">
              {selectedStudent.name}
              <Badge variant="secondary" className="font-mono text-[10px]">
                {selectedStudent.id}
              </Badge>
            </span>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Program">{selectedStudent?.program ?? "—"}</Row>
        <Row label="Email">{selectedStudent?.email ?? "—"}</Row>
      </Section>

      <Section title="Billing Details">
        <Row label="Invoice Type">{values.type || "—"}</Row>
        <Row label="Currency">{currency || "—"}</Row>
        <Row label="Total Amount">
          <span className="font-semibold">{formatCurrency(amount, currency)}</span>
        </Row>
        <Row label="Due Date">
          {values.dueDate
            ? formatDate(values.dueDate, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </Row>
      </Section>

      <Section title="Additional Info">
        <Row label="Description">{values.description || "—"}</Row>
        <Row label="Internal Notes">{values.notes || "None"}</Row>
      </Section>
    </div>
  )
}
