"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch, type SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Search,
  Users,
  Wallet,
  FileText,
} from "lucide-react"

import { INVOICE_TYPES, CURRENCY_OPTIONS } from "@/lib/constants"
import { addInvoiceToTenant } from "@/app/actions/tenant"
import type { InvoiceType } from "@/lib/types"
import { useTenant, useTenantSlug } from "@/components/tenant-provider"
import { useAsync } from "@/hooks/use-async"
import { getStudents, type StudentSummary } from "@/lib/services/students"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { InvoiceReview } from "@/components/invoices/invoice-review"
import { formatCurrency } from "@/lib/format"
import { getCurrency, getCurrencySymbol } from "@/lib/currencies"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  type: z.string().min(1, "Select an invoice type"),
  description: z.string().min(3, "Add a short description"),
  amount: z.number().int().positive("Amount must be greater than 0"),
  currency: z.string().min(1),
  dueDate: z.string().min(1, "Pick a due date"),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const STEPS = [
  { label: "Student", icon: Users },
  { label: "Details", icon: Wallet },
  { label: "Review", icon: FileText },
] as const

const QUICK_AMOUNTS = [50000, 150000, 300000, 500000]

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center" aria-label="Invoice creation progress">
      {STEPS.map((s, i) => {
        const Icon = s.icon
        const isDone = i < step
        const isActive = i === step
        const isLast = i === STEPS.length - 1
        return (
          <div key={s.label} className="flex items-center last:flex-none">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  <Icon className="size-3.5" aria-hidden="true" />
                )}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {!isLast ? (
              <div
                className={cn("mx-2 h-px w-8 sm:w-12", i < step ? "bg-emerald-500/50" : "bg-muted")}
                aria-hidden="true"
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function StudentAvatar({ student }: { student: StudentSummary }) {
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
      {initials}
    </span>
  )
}

function SelectedStatus({ student }: { student: StudentSummary }) {
  if (student.paymentStatus === "Outstanding")
    return <span className="text-destructive">Outstanding</span>
  if (student.paymentStatus === "Partially Paid")
    return <span className="text-amber-600 dark:text-amber-400">Partial</span>
  return null
}

export function CreateInvoiceForm() {  const slug = useTenantSlug()
  const tenant = useTenant()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [createdNumber, setCreatedNumber] = useState<string | null>(null)
  const [studentSearch, setStudentSearch] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)

  const { data: allStudents, loading: studentsLoading } = useAsync<StudentSummary[]>(
    () => getStudents("", slug),
    [slug]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      type: "Tuition",
      description: "",
      amount: undefined,
      currency: tenant.currency,
      dueDate: "",
      notes: "",
    },
  })

  const values = useWatch({ control: form.control })
  const currency = values.currency || tenant.currency
  const amountValue = values.amount || 0

  const selectedStudent = useMemo(
    () => allStudents?.find((s) => s.id === values.studentId),
    [allStudents, values.studentId]
  )

  const studentOptions = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!allStudents) return []
    if (!q) return allStudents
    return allStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    )
  }, [allStudents, studentSearch])

  const today = new Date().toISOString().split("T")[0]

  const pickStudent = (id: string) => {
    form.setValue("studentId", id, { shouldValidate: true, shouldDirty: true })
    setPickerOpen(false)
    setStudentSearch("")
  }

  const goNext = async () => {
    if (step === 0) {
      const ok = await form.trigger("studentId")
      if (!ok) return
      setStep(1)
    } else if (step === 1) {
      const ok = await form.trigger(["type", "amount", "currency", "dueDate", "description"])
      if (!ok) return
      setStep(2)
    }
  }

  const goBack = () => setStep((s) => Math.max(0, s - 1))

  // The ONLY path that creates an invoice is the explicit "Create & Send
  // Invoice" submit button rendered on the Review step. Native form
  // submission (e.g. pressing Enter) on any other step must never create.
  const onSubmit: SubmitHandler<FormValues> = async (values, e) => {
    e?.preventDefault()
    if (step !== 2) return
    setSubmitting(true)
    try {
      const invoice = await addInvoiceToTenant(slug, {
        studentId: values.studentId,
        type: values.type as InvoiceType,
        description: values.description,
        amount: values.amount,
        currency: values.currency,
        dueDate: values.dueDate,
      })
      setCreatedNumber(invoice.number)
    } catch {
      toast.error("Unable to create invoice", {
        description: "Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    form.reset({
      studentId: "",
      type: "Tuition",
      description: "",
      amount: undefined,
      currency: tenant.currency,
      dueDate: "",
      notes: "",
    })
    setStep(0)
    setCreatedNumber(null)
    setStudentSearch("")
    setPickerOpen(false)
  }

  if (createdNumber) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="size-7 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight">Invoice created</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{createdNumber}</span> was created
            for {selectedStudent?.name} for {formatCurrency(amountValue, currency)} and is
            ready to be paid.
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard/invoices">View invoices</Link>
          </Button>
          <Button variant="outline" onClick={resetForm}>
            Create another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && step !== 2) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        className="flex h-full flex-col overflow-hidden"
      >
        {/* Header + stepper */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/40 pb-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">Create Invoice</h1>
            <p className="text-xs text-muted-foreground">
              Charge a student for tuition, registration, or other fees.
            </p>
          </div>
          <div className="shrink-0">
            <Stepper step={step} />
          </div>
        </div>

        {/* Step content */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-1 py-4">
          {step === 0 ? (
            /* Student */
            <div className="w-full max-w-xl space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">Select a student</h2>
                <p className="text-sm text-muted-foreground">
                  Choose the student this invoice is for. Search by name, ID, or email.
                </p>
              </div>

              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <button
                            type="button"
                            role="combobox"
                            aria-expanded={pickerOpen}
                            aria-controls="student-picker"
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                              field.value ? "border-input text-foreground" : "border-input text-muted-foreground"
                            )}
                          >
                            {selectedStudent ? (
                              <span className="flex min-w-0 items-center gap-3">
                                <StudentAvatar student={selectedStudent} />
                                <span className="min-w-0">
                                  <span className="block truncate font-medium">
                                    {selectedStudent.name}
                                  </span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {selectedStudent.id} · {selectedStudent.program}
                                  </span>
                                </span>
                                <span className="ml-auto shrink-0 text-xs font-semibold">
                                  <SelectedStatus student={selectedStudent} />
                                </span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Users className="size-4" aria-hidden="true" />
                                Select a student
                              </span>
                            )}
                          </button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        id="student-picker"
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <div className="flex items-center gap-2 border-b px-3">
                          <Search
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <input
                            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Search students..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                          />
                        </div>
                        <div className="max-h-72 overflow-y-auto p-1">
                          {studentsLoading ? (
                            <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                              Loading students...
                            </div>
                          ) : studentOptions.length === 0 ? (
                            <div className="flex flex-col items-center gap-1 px-3 py-8 text-center">
                              <GraduationCap
                                className="size-5 text-muted-foreground"
                                aria-hidden="true"
                              />
                              <p className="text-sm text-muted-foreground">No students found</p>
                            </div>
                          ) : (
                            studentOptions.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => pickStudent(s.id)}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-accent",
                                  s.id === field.value && "bg-accent"
                                )}
                              >
                                <StudentAvatar student={s} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-medium">{s.name}</span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {s.id} · {s.program}
                                  </span>
                                </span>
                                {s.id === field.value ? (
                                  <Check
                                    className="size-4 shrink-0 text-primary"
                                    aria-hidden="true"
                                  />
                                ) : null}
                              </button>
                            ))
                          )}
                        </div>
                        {!studentsLoading && (allStudents ?? []).length === 0 ? (
                          <div className="border-t p-3 text-center text-sm text-muted-foreground">
                            <span>No students yet. </span>
                            <Link
                              href="/dashboard/students"
                              className="font-medium text-primary hover:underline"
                            >
                              Add students
                            </Link>
                          </div>
                        ) : null}
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : step === 1 ? (
            /* Details — 2-column grid */
            <div className="w-full max-w-3xl space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">Invoice details</h2>
                <p className="text-sm text-muted-foreground">
                  Set what is being charged, the amount, and when it is due.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Select invoice type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INVOICE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Select currency">
                            {field.value ? (
                              <span className="flex items-center gap-2">
                                <span aria-hidden="true">{getCurrency(field.value).flag}</span>
                                <span>{getCurrency(field.value).code}</span>
                              </span>
                            ) : (
                              <SelectValue placeholder="Currency" />
                            )}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              <span className="flex items-center gap-2">
                                <span aria-hidden="true">{c.flag}</span>
                                <span>{c.code}</span>
                                <span className="text-xs text-muted-foreground">{c.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                </div>
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                          {getCurrencySymbol(currency)}
                        </span>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? undefined : Number(e.target.value)
                              )
                            }
                            className="pl-14"
                            aria-label="Invoice amount"
                          />
                        </FormControl>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {QUICK_AMOUNTS.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => field.onChange(a)}
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                              field.value === a
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:opacity-80"
                            )}
                          >
                            {formatCurrency(a, currency)}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due date</FormLabel>
                      <FormControl>
                        <Input type="date" min={today} {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Payable by this date.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Semester 1 Tuition" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional internal notes"
                          rows={3}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ) : (
            /* Review */
            <div className="w-full max-w-2xl space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">Review invoice</h2>
                <p className="text-sm text-muted-foreground">
                  Check everything looks right before creating the invoice.
                </p>
              </div>

              <InvoiceReview values={values} selectedStudent={selectedStudent} />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/40 pt-3">
          <Button
            type="button"
            variant="ghost"
            className="gap-1"
            onClick={() => (step === 0 ? router.push("/dashboard/invoices") : goBack())}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < 2 ? (
            <Button type="button" onClick={goNext} className="gap-1">
              Continue
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  Create &amp; Send Invoice
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
