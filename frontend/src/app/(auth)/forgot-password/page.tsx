import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Forgot Password",
}

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2">
        <Link href="/login">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </Button>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
        <p className="text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  )
}
