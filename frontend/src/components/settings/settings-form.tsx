"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ShieldCheck, Smartphone } from "lucide-react"

import type { University } from "@/lib/types"
import { CURRENCY_OPTIONS } from "@/lib/constants"
import { getCurrency } from "@/lib/currencies"
import { useCurrency } from "@/components/currency-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

function CurrencyDisplay({ code }: { code: string }) {
  const c = getCurrency(code)
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true">{c.flag}</span>
      <span className="font-medium">{c.symbol}</span>
      <span className="text-xs text-muted-foreground">{c.country}</span>
    </span>
  )
}

interface Field {
  id: string
  label: string
  value: string
  type?: string
}

function saveNotice() {
  toast.success("Settings saved", {
    description: "Your changes have been saved.",
  })
}

export function SettingsForm({ university }: { university: University }) {
  const {
    defaultCurrency,
    settlementCurrency,
    setDefaultCurrency,
    setSettlementCurrency,
  } = useCurrency()
  const [name, setName] = useState(university.name)
  const [address, setAddress] = useState(university.address)
  const [email, setEmail] = useState(university.email)
  const [phone, setPhone] = useState(university.phone)
  const [website, setWebsite] = useState(university.website)

  const [quoteExpiration, setQuoteExpiration] = useState("15 minutes")
  const [lightningEnabled, setLightningEnabled] = useState(true)
  const [onchainEnabled, setOnchainEnabled] = useState(false)

  const [notifyPayment, setNotifyPayment] = useState(true)
  const [notifyFailed, setNotifyFailed] = useState(true)
  const [notifySettlement, setNotifySettlement] = useState(true)
  const [notifyOverdue, setNotifyOverdue] = useState(false)

  const profileFields: Field[] = [
    { id: "uni-name", label: "University name", value: name, type: "text" },
    { id: "uni-address", label: "Address", value: address, type: "text" },
    { id: "uni-email", label: "Email", value: email, type: "email" },
    { id: "uni-phone", label: "Phone", value: phone, type: "tel" },
    { id: "uni-website", label: "Website", value: website, type: "text" },
  ]

  const setters: Record<string, (v: string) => void> = {
    "uni-name": setName,
    "uni-address": setAddress,
    "uni-email": setEmail,
    "uni-phone": setPhone,
    "uni-website": setWebsite,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>University Profile</CardTitle>
          <CardDescription>
            Manage your university&apos;s information shown across the portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {profileFields.map((field) => (
              <div key={field.id} className="grid gap-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  type={field.type}
                  value={field.value}
                  onChange={(e) => setters[field.id]?.(e.target.value)}
                />
              </div>
            ))}
            <div className="grid gap-2">
              <Label htmlFor="uni-currency">Default currency</Label>
              <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                <SelectTrigger id="uni-currency" aria-label="Default currency">
                  <SelectValue>
                    {defaultCurrency && <CurrencyDisplay code={defaultCurrency} />}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
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
                Used as the default currency for new invoices and payments.
              </p>
            </div>
          </div>
          <Button onClick={saveNotice}>Save profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Configure how Bitcoin and Lightning payments are handled for your
            university.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="mb-2 block">Supported payment methods</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Lightning Network</p>
                  <p className="text-xs text-muted-foreground">
                    Fast, low-cost instant payments
                  </p>
                </div>
                <Switch
                  checked={lightningEnabled}
                  onCheckedChange={setLightningEnabled}
                  aria-label="Enable Lightning Network payments"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">On-chain Bitcoin</p>
                  <p className="text-xs text-muted-foreground">
                    Standard Bitcoin transactions
                  </p>
                </div>
                <Switch
                  checked={onchainEnabled}
                  onCheckedChange={setOnchainEnabled}
                  aria-label="Enable on-chain Bitcoin payments"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="settlement-currency">Settlement currency</Label>
              <Select
                value={settlementCurrency}
                onValueChange={setSettlementCurrency}
              >
                <SelectTrigger id="settlement-currency" aria-label="Settlement currency">
                  <SelectValue>
                    {settlementCurrency && (
                      <CurrencyDisplay code={settlementCurrency} />
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
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
                The local currency Bitcoin payments are settled into.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quote-expiration">Quote expiration</Label>
              <Select
                value={quoteExpiration}
                onValueChange={setQuoteExpiration}
              >
                <SelectTrigger id="quote-expiration" aria-label="Quote expiration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["5 minutes", "15 minutes", "30 minutes", "1 hour"].map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={saveNotice}>Save payment settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose which payment events you want to be notified about.
          </CardDescription>
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
                onCheckedChange={n.setter}
                aria-label={`Toggle ${n.label}`}
              />
            </div>
          ))}
          <Button onClick={saveNotice}>Save notification preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your account security. Backend integration planned.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="mb-2 block">Password</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="password"
                placeholder="New password"
                aria-label="New password"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                aria-label="Confirm new password"
              />
            </div>
            <Button className="mt-3" onClick={saveNotice}>
              Update password
            </Button>
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer of security to your account. Coming soon.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Set up
            </Button>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Smartphone className="size-4 text-muted-foreground" aria-hidden="true" />
              <Label>Active sessions</Label>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">This device</p>
                  <p className="text-xs text-muted-foreground">
                    Current session · Kigali, Rwanda
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Revoke
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
