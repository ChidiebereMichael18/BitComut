import { GraduationCap, Zap } from "lucide-react"

import { ThemeToggle } from "@/components/layout/theme-toggle"
import { APP_NAME } from "@/lib/constants"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="hidden w-1/2 flex-col justify-between bg-card p-12 lg:flex dark:bg-black">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-6" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold">{APP_NAME}</p>
            <p className="text-sm text-muted-foreground">Powered by Bitcoin</p>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold tracking-tight">
            Let students pay with Bitcoin. You simply see that they&apos;ve paid.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Bitcoin and Lightning payments are converted and settled into your
            local currency — no crypto infrastructure required on your side.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
            <Zap className="size-4 text-amber-500" aria-hidden="true" />
            Bitcoin · Lightning Network
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          © 2026 {APP_NAME}. All rights reserved.
        </p>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
