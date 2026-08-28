import type { Metadata } from "next"

import { PreferencesForm } from "@/components/settings/preferences-form"

export const metadata: Metadata = {
  title: "Preferences & Settings",
}

export default function PreferencesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Preferences</h1>
        <p className="mt-1 text-muted-foreground">
          Customize appearance, currency defaults, and notifications.
        </p>
      </div>
      <PreferencesForm />
    </div>
  )
}
