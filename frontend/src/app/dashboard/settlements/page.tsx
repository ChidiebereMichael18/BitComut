import { SettlementsManager } from "@/components/settlements/settlements-manager"

export const metadata = {
  title: "Settlements",
}

export default function SettlementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settlements</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Bitcoin payments are converted and settled to your local currency.
          You receive a settled amount without needing to operate Bitcoin
          infrastructure.
        </p>
      </div>
      <SettlementsManager />
    </div>
  )
}
