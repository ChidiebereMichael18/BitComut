"use client"

import { useState } from "react"
import { Bell, ChevronDown, LogOut, Settings, User, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import type { University } from "@/lib/types"
import { MobileNav } from "@/components/layout/mobile-nav"
import { GlobalSearch } from "@/components/layout/global-search"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useRealTime } from "@/components/real-time-provider"
import { useFinanceProfile } from "@/components/finance-profile-provider"
import { useCurrency } from "@/components/currency-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { clearTenantCookie } from "@/app/actions/tenant"
import { clearClientTenant } from "@/lib/tenant-context"
import { getSoundAlertsEnabled, setSoundAlertsEnabled } from "@/lib/sounds"
import { DISPLAY_CURRENCY_OPTIONS, DEFAULT_CURRENCY, isDisplayCurrency } from "@/lib/constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const TITLE_MAP: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/payments": "Payments",
  "/dashboard/students": "Students",
  "/dashboard/invoices": "Invoices",
  "/dashboard/settlements": "Settlements",
  "/dashboard/withdraw": "Withdraw",
  "/dashboard/receipts": "Receipts",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/profile": "Profile",
  "/dashboard/settings/preferences": "Preferences",
}

const DETAIL_MAP: Record<string, string> = {
  payments: "Payment",
  students: "Student",
  invoices: "Invoice",
  settlements: "Settlement",
  receipts: "Receipt",
}

function currentTitle(pathname: string): string {
  if (pathname === "/dashboard/invoices/new") return "Create Invoice"
  const exact = TITLE_MAP[pathname]
  if (exact) return exact
  const segments = pathname.split("/").filter(Boolean)
  const base = DETAIL_MAP[segments[segments.length - 2]]
  if (base) return `${base} Details`
  return "Overview"
}

interface HeaderProps {
  university: University
  accent?: string
}

export function Header({ university, accent }: HeaderProps) {
  const { events, clear } = useRealTime()
  const pathname = usePathname()
  const router = useRouter()
  const title = currentTitle(pathname)
  const profile = useFinanceProfile()
  const { format, defaultCurrency, setDefaultCurrency } = useCurrency()
  const [soundAlerts, setSoundAlerts] = useState(getSoundAlertsEnabled())
  const currencyValue = isDisplayCurrency(defaultCurrency)
    ? defaultCurrency
    : DEFAULT_CURRENCY

  const handleSignOut = async () => {
    await clearTenantCookie()
    clearClientTenant()
    toast.success("Signed out successfully", {
      description: `You have been signed out of ${university.shortName}.`,
    })
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <MobileNav university={university} accent={accent} />

      <div className="hidden items-center gap-2 lg:flex">
        {pathname === "/dashboard/invoices/new" ? (
          <>
            <span className="text-sm font-medium text-muted-foreground">Finance</span>
            <span className="text-muted-foreground">/</span>
            <Link href="/dashboard/invoices" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Invoices
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-sm font-semibold">Create</h1>
          </>
        ) : title ? (
          <>
            <span className="text-sm font-medium text-muted-foreground">
              Finance
            </span>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-sm font-semibold">{title}</h1>
          </>
        ) : null}
      </div>

      <div className="ml-2 hidden max-w-xs flex-1 sm:block">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Select
          value={currencyValue}
          onValueChange={setDefaultCurrency}
        >
          <SelectTrigger
            className="h-9 w-auto gap-1.5 border-transparent px-2 text-sm font-medium focus:bg-accent"
            aria-label="Dashboard currency"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {DISPLAY_CURRENCY_OPTIONS.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{c.flag}</span>
                  <span>{c.code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-5" aria-hidden="true" />
              {events.length > 0 && (
                <span className="absolute top-1 right-1 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {events.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-0.5 text-xs"
                  onClick={clear}
                >
                  Clear all
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {events.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No new notifications.
              </div>
            ) : (
              events.slice(0, 5).map((event) => (
                <DropdownMenuItem
                  key={`${event.paymentId}-${event.type}`}
                  className="flex items-start gap-3 py-2"
                >
                  <span className="mt-0.5 shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                    New
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.studentName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.invoiceDescription}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {format(event.amount, event.currency)}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator className="mb-1" />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                const next = !soundAlerts
                setSoundAlerts(next)
                setSoundAlertsEnabled(next)
              }}
              className="gap-2"
            >
              {soundAlerts ? (
                <Volume2 className="size-4" aria-hidden="true" />
              ) : (
                <VolumeX className="size-4" aria-hidden="true" />
              )}
              Sound alerts
              <span className="ml-auto text-xs text-muted-foreground">
                {soundAlerts ? "On" : "Off"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 px-2 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{profile.initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {university.shortName}
              </span>
              <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{profile.name}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {profile.email}
              </p>
              <p className="mt-1 text-xs font-normal text-muted-foreground">
                {profile.role}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/dashboard/settings/profile")}>
              <User className="size-4" aria-hidden="true" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/dashboard/settings/preferences")}>
              <Settings className="size-4" aria-hidden="true" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
