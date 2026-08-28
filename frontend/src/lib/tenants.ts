import type { Tenant } from "@/lib/types"

export { TENANT_COOKIE, DEFAULT_SLUG, slugify, LOGO_COLOR_PALETTE } from "@/lib/tenant-meta"

export const SEED_TENANTS: Tenant[] = [
  {
    id: "tn_dau",
    slug: "digital-art-university",
    name: "Digital Art University",
    shortName: "DAU",
    address: "KN 3 Rd, Kigali, Rwanda",
    email: "digitalartsuniversiti@edu.co",
    phone: "+250 788 000 001",
    website: "www.digitalartuniversity.edu",
    currency: "RWF",
    defaultCurrency: "RWF",
    settlementCurrency: "RWF",
    adminName: "Digital Art Admin",
    adminEmail: "digitalartsuniversiti@edu.co",
    country: "Rwanda",
    campusName: "Kacyiru Campus",
    studentCount: 120,
    established: "2019",
    createdAt: "2026-08-28T00:00:00Z",
    logoColor: "violet",
  },
]

let registeredTenants: Tenant[] = []

export function registerTenant(tenant: Tenant): void {
  registeredTenants = [...registeredTenants.filter((t) => t.id !== tenant.id), tenant]
}

export function getAllTenants(): Tenant[] {
  return [...SEED_TENANTS, ...registeredTenants]
}

export function getTenantBySlug(slug: string): Tenant | undefined {
  return getAllTenants().find((t) => t.slug === slug)
}

export function getTenantById(id: string): Tenant | undefined {
  return getAllTenants().find((t) => t.id === id)
}

export function getTenantSafe(slug: string): Tenant {
  return getTenantBySlug(slug) ?? SEED_TENANTS[0]
}
