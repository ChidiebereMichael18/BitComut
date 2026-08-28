import type { User, Tenant } from "@/lib/types"
import { apiRequest, setSessionToken, clearSessionToken, getSessionToken } from "@/lib/api/client"
import { DEFAULT_SLUG } from "@/lib/constants"
import AsyncStorage from "@react-native-async-storage/async-storage"

const TENANT_KEY = "@bitcomut/tenant_slug"

export async function getStoredTenantSlug(): Promise<string> {
  try {
    const slug = await AsyncStorage.getItem(TENANT_KEY)
    if (slug) return slug
  } catch {}
  return DEFAULT_SLUG
}

export async function setStoredTenantSlug(slug: string): Promise<void> {
  await AsyncStorage.setItem(TENANT_KEY, slug)
}

export async function clearStoredTenantSlug(): Promise<void> {
  await AsyncStorage.removeItem(TENANT_KEY)
}

interface AuthResponse {
  user: User
  tenant: Tenant
  token: string
}

interface MeResponse {
  user: User
  tenant: Tenant
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  })
  await setSessionToken(res.token)
  await setStoredTenantSlug(res.tenant.slug)
  return res
}

export async function register(input: {
  tenant: { name: string; shortName: string; email: string; currency?: string; country?: string }
  email: string
  password: string
  displayName: string
}): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: input,
  })
  await setSessionToken(res.token)
  await setStoredTenantSlug(res.tenant.slug)
  return res
}

export async function getMe(): Promise<MeResponse | null> {
  const token = await getSessionToken()
  if (!token) return null
  try {
    return await apiRequest<MeResponse>("/api/auth/me")
  } catch {
    await clearSessionToken()
    return null
  }
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<{ success: boolean }>("/api/auth/logout", { method: "POST" })
  } catch {}
  await clearSessionToken()
  await clearStoredTenantSlug()
}
