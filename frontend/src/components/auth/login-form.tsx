"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setClientTenant } from "@/lib/tenant-context"
import { login } from "@/app/actions/auth"

const DEMO_EMAIL = "digitalartsuniversiti@edu.co"
const DEMO_PASSWORD = "Rwanda@123"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError("Please enter your email and password.")
      return
    }
    setLoading(true)
    try {
      const result = await login(email.trim(), password)
      setClientTenant(result.tenant.slug)
      toast.success("Signed in", {
        description: `Welcome back to ${result.tenant.name}.`,
      })
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.")
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setError(null)
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight">Sign in</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your university&apos;s finance portal.
        </p>
      </div>

      <div className="rounded-xl border p-3">
        <Label className="mb-2 block text-xs text-muted-foreground">
          Try the Digital Art University demo
        </Label>
        <DemoButton
          color="violet"
          label="Digital Art University"
          sub="Rwanda · RWF"
          onClick={fillDemo}
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          Use demo credentials — they will be filled in automatically.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="login-email">Work email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="finance@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Signing in...
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline"
        >
          Onboard your university
        </Link>
      </p>
    </form>
  )
}

function DemoButton({
  onClick,
  label,
  sub,
  color,
}: {
  onClick: () => void
  label: string
  sub: string
  color: string
}) {
  const dot = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500",
    rose: "bg-rose-500",
  }[color]
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border p-2 text-left transition-colors hover:bg-accent"
    >
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${dot}`} />
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium">{label}</span>
        <span className="block text-[10px] text-muted-foreground">{sub}</span>
      </span>
    </button>
  )
}
