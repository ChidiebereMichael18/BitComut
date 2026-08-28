import { PaymentsManager } from "@/components/payments/payments-manager"

export const metadata = {
  title: "Payments",
}

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Monitor all student payments and settlement activity.
        </p>
      </div>
      <PaymentsManager />
    </div>
  )
}
