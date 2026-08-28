import { getCurrency } from "@/lib/currencies"

export function formatCurrency(
  amount: number,
  currency: string = "RWF"
): string {
  const { symbol, minorUnits } = getCurrency(currency)
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: minorUnits,
    minimumFractionDigits: minorUnits > 0 ? minorUnits : 0,
  }).format(amount)
  return `${formatted} ${symbol}`
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatSats(sats: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    sats
  )} sats`
}

export function formatBtc(sats: number): string {
  const btc = sats / 100_000_000
  return `${btc.toFixed(8)} BTC`
}

export function formatExchangeRate(rate: number, currency: string = "RWF") {
  const symbol = getCurrency(currency).symbol
  return `1 BTC = ${new Intl.NumberFormat("en-US").format(rate)} ${symbol}`
}

export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
): string {
  return new Date(date).toLocaleDateString("en-GB", options)
}

export function formatDateTime(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  return new Date(date)
    .toLocaleString("en-GB", options)
    .replace(",", " \u00B7")
}
