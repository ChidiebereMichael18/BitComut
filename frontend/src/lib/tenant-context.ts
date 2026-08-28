import { TENANT_COOKIE, DEFAULT_SLUG } from "@/lib/tenant-meta"

const TENANT_LOCAL = TENANT_COOKIE

export { DEFAULT_SLUG }

/**
 * Resolve the current tenant slug from the current execution context.
 * On the server, reads the session cookie. In the browser, reads
 * localStorage (which keeps the server/client view in sync after login).
 */
export function getTenantSlug(): string {
  if (typeof window !== "undefined") {
    try {
      const local = window.localStorage.getItem(TENANT_LOCAL)
      if (local) return local
    } catch {
      // ignore storage errors
    }
    return DEFAULT_SLUG
  }
  return DEFAULT_SLUG
}

/** Client-only: persist the active tenant, e.g. after login/onboarding. */
export function setClientTenant(slug: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(TENANT_LOCAL, slug)
  } catch {
    // ignore storage errors
  }
}

/** Client-only: clear the active tenant, e.g. on sign out. */
export function clearClientTenant(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(TENANT_LOCAL)
  } catch {
    // ignore storage errors
  }
}
