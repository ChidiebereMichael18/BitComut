import type { Metadata } from "next"

import { SignUpForm } from "@/components/auth/sign-up-form"
import { APP_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Onboard your university",
}

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground">
          Onboard your university to manage student payments and settlements.
        </p>
      </div>
      <SignUpForm />
    </div>
  )
}
