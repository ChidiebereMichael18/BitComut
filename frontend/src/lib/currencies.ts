export interface Currency {
  code: string
  symbol: string
  name: string
  country: string
  flag: string
  locale: string
  minorUnits: number
}

/**
 * Currency catalog — single source of truth for all supported currencies.
 * Each entry includes its symbol, country, flag, locale and number of minor
 * (decimal) units used when formatting amounts.
 */
export const CURRENCY_CATALOG: Currency[] = [
  { code: "RWF", symbol: "RWF", name: "Rwandan Franc", country: "Rwanda", flag: "🇷🇼", locale: "en-RW", minorUnits: 0 },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", country: "Kenya", flag: "🇰🇪", locale: "en-KE", minorUnits: 2 },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling", country: "Uganda", flag: "🇺🇬", locale: "en-UG", minorUnits: 0 },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", country: "Tanzania", flag: "🇹🇿", locale: "en-TZ", minorUnits: 2 },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", country: "Nigeria", flag: "🇳🇬", locale: "en-NG", minorUnits: 2 },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi", country: "Ghana", flag: "🇬🇭", locale: "en-GH", minorUnits: 2 },
  { code: "ZAR", symbol: "R", name: "South African Rand", country: "South Africa", flag: "🇿🇦", locale: "en-ZA", minorUnits: 2 },
  { code: "ETB", symbol: "Br", name: "Ethiopian Birr", country: "Ethiopia", flag: "🇪🇹", locale: "en-ET", minorUnits: 2 },
  { code: "BIF", symbol: "FBu", name: "Burundian Franc", country: "Burundi", flag: "🇧🇮", locale: "en-BI", minorUnits: 0 },
  { code: "CDF", symbol: "FC", name: "Congolese Franc", country: "DR Congo", flag: "🇨🇩", locale: "en-CD", minorUnits: 2 },
  { code: "MWK", symbol: "MK", name: "Malawian Kwacha", country: "Malawi", flag: "🇲🇼", locale: "en-MW", minorUnits: 2 },
  { code: "MZN", symbol: "MT", name: "Mozambican Metical", country: "Mozambique", flag: "🇲🇿", locale: "en-MZ", minorUnits: 2 },
  { code: "ZMW", symbol: "ZK", name: "Zambian Kwacha", country: "Zambia", flag: "🇿🇲", locale: "en-ZM", minorUnits: 2 },
  { code: "MAD", symbol: "DH", name: "Moroccan Dirham", country: "Morocco", flag: "🇲🇦", locale: "ar-MA", minorUnits: 2 },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", country: "Egypt", flag: "🇪🇬", locale: "ar-EG", minorUnits: 2 },
  { code: "XOF", symbol: "CFA", name: "West African CFA Franc", country: "West Africa", flag: "🌍", locale: "fr-CI", minorUnits: 0 },
  { code: "XAF", symbol: "FCFA", name: "Central African CFA Franc", country: "Central Africa", flag: "🌍", locale: "fr-CM", minorUnits: 0 },
  { code: "USD", symbol: "$", name: "US Dollar", country: "United States", flag: "🇺🇸", locale: "en-US", minorUnits: 2 },
  { code: "EUR", symbol: "€", name: "Euro", country: "Eurozone", flag: "🇪🇺", locale: "en-IE", minorUnits: 2 },
  { code: "GBP", symbol: "£", name: "British Pound", country: "United Kingdom", flag: "🇬🇧", locale: "en-GB", minorUnits: 2 },
]

export function getCurrency(code: string): Currency {
  return CURRENCY_CATALOG.find((c) => c.code === code) ?? CURRENCY_CATALOG[0]
}

export function getCurrencySymbol(code: string): string {
  return getCurrency(code).symbol
}
