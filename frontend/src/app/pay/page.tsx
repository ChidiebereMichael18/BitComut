import Link from "next/link"
import { GraduationCap, Zap } from "lucide-react"

import { PayDemo } from "@/components/pay/pay-demo"

export const metadata = {
  title: "Student pay demo · Bitcomut",
}

export default function PayPage() {
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
              <p className="text-xs text-muted-foreground">Student pay demo</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="size-4 text-amber-500" aria-hidden="true" />
            Digital Art University · RWF
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <PayDemo />
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <span>Bitcomut Africa</span>
          <span>Pay with Bitcoin · Lightning · Settled in RWF</span>
        </div>
      </footer>
    </div>
  )
}