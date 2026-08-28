import Link from "next/link"
import {
  ArrowRight,
  Banknote,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/layout/theme-toggle"

const features = [
  {
    icon: Zap,
    title: "Bitcoin & Lightning payments",
    description:
      "Students pay with Bitcoin or Lightning — instantly, with near-zero fees. No slow, costly card processing.",
  },
  {
    icon: Banknote,
    title: "Settle in Rwandan Francs",
    description:
      "Payments are automatically converted and settled into RWF. You manage familiar numbers, never crypto.",
  },
  {
    icon: ShieldCheck,
    title: "Live receipt tracking",
    description:
      "Every payment generates a tamper-evident receipt. Verify settlement status at a glance with a full audit trail.",
  },
  {
    icon: Landmark,
    title: "Real-time dashboard",
    description:
      "Monitor incoming payments, students, and settlements in real time from one clean, finance-grade dashboard.",
  },
  {
    icon: Wallet,
    title: "Unified student billing",
    description:
      "Send tuition and fee invoices, track outstanding balances, and reconcile payments against each student.",
  },
  {
    icon: Sparkles,
    title: "Zero crypto infrastructure",
    description:
      "No wallets to manage, no keys to store. The portal handles the technical side so your team stays focused.",
  },
]

const steps = [
  {
    step: "01",
    title: "Create an invoice",
    description:
      "Issue a tuition or fee invoice to a student with an amount in RWF.",
  },
  {
    step: "02",
    title: "Student pays",
    description:
      "The student pays with Bitcoin or Lightning. The amount is quoted and confirmed in seconds.",
  },
  {
    step: "03",
    title: "You see paid",
    description:
      "The payment is settled into RWF and appears in your dashboard with a receipt — instantly reconcilable.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Bitcomut</p>
              <p className="text-xs text-muted-foreground">Africa</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {[
              { href: "#features", label: "Features" },
              { href: "#how-it-works", label: "How it works" },
              { href: "#for-universities", label: "For your university" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]"
          />
          <div className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
              <Zap className="size-4 text-amber-500" aria-hidden="true" />
              Built on Bitcoin · Powered by Lightning
            </div>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Accept Bitcoin from students.{" "}
              <span className="text-primary">Settle in Francs.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              The finance dashboard for universities that lets students pay
              tuition with Bitcoin and Lightning — while your team sees
              everything in local currency, with live receipts and an audit
              trail built in.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get started
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in to the portal</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Explore the live demo — no account needed.
            </p>
          </div>
        </section>

        <section id="features" className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                A finance portal, not a crypto wallet
              </h2>
              <p className="mt-4 text-muted-foreground">
                Everything your finance office needs to run on Bitcoin
                payments, without ever touching volatile balances or wallets.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                How it works
              </h2>
              <p className="mt-4 text-muted-foreground">
                Three steps from invoice to settled, reconciled funds.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.step} className="relative rounded-xl border bg-card p-6">
                  <span className="text-3xl font-bold text-primary/30">
                    {s.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="for-universities" className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight">
              Ready to modernize your university&apos;s treasury?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Join forward-thinking institutions accepting Bitcoin and Lightning
              payments — with all the control your finance team expects.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Create your account
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4" aria-hidden="true" />
            <span>Bitcomut Africa</span>
          </div>
          <p>Bitcoin · Lightning · Settled in RWF</p>
        </div>
      </footer>
    </div>
  )
}
