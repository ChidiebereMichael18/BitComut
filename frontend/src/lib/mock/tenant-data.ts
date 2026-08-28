import type {
  Invoice,
  Payment,
  Receipt,
  Settlement,
  Student,
  InvoiceType,
} from "@/lib/types"
import { getTenantBySlug } from "@/lib/tenants"

const CURRENCY_RATE: Record<string, number> = {
  RWF: 480_000_000,
  KES: 7_400_000,
  UGX: 280_000_000,
  TZS: 2_200_000_000,
  NGN: 1_600_000_000,
}

const PROGRAMS = [
  "BSc Computer Science",
  "BSc Business Administration",
  "BSc Accounting & Finance",
  "BSc Information Technology",
  "BSc Nursing",
  "BA Economics",
  "BEng Civil Engineering",
  "BA Law",
]

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"]

const FIRST = [
  "Aisha",
  "Brian",
  "Cynthia",
  "David",
  "Evelyn",
  "Frank",
  "Grace",
  "Hakim",
  "Ivy",
  "John",
  "Kevin",
  "Lydia",
  "Michael",
  "Nancy",
  "Oscar",
  "Pauline",
  "Ruth",
  "Samuel",
  "Tina",
  "Victor",
]

const LAST = [
  "Mwangi",
  "Ochieng",
  "Uwase",
  "Nkurunziza",
  "Otieno",
  "Mukamana",
  "Kimani",
  "Habimana",
  "Wanjiku",
  "Tumusiime",
  "Chipeta",
  "Doe",
  "Njoroge",
  "Mutesi",
  "Barasa",
  "Ingabire",
  "Gahigi",
  "Nyambura",
  "Kamanzi",
  "Achieng",
]

const TYPES: InvoiceType[] = [
  "Tuition",
  "Registration",
  "Application Fee",
  "Examination Fee",
  "Accommodation",
  "Library Fee",
]

const TYPES_DESC: Record<InvoiceType, string> = {
  Tuition: "Tuition — Semester 1",
  Registration: "Registration — Semester 1",
  "Application Fee": "Application Fee",
  "Examination Fee": "Examination Fee",
  Accommodation: "On-campus accommodation",
  "Library Fee": "Library facility fee",
}

interface Dataset {
  students: Student[]
  invoices: Invoice[]
  payments: Payment[]
  settlements: Settlement[]
  receipts: Receipt[]
}

const extraStudents: Record<string, Student[]> = {}

export function setExtraStudents(slug: string, students: Student[]): void {
  extraStudents[slug] = students
}

export function appendExtraStudent(slug: string, student: Student): void {
  extraStudents[slug] = [...getExtraStudents(slug), student]
}

export function getExtraStudents(slug: string): Student[] {
  return extraStudents[slug] ?? []
}

const extraInvoices: Record<string, Invoice[]> = {}

const EXTRA_INVOICES_KEY = "bitcomut:invoices:extra"

/**
 * Client-side persistence for student-created invoices, backed by localStorage.
 * Server actions also append to the in-memory map (the same module runs in the
 * server realm), so a freshly created invoice shows up immediately in the
 * browser *and* survives a reload. Mirrors the tenant-registry pattern.
 */
function readStoredInvoices(): Record<string, Invoice[]> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(EXTRA_INVOICES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, Invoice[]>) : {}
  } catch {
    return {}
  }
}

