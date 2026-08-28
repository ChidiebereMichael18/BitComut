"use client"

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"

import { formatCurrency } from "@/lib/format"
import { convertToDisplay } from "@/lib/fx"
import { DEFAULT_CURRENCY, isDisplayCurrency } from "@/lib/constants"

interface CurrencyContextType {
  defaultCurrency: string
  settlementCurrency: string
  setDefaultCurrency: (currency: string) => void
  setSettlementCurrency: (currency: string) => void
  format: (amount: number, from?: string) => string
  convert: (amount: number, from?: string) => number
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

const STORAGE_KEY = "bitcomut:currencies"

interface Stored {
  defaultCurrency?: string
  settlementCurrency?: string
}

export function CurrencyProvider({
  defaultCurrency,
  settlementCurrency,
  children,
}: Stored & { children: ReactNode }) {
  // Read persisted currencies once at mount via a lazy initializer (localStorage
  // is a browser-only side effect; SSR falls back to the props).
  const [state, setState] = useState<Stored>(() => {
    if (typeof window === "undefined") {
      return { defaultCurrency, settlementCurrency }
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { defaultCurrency, settlementCurrency }
      const parsed = JSON.parse(raw) as Stored
      return {
        defaultCurrency:
          parsed.defaultCurrency && isDisplayCurrency(parsed.defaultCurrency)
            ? parsed.defaultCurrency
            : defaultCurrency,
        settlementCurrency:
          parsed.settlementCurrency && isDisplayCurrency(parsed.settlementCurrency)
            ? parsed.settlementCurrency
            : settlementCurrency,
      }
    } catch {
      return { defaultCurrency, settlementCurrency }
    }
  })

  const persist = (next: Stored) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }

  const setDefaultCurrency = (value: string) =>
    setState((s) => {
      const next = { ...s, defaultCurrency: value }
      persist(next)
      return next
    })

  const setSettlementCurrency = (value: string) =>
    setState((s) => {
      const next = { ...s, settlementCurrency: value }
      persist(next)
      return next
    })

  return (
    <CurrencyContext.Provider
      value={{
        defaultCurrency: state.defaultCurrency ?? DEFAULT_CURRENCY,
        settlementCurrency: state.settlementCurrency ?? DEFAULT_CURRENCY,
        setDefaultCurrency,
        setSettlementCurrency,
        format: (amount: number, from: string = DEFAULT_CURRENCY) => {
          const target = state.defaultCurrency ?? DEFAULT_CURRENCY
          return formatCurrency(convertToDisplay(amount, from, target), target)
        },
        convert: (amount: number, from: string = DEFAULT_CURRENCY) =>
          convertToDisplay(
            amount,
            from,
            state.defaultCurrency ?? DEFAULT_CURRENCY
          ),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return ctx
}
