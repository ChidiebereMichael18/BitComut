"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  Loader2,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { APP_NAME } from "@/lib/constants"
import { CURRENCY_CATALOG } from "@/lib/currencies"
import { register } from "@/app/actions/auth"
import { setClientTenant } from "@/lib/tenant-context"

const COUNTRIES = Array.from(
  new Set(CURRENCY_CATALOG.map((c) => c.country))
).sort()

type Step = "university" | "location" | "review"

const STEP_LABELS: Record<Step, string> = {
  university: "University",
  location: "Location",
  review: "Review",
}

export function SignUpForm() {
  const router = useRouter()
  const [mode, setMode] = useState<"start" | "onboarding">("start")
  const [step, setStep] = useState<Step>("university")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [uniName, setUniName] = useState("")
  const [shortName, setShortName] = useState("")

  const [campus, setCampus] = useState("")
  const [country, setCountry] = useState("Rwanda")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [currency, setCurrency] = useState("RWF")

  const initials = useMemo(
    () =>
      (shortName || uniName || "U")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [shortName, uniName]
  )

  const stepOrder: Step[] = ["university", "location", "review"]
  const stepIndex = stepOrder.indexOf(step)
  const progress = ((stepIndex + 1) / stepOrder.length) * 100

  const startOnboarding = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid university email.")
      return
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    setMode("onboarding")
    setStep("university")
  }

  const goTo = (to: Step) => {
    setError(null)
    setStep(to)
  }

  const handleNext = () => {
    if (step === "university") {
      if (!uniName.trim()) return setError("Please enter your university name.")
      if (!shortName.trim()) return setError("Please enter a short name / abbreviation.")
      return goTo("location")
    }
    if (step === "location") {
      if (!country) return setError("Please select your country.")
      if (!currency) return setError("Please select your currency.")
      return goTo("review")
    }
    goTo("review")
  }
  const handleCreate = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await register({
        tenant: {
          name: uniName.trim(),
          shortName: shortName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim(),
          address: address.trim(),
          currency,
          country,
          campusName: campus.trim() || "Main Campus",
          established: String(new Date().getFullYear()),
        },
        email: email.trim(),
        password,
        displayName: shortName.trim(),
      })
      setClientTenant(result.tenant.slug)
      toast.success(`${uniName} is set up`, {
        description: "Your finance portal is ready to go.",
      })
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create workspace.")
      setLoading(false)
    }
  }

  if (mode === "start") {
    return (
      <form onSubmit={startOnboarding} className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight">
            Onboard your university
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your university email and password to get started.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="su-email">University email</Label>
          <Input
            id="su-email"
            type="email"
            autoComplete="email"
            placeholder="finance@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="su-password">Password</Label>
          <Input
            id="su-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full gap-2">
          Continue
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have a workspace?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      {/* Decorative backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-40 top-1/3 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold">{APP_NAME}</p>
            <p className="text-xs text-muted-foreground">Powered by Bitcoin</p>
          </div>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Already have a workspace? <span className="text-primary">Sign in</span>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-6">
        {/* Progress */}
        <div className="mb-8 w-full max-w-xl">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              Step {stepIndex + 1} of {stepOrder.length}
            </span>
            <div className="flex items-center gap-1.5">
              {stepOrder.map((s) => {
                const i = stepOrder.indexOf(s)
                const isCurrent = i === stepIndex
                const isDone = i < stepIndex
                return (
                  <span
                    key={s}
                    className={`flex items-center gap-1.5 ${
                      isCurrent || isDone ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <Check className="size-3.5 text-primary" aria-hidden="true" />
                    ) : (
                      <span className="flex size-3.5 items-center justify-center">
                        {i + 1}
                      </span>
                    )}
                    <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                  </span>
                )
              })}
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="w-full max-w-xl" key={step}>
          {step === "university" ? (
            <div className="onb-step space-y-6">
              <StepHeading
                icon={<Building2 className="size-6" aria-hidden="true" />}
                title="Your university"
              />
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="onb-uni">University name</Label>
                  <Input
                    id="onb-uni"
                    autoComplete="organization"
                    className="h-12"
                    placeholder="Kigali International University"
                    value={uniName}
                    onChange={(e) => setUniName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="onb-short">Short name / abbreviation</Label>
                  <Input
                    id="onb-short"
                    className="h-12"
                    placeholder="KIU"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
                  <span className="font-medium">Workspace email</span>
                  <span className="truncate font-mono">{email}</span>
                </div>
              </div>
            </div>
          ) : null}

          {step === "location" ? (
            <div className="onb-step space-y-6">
              <StepHeading
                icon={<Zap className="size-6" aria-hidden="true" />}
                title="Location & currency"
              />
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="onb-country">Country</Label>
                    <select
                      id="onb-country"
                      className="flex h-12 w-full rounded-lg border border-input bg-transparent px-4 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="onb-currency">Default currency</Label>
                    <select
                      id="onb-currency"
                      className="flex h-12 w-full rounded-lg border border-input bg-transparent px-4 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      {CURRENCY_CATALOG.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="onb-campus">Campus</Label>
                  <Input
                    id="onb-campus"
                    className="h-12"
                    placeholder="Kigali Main Campus"
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="onb-address">Address</Label>
                  <Input
                    id="onb-address"
                    className="h-12"
                    placeholder="KN 7 Ave, Kigali, Rwanda"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="onb-phone">Phone</Label>
                    <Input
                      id="onb-phone"
                      type="tel"
                      className="h-12"
                      placeholder="+250 788 000 001"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="onb-website">Website</Label>
                    <Input
                      id="onb-website"
                      className="h-12"
                      placeholder="www.university.edu"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === "review" ? (
            <div className="onb-step space-y-6">
              <StepHeading
                icon={<Check className="size-6" aria-hidden="true" />}
                title="Review"
              />
              <div className="space-y-4 rounded-2xl border p-5">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{uniName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {shortName} · {country} · {currency}
                    </p>
                  </div>
                </div>
                <ReviewRow label="Admin email" value={email} />
                <ReviewRow label="Campus" value={campus || "—"} />
                <ReviewRow label="Address" value={address || "—"} />
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Footer nav */}
      <footer className="relative z-10 flex items-center justify-between gap-3 px-6 py-6 sm:px-10">
        {step !== "university" ? (
          <Button
            type="button"
            variant="ghost"
            className="h-12 gap-1 px-6 text-base"
            onClick={() => goTo(stepOrder[stepIndex - 1])}
            disabled={loading}
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="h-12 gap-1 px-6 text-base"
            onClick={() => setMode("start")}
            disabled={loading}
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back
          </Button>
        )}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {step !== "review" ? (
          <Button type="button" className="h-12 gap-2 px-8 text-base" onClick={handleNext}>
            Continue
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" className="h-12 gap-2 px-8 text-base" onClick={handleCreate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                Setting up...
              </>
            ) : (
              <>
                <Check className="size-5" aria-hidden="true" />
                Create workspace
              </>
            )}
          </Button>
        )}
      </footer>
    </div>
  )
}

function StepHeading({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="space-y-3 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
        {icon}
      </span>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </div>
  )
}