function writeStoredInvoices(map: Record<string, Invoice[]>): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(EXTRA_INVOICES_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

export function getExtraInvoices(slug: string): Invoice[] {
  const stored = readStoredInvoices()[slug] ?? []
  const inMemory = extraInvoices[slug] ?? []
  const seen = new Set<string>()
  const merged: Invoice[] = []
  for (const inv of [...stored, ...inMemory]) {
    if (seen.has(inv.id)) continue
    seen.add(inv.id)
    merged.push(inv)
  }
  return merged
}

export function appendExtraInvoice(slug: string, invoice: Invoice): void {
  extraInvoices[slug] = [...getExtraInvoices(slug), invoice]
  const stored = readStoredInvoices()
  stored[slug] = [...(stored[slug] ?? []), invoice]
  writeStoredInvoices(stored)
}

function buildStudents(
  tenantSlug: string,
  slugShort: string,
  count: number
): Student[] {
  const students: Student[] = []
  for (let i = 0; i < count; i++) {
    const first = FIRST[i % FIRST.length]
    const last = LAST[(i * 7) % LAST.length]
    const id = `STU-${new Date().getFullYear()}-${String(1000 + i)}`
    const domain = tenantSlug.includes("nairobi")
      ? "students.uonbi.ac.ke"
      : tenantSlug.includes("cavendish")
        ? "students.cavendish.ac.ug"
        : "students.kiu.edu"
    students.push({
      id,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
      phone: `+250 78X ${String(100000 + i * 911)}`,
      program: PROGRAMS[i % PROGRAMS.length],
      year: YEARS[i % YEARS.length],
      status: i % 8 === 0 ? "Inactive" : "Active",
    })
  }
  return students
}

export function getTenantDataset(slug: string): Dataset {
  const fallback = getTenantBySlug(slug)
  if (!fallback) return getTenantDataset("kigali-international-university")
  const short = fallback.shortName.toLowerCase()
  const year = new Date().getFullYear()
  const scaleRate = CURRENCY_RATE[fallback.currency] ?? CURRENCY_RATE.RWF

  const count = fallback.slug === "kigali-international-university" ? 16 : 14
  const students = buildStudents(slug, short, count)

  const invoices: Invoice[] = []
  const payments: Payment[] = []
  const settlements: Settlement[] = []
  const receipts: Receipt[] = []

  const amounts = [1500000, 50000, 150000, 300000, 250000, 100000]
  const statuses: Array<Invoice["status"]> = [
    "Paid",
    "Unpaid",
    "Partially Paid",
    "Overdue",
    "Unpaid",
  ]
  const payStatuses: Array<Payment["status"]> = [
    "Settled",
    "Processing",
    "Pending",
    "Failed",
    "Settled",
    "Paid",
  ]

  const scaleAmount = (a: number) => (scaleRate ? Math.round(a) : a)
  const satsFor = (local: number) =>
    Math.round((local / scaleRate) * 100_000_000)

  students.forEach((student, idx) => {
    const invId = `INV-${year}-${String(1000 + idx)}`
    const type = TYPES[idx % TYPES.length]
    const amount = scaleAmount(amounts[idx % amounts.length])
    const invStatus = statuses[idx % statuses.length]

    invoices.push({
      id: invId,
      number: invId,
      studentId: student.id,
      type,
      description: TYPES_DESC[type],
      amount,
      currency: fallback.currency,
      dueDate: `2026-09-${String(10 + (idx % 10))}T00:00:00Z`,
      status: invStatus,
      created: `2026-0${(idx % 8) + 1}-15T08:00:00Z`,
      amountPaid:
        invStatus === "Paid" || invStatus === "Partially Paid"
          ? invStatus === "Paid"
            ? amount
            : Math.round(amount * 0.5)
          : 0,
    })

    if (invStatus === "Paid" || invStatus === "Partially Paid") {
      const payId = `PAY-${year}-${String(100 + idx)}`
      const payStatus = payStatuses[idx % payStatuses.length]
      payments.push({
        id: payId,
        reference: payId,
        studentId: student.id,
        invoiceId: invId,
        amount: invStatus === "Paid" ? amount : Math.round(amount * 0.5),
        currency: fallback.currency,
        btcSats: satsFor(amount),
        exchangeRate: scaleRate,
        method: idx % 3 === 0 ? "Lightning Network" : "Bitcoin / Lightning",
        network: idx % 3 === 0 ? "Lightning Network" : "On-chain (Bitcoin)",
        status: payStatus,
        date: `2026-08-${String(10 + (idx % 15))}T09:${String(10 + idx)}:00Z`,
        confirmedAt: `2026-08-${String(10 + (idx % 15))}T09:${String(
          11 + idx
        )}:00Z`,
        settlementDate:
          payStatus === "Settled"
            ? `2026-08-${String(10 + (idx % 15))}T09:${String(12 + idx)}:00Z`
            : undefined,
      })

      if (payStatus === "Settled") {
        const settleId = `SET-${year}-${String(100 + idx)}`
        const fees = Math.round((amount * 0.01 * 100) / 100)
        settlements.push({
          id: settleId,
          reference: settleId,
          paymentId: payId,
          studentId: student.id,
          btcSats: satsFor(amount),
          localAmount: amount,
          currency: fallback.currency,
          exchangeRate: scaleRate,
          fees,
          netAmount: amount - fees,
          status: "Settled",
          date: `2026-08-${String(10 + (idx % 15))}T09:${String(12 + idx)}:00Z`,
        })
      }

      receipts.push({
        id: `RCT-${year}-${String(100 + idx)}`,
        number: `RCT-${year}-${String(100 + idx)}`,
        studentId: student.id,
        invoiceId: invId,
        paymentId: payId,
        amount: invStatus === "Paid" ? amount : Math.round(amount * 0.5),
        currency: fallback.currency,
        date: `2026-08-${String(10 + (idx % 15))}T09:${String(12 + idx)}:00Z`,
        status: "Issued",
      })
    }
  })

  return { students, invoices, payments, settlements, receipts }
}
