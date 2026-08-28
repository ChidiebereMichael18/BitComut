import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"
import { APP_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Sign In",
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground">
          Sign in to manage student payments and settlements.
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
