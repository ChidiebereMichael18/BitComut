import type { Metadata } from "next"

import { ProfileForm } from "@/components/settings/profile-form"

export const metadata: Metadata = {
  title: "Profile & Settings",
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your display name, email, and account details.
        </p>
      </div>
      <ProfileForm />
    </div>
  )
}
