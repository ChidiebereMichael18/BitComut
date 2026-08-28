import type { University } from "@/lib/types"
import { getTenantBySlug } from "@/lib/tenants"
import { getCurrentTenant } from "@/lib/tenant-server"
import { delay } from "@/lib/services/delay"

export async function getUniversity(slug?: string): Promise<University> {
  await delay(200)
  const tenant = slug ? getTenantBySlug(slug) : await getCurrentTenant()
  const t = tenant ?? (await getCurrentTenant())
  return {
    name: t.name,
    shortName: t.shortName,
    address: t.address,
    email: t.email,
    phone: t.phone,
    website: t.website,
    currency: t.currency,
    defaultCurrency: t.defaultCurrency,
    settlementCurrency: t.settlementCurrency,
  }
}
