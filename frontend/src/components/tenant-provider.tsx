"use client"

import { createContext, useContext, type ReactNode } from "react"

import type { Tenant } from "@/lib/types"

const TenantContext = createContext<Tenant | null>(null)

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: Tenant
  children: ReactNode
}) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
}

export function useTenant(): Tenant {
  const tenant = useContext(TenantContext)
  if (!tenant) throw new Error("useTenant must be used within a TenantProvider")
  return tenant
}

export function useTenantSlug(): string {
  return useTenant().slug
}
