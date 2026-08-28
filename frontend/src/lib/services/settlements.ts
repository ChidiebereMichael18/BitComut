import type { Payment, Settlement, Student } from "@/lib/types"
import { apiRequest } from "@/lib/api/client"

export interface SettlementDetail extends Settlement {
  studentName: string
  paymentReference: string
  isSimulated: boolean
}

async function enrichSettlements(
  settlements: Settlement[],
  slug: string
): Promise<SettlementDetail[]> {
  if (settlements.length === 0) return []
  const [payments, students] = await Promise.all([
    apiRequest<Payment[]>("/api/payments?limit=100", { slug }),
    apiRequest<{ data: Student[] }>("/api/students?limit=100", { slug }),
  ])
  const pmap = new Map(payments.map((p) => [p.id, p]))
  const smap = new Map(students.data.map((s) => [s.id, s]))
  return settlements.map((s) => ({
    ...s,
    studentName: smap.get(s.studentId)?.name ?? s.studentId,
    paymentReference: pmap.get(s.paymentId)?.reference ?? s.paymentId,
    isSimulated: false,
  }))
}

export async function getSettlements(slug?: string): Promise<SettlementDetail[]> {
  if (!slug) return []
  const settlements = await apiRequest<Settlement[]>("/api/settlements", { slug })
  return enrichSettlements(settlements, slug)
}

export async function getSettlement(
  id: string,
  slug?: string
): Promise<SettlementDetail> {
  if (!slug) throw new Error("No tenant context")
  const settlement = await apiRequest<Settlement>(
    `/api/settlements/${encodeURIComponent(id)}`,
    { slug }
  )
  const enriched = await enrichSettlements([settlement], slug)
  return enriched[0]
}

export async function getSettlementByPaymentId(
  paymentId: string,
  slug?: string
): Promise<SettlementDetail | undefined> {
  if (!slug) return undefined
  try {
    const settlement = await apiRequest<Settlement>(
      `/api/payments/${encodeURIComponent(paymentId)}/settlement`,
      { slug }
    )
    const enriched = await enrichSettlements([settlement], slug)
    return enriched[0]
  } catch {
    return undefined
  }
}