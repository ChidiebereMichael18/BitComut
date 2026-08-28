import Link from "next/link"
import { Plus } from "lucide-react"

import { InvoicesManager } from "@/components/invoices/invoices-manager"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Invoices",
}

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="mt-1 text-muted-foreground">
            Manage student invoices and their payment status.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/invoices/new">
            <Plus className="size-4" aria-hidden="true" />
            Create Invoice
          </Link>
        </Button>
      </div>
      <InvoicesManager />
    </div>
  )
}
