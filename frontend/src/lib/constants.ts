export const APP_NAME = "Bitcomut Africa"
export const APP_TAGLINE = "University payments, powered by Bitcoin"

import { CURRENCY_CATALOG, getCurrency } from "@/lib/currencies"

export const INVOICE_TYPES = [
  "Tuition",
  "Registration",
  "Application Fee",
  "Examination Fee",
  "Accommodation",
  "Library Fee",
] as const

export const CURRENCIES = CURRENCY_CATALOG.map((c) => c.code)

export const CURRENCY_OPTIONS = CURRENCY_CATALOG

/** Top 5 most-used + USD — the choices offered for the dashboard display currency. */
export const DISPLAY_CURRENCIES = ["RWF", "KES", "UGX", "TZS", "NGN", "USD"] as const

export const DISPLAY_CURRENCY_OPTIONS = DISPLAY_CURRENCIES.map((code) =>
  getCurrency(code)
)

export function isDisplayCurrency(code: string): boolean {
  return (DISPLAY_CURRENCIES as readonly string[]).includes(code)
}

export const DEFAULT_CURRENCY = "RWF"
