export interface Currency {
  code: string
  symbol: string
  name: string
  country: string
  locale: string
  minorUnits: number
}

export const CURRENCY_CATALOG: Currency[] = [
  { code: "RWF", symbol: "RWF", name: "Rwandan Franc", country: "Rwanda", locale: "en-RW", minorUnits: 0 },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", country: "Kenya", locale: "en-KE", minorUnits: 2 },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling", country: "Uganda", locale: "en-UG", minorUnits: 0 },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", country: "Tanzania", locale: "en-TZ", minorUnits: 2 },
  { code: "NGN", symbol: "\u20A6", name: "Nigerian Naira", country: "Nigeria", locale: "en-NG", minorUnits: 2 },
  { code: "GHS", symbol: "GH\u20B5", name: "Ghanaian Cedi", country: "Ghana", locale: "en-GH", minorUnits: 2 },
  { code: "ZAR", symbol: "R", name: "South African Rand", country: "South Africa", locale: "en-ZA", minorUnits: 2 },
  { code: "USD", symbol: "$", name: "US Dollar", country: "United States", locale: "en-US", minorUnits: 2 },
  { code: "EUR", symbol: "\u20AC", name: "Euro", country: "Eurozone", locale: "en-IE", minorUnits: 2 },
  { code: "GBP", symbol: "\u00A3", name: "British Pound", country: "United Kingdom", locale: "en-GB", minorUnits: 2 },
]

export function getCurrency(code: string): Currency {
  return CURRENCY_CATALOG.find((c) => c.code === code) ?? CURRENCY_CATALOG[0]
}

export function getCurrencySymbol(code: string): string {
  return getCurrency(code).symbol
}
