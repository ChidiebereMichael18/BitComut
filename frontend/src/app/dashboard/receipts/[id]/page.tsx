import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import type { Metadata } from "next"

import { getReceipt } from "@/lib/services/receipts"
import { getUniversity } from "@/lib/services/university"
import { getCurrentTenantSlug } from "@/lib/tenant-server"
import { ReceiptPreview } from "@/components/receipts/receipt-preview"
import { PrintToolbar } from "@/components/receipts/print-toolbar"
import { Button } from "@/components/ui/button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return { title: `Receipt ${id}` }
}

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const slug = await getCurrentTenantSlug()
  let receipt
  try {
    receipt = await getReceipt(id, slug)
  } catch {
    notFound()
  }

  const [university] = await Promise.all([getUniversity(slug)])

  return (
    <div className="mx-auto max-w-3xl space-y-4 print:m-0 print:max-w-none">
      <div className="no-print flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/receipts">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Receipts
          </Link>
        </Button>
        <PrintToolbar receipt={receipt} />
      </div>

      <div className="print:shadow-none">
        <ReceiptPreview receipt={receipt} university={university} />
      </div>
    </div>
  )
}
