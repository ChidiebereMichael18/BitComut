import type { Tenant } from "@/lib/types"
import { SEED_TENANTS } from "@/lib/tenants"

const REGISTRY_KEY = "bitcomut:tenants"

export interface StoredAccount {
  tenantId: string
  email: string
  name: string
}

const ACCOUNTS_KEY = "bitcomut:accounts"

function readRegistry(): Tenant[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Tenant[]
  } catch {
    return []
  }
}

function writeRegistry(tenants: Tenant[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(tenants))
  } catch {
    // ignore storage errors
  }
}

export function listClientTenants(): Tenant[] {
  const registered = readRegistry()
  const seen = new Set(SEED_TENANTS.map((t) => t.id))
  const extras = registered.filter((t) => !seen.has(t.id))
  return [...SEED_TENANTS, ...extras]
}

export function getClientTenantById(id: string): Tenant | undefined {
  return listClientTenants().find((t) => t.id === id)
}

export function persistTenant(tenant: Tenant): void {
  const existing = readRegistry().filter((t) => t.id !== tenant.id)
  writeRegistry([...existing, tenant])
}

export function findTenantByEmail(email: string): Tenant | undefined {
  const normalized = email.toLowerCase().trim()
  const accounts = readAccounts()
  const account = accounts.find((a) => a.email.toLowerCase() === normalized)
  if (account) return getClientTenantById(account.tenantId)
  return listClientTenants().find(
    (t) => t.adminEmail.toLowerCase() === normalized
  )
}

function readAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredAccount[]
  } catch {
    return []
  }
}

export function persistAccount(account: StoredAccount): void {
  const existing = readAccounts().filter(
    (a) => !(a.email === account.email && a.tenantId === account.tenantId)
  )
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...existing, account]))
  } catch {
    // ignore storage errors
  }
}
