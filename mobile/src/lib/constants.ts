export const APP_NAME = "Bitcomut Africa"
export const APP_TAGLINE = "University payments, powered by Bitcoin"

import { CURRENCY_CATALOG } from "@/lib/currencies"

export const INVOICE_TYPES = [
  "Tuition",
  "Registration",
  "Application Fee",
  "Examination Fee",
  "Accommodation",
  "Library Fee",
] as const

export const CURRENCIES = CURRENCY_CATALOG.map((c) => c.code)

export const DEFAULT_CURRENCY = "RWF"

export const DEFAULT_SLUG = "digital-art-university"

export const SESSION_COOKIE = "bitcomut_session"
export const TENANT_COOKIE = "bitcomut:tenant"
