import { getReceipts } from "@/lib/services/receipts"
import { getCurrentTenantSlug } from "@/lib/tenant-server"
import { PagedReceiptsList } from "@/components/receipts/paged-receipts-list"

export const metadata = {
  title: "Receipts",
}

export default async function ReceiptsPage() {
  const slug = await getCurrentTenantSlug()
  const receipts = await getReceipts(slug)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Receipts</h1>
        <p className="mt-1 text-muted-foreground">
          All generated payment receipts for students.
        </p>
      </div>
      <PagedReceiptsList receipts={receipts} />
    </div>
  )
}
