import type { Tenant } from "@/lib/types"
import { apiRequest } from "@/lib/api/client"

export async function getUniversity(slug?: string): Promise<Tenant | null> {
  if (!slug) return null
  try {
    return await apiRequest<Tenant>("/api/university", { slug })
  } catch {
    return null
  }
}

export async function updateUniversity(
  slug: string,
  data: Partial<Tenant>
): Promise<Tenant> {
  return apiRequest<Tenant>("/api/university", {
    slug,
    method: "PUT",
    body: data,
  })
}
