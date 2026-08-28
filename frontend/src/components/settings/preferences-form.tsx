"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"

import {
  DISPLAY_CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  isDisplayCurrency,
} from "@/lib/constants"
import { getCurrency } from "@/lib/currencies"
import { useCurrency } from "@/components/currency-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "sw", label: "Kiswahili" },
  { code: "rw", label: "Kinyarwanda" },
]

function notify(message: string) {
  toast.success(message)
}

export function PreferencesForm() {
  const { theme, setTheme } = useTheme()
  const { defaultCurrency, setDefaultCurrency } = useCurrency()

  const displayCurrency = isDisplayCurrency(defaultCurrency)
    ? defaultCurrency
    : DEFAULT_CURRENCY

  const [language, setLanguage] = useState("en")
  const [notifyPayment, setNotifyPayment] = useState(true)
  const [notifyFailed, setNotifyFailed] = useState(true)
  const [notifySettlement, setNotifySettlement] = useState(true)
  const [notifyOverdue, setNotifyOverdue] = useState(false)

  const themeLabel = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how the portal looks and behaves.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Theme mode</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["light", "Light"],
                  ["dark", "Dark"],
                  ["system", "System"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTheme(value)
                    notify(`${label} theme selected`)
                  }}
                  className={
                    theme === value
                      ? "rounded-lg border-2 border-primary bg-accent px-3 py-2 text-sm font-medium"
                      : "rounded-lg border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Current: {themeLabel}
            </p>
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="pref-language">Language</Label>
            <Select value={language} onValueChange={(v) => { setLanguage(v); notify("Language updated") }}>
              <SelectTrigger id="pref-language" className="w-full sm:w-56" aria-label="Language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

<Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Set the display currency for the entire dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="pref-currency">Display currency</Label>
            <Select value={displayCurrency} onValueChange={(v) => { setDefaultCurrency(v); notify("Display currency updated") }}>
              <SelectTrigger id="pref-currency" className="w-full sm:w-64" aria-label="Display currency">
                <SelectValue>
                  {displayCurrency && (
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">{getCurrency(displayCurrency).flag}</span>
                      <span>{getCurrency(displayCurrency).code}</span>
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">{c.flag}</span>
                      <span>{c.code}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.symbol} · {c.country}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Every amount across the dashboard is converted to this currency.
              Invoices and payments are always recorded in your operating currency.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose which events you receive notifications for.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              label: "New payment received",
              desc: "Get notified when a student makes a payment.",
              checked: notifyPayment,
              setter: setNotifyPayment,
            },
            {
              label: "Payment failed",
              desc: "Get notified when a payment fails.",
              checked: notifyFailed,
              setter: setNotifyFailed,
            },
            {
              label: "Settlement completed",
              desc: "Get notified when a settlement completes.",
              checked: notifySettlement,
              setter: setNotifySettlement,
            },
            {
              label: "Invoice overdue",
              desc: "Get notified when an invoice becomes overdue.",
              checked: notifyOverdue,
              setter: setNotifyOverdue,
            },
          ].map((n) => (
            <div
              key={n.label}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch
                checked={n.checked}
                onCheckedChange={(v) => { n.setter(v); notify(`${n.label} ${v ? "enabled" : "disabled"}`) }}
                aria-label={`Toggle ${n.label}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
