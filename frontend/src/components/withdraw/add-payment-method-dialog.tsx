"use client"

import { useState } from "react"
import { Landmark, Loader2, Plus, Smartphone, Wallet } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addPaymentMethod } from "@/lib/services/withdrawals"
import type { PaymentAccountType } from "@/lib/types"
import { cn } from "@/lib/utils"

const MOBILE_MONEY_PROVIDERS = ["MTN", "Airtel", "Tigo", "Vodacom", "M-Pesa", "Safaricom"]

export function AddPaymentMethodDialog({
  slug,
  currency,
  onAdded,
}: {
  slug: string
  currency: string
  onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<PaymentAccountType>("bank")
  const [label, setLabel] = useState("")
  const [holderName, setHolderName] = useState("")
  const [number, setNumber] = useState("")
  const [provider, setProvider] = useState(MOBILE_MONEY_PROVIDERS[0])

  const reset = () => {
    setType("bank")
    setLabel("")
    setHolderName("")
    setNumber("")
    setProvider(MOBILE_MONEY_PROVIDERS[0])
  }

  const numberValid = type === "mobile_money"
    ? /^[0-9]{9,15}$/.test(number.trim().replace(/[\s-]/g, ""))
    : number.trim().length >= 4
  const usable = label.trim().length > 0 && holderName.trim().length > 0 && numberValid
  const numberPlaceholder = type === "mobile_money" ? "e.g. 0788 123 456" : "e.g. 0001 4821"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!usable) return
    setLoading(true)
    try {
      await addPaymentMethod(slug, {
        type,
        label: type === "mobile_money" ? `${provider} Mobile Money` : label.trim(),
        holderName: holderName.trim(),
        number: number.trim().replace(/[\s-]/g, ""),
        provider: type === "mobile_money" ? provider : undefined,
        currency,
        isDefault: false,
      })
      toast.success("Payment method added", {
        description: `Ready to withdraw to ${type === "mobile_money" ? `${provider} Mobile Money` : label.trim()}.`,
      })
      setOpen(false)
      reset()
      onAdded()
    } catch {
      toast.error("Unable to add payment method", {
        description: "Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const typeButton = (
    value: PaymentAccountType,
    icon: typeof Landmark,
    title: string,
    subtitle: string
  ) => {
    const Icon = icon
    const active = type === value
    return (
      <button
        type="button"
        onClick={() => setType(value)}
        className={cn(
          "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
          active
            ? "border-primary bg-primary/5 ring-1 ring-primary"
            : "border-input hover:bg-accent"
        )}
      >
        <span className="flex items-center gap-2 font-medium">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          {title}
        </span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Add payment method
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" aria-hidden="true" />
            Add a payment method
          </DialogTitle>
          <DialogDescription>
            Set up a bank account or mobile money destination for withdrawals.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {typeButton("bank", Landmark, "Bank account", "Transfer to a bank")}
            {typeButton("mobile_money", Smartphone, "Mobile money", "Send to a mobile number")}
          </div>

          {type === "mobile_money" ? (
            <div className="grid gap-2">
              <Label htmlFor="pm-provider">Provider</Label>
              <select
                id="pm-provider"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {MOBILE_MONEY_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="pm-label">Bank name</Label>
              <Input
                id="pm-label"
                placeholder="e.g. Bank of Kigali"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoFocus={type === "bank"}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="pm-holder">Account holder name</Label>
            <Input
              id="pm-holder"
              placeholder="e.g. Kigali Intl University"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pm-number">
              {type === "mobile_money" ? "Mobile number" : "Account number"}
            </Label>
            <Input
              id="pm-number"
              placeholder={numberPlaceholder}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="gap-2" disabled={loading || !usable}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden="true" />
                  Add payment method
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
