import { getUniversity } from "@/lib/services/university"
import { SettingsForm } from "@/components/settings/settings-form"

export const metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
  const university = await getUniversity()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your university profile, payment settings, notifications, and
          security.
        </p>
      </div>
      <SettingsForm university={university} />
    </div>
  )
}
