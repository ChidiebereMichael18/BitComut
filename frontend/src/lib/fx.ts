/**
 * Frontend FX — display-only conversion for the dashboard.
 *
 * Rates are RWF-pivoted and mirror the backend StaticFxProvider scale
 * (RWF/KES/UGX real; the rest are representative demo rates). Amounts are
 * stored/operated in the tenant's currency (RWF); this module only converts
 * them for display when a different dashboard currency is selected.
 */

const RWF_UNITS: Record<string, number> = {
  RWF: 1,
  KES: 3.15,
  UGX: 1.32,
  TZS: 1.9,
  NGN: 3.5,
  USD: 1300,
}

/**
 * Convert a fiat amount expressed in `from` into `to`.
 * Unknown currencies are treated as RWF-equivalent (mirrors the backend's
 * static FX fallback behaviour).
 */
export function convertFiat(
  amount: number,
  from: string,
  to: string
): number {
  if (!Number.isFinite(amount)) return amount
  if (from === to) return amount
  const fromUnits = RWF_UNITS[from.toUpperCase()] ?? 1
  const toUnits = RWF_UNITS[to.toUpperCase()] ?? 1
  if (fromUnits <= 0 || toUnits <= 0) return amount
  return (amount * fromUnits) / toUnits
}

export function convertToDisplay(
  amount: number,
  from: string,
  displayCurrency: string
): number {
  return convertFiat(amount, from, displayCurrency)
}