import { cookies } from "next/headers"
import type { Tenant } from "@/lib/types"
import { TENANT_COOKIE, SEED_TENANTS, getTenantBySlug } from "@/lib/tenants"

export async function getCurrentTenant(): Promise<Tenant> {
  return getTenantBySlug(await getCurrentTenantSlug()) ?? SEED_TENANTS[0]
}

export async function getCurrentTenantSlug(): Promise<string> {
  try {
    const store = await cookies()
    return store.get(TENANT_COOKIE)?.value || SEED_TENANTS[0].slug
  } catch {
    return SEED_TENANTS[0].slug
  }
}
