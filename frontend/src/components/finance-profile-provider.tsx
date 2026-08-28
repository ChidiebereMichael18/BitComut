"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface FinanceProfile {
  name: string
  email: string
  role: string
}

interface FinanceProfileContextValue extends FinanceProfile {
  initials: string
  update: (patch: Partial<FinanceProfile>) => void
  reset: () => void
}

const FinanceProfileContext = createContext<FinanceProfileContextValue | null>(null)

const STORAGE_KEY = "bitcomut:finance-profile"

export const DEFAULT_FINANCE_PROFILE: FinanceProfile = {
  name: "Finance Team",
  email: "finance@uonbi.ac.ke",
  role: "Administrator",
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function readStored(): FinanceProfile | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<FinanceProfile>
    return {
      name: parsed.name ?? DEFAULT_FINANCE_PROFILE.name,
      email: parsed.email ?? DEFAULT_FINANCE_PROFILE.email,
      role: parsed.role ?? DEFAULT_FINANCE_PROFILE.role,
    }
  } catch {
    return null
  }
}

export function FinanceProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<FinanceProfile>(
    () => readStored() ?? DEFAULT_FINANCE_PROFILE
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch {
      // ignore storage errors
    }
  }, [profile])

  const update = (patch: Partial<FinanceProfile>) =>
    setProfile((p) => ({ ...p, ...patch }))

  const reset = () => setProfile(DEFAULT_FINANCE_PROFILE)

  return (
    <FinanceProfileContext.Provider
      value={{
        ...profile,
        initials: initialsOf(profile.name),
        update,
        reset,
      }}
    >
      {children}
    </FinanceProfileContext.Provider>
  )
}

export function useFinanceProfile(): FinanceProfileContextValue {
  const ctx = useContext(FinanceProfileContext)
  if (!ctx) {
    throw new Error("useFinanceProfile must be used within a FinanceProfileProvider")
  }
  return ctx
}
