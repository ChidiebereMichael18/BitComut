"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ApiError, apiUrl } from "@/lib/api/client"
import { SESSION_COOKIE, TENANT_COOKIE } from "@/lib/tenant-meta"
const SESSION_MAX_AGE = 12 * 60 * 60

export interface AuthUser {
  id: string
  tenantId: string
  email: string
  displayName: string
  role: string
  createdAt?: string
}

export interface AuthResult {
  user: AuthUser
  tenant: {
    id: string
    slug: string
    name: string
  }
}

export interface RegisterInput {
  tenant: {
    name: string
    shortName: string
    email: string
    phone?: string
    website?: string
    address?: string
    currency?: string
    country?: string
    campusName?: string
    established?: string
  }
  email: string
  password: string
  displayName: string
}

async function authFetch(path: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const data = (await res.json().catch(() => null)) as
    | Record<string, unknown>
    | null
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } })?.error
    throw new ApiError(
      res.status,
      err?.code ?? "HTTP_ERROR",
      err?.message ?? `Request failed with status ${res.status}`,
      data
    )
  }
  return (data ?? {}) as Record<string, unknown>
}

function asTenant(t: unknown): AuthResult["tenant"] {
  const row = (t ?? {}) as Record<string, unknown>
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
  }
}

async function applySession(data: Record<string, unknown>): Promise<AuthResult> {
  const token = String(data.token ?? "")
  const store = await cookies()
  if (token) {
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    })
  }
  const tenant = asTenant(data.tenant)
  if (tenant.slug) {
    store.set(TENANT_COOKIE, tenant.slug, {
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  }
  revalidatePath("/", "layout")
  return { user: data.user as AuthUser, tenant }
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const data = await authFetch("/api/auth/login", { email, password })
  return applySession(data)
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const data = await authFetch("/api/auth/register", input)
  return applySession(data)
}

export async function logout(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    try {
      await fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE}=${token}` },
        cache: "no-store",
      })
    } catch {
      // backend unreachable — still clear local session below
    }
  }
  store.delete(SESSION_COOKIE)
  store.delete(TENANT_COOKIE)
  revalidatePath("/", "layout")
}

/** Server-only session check: redirects to /login when not signed in. */
export async function requireSession(): Promise<void> {
  const store = await cookies()
  if (!store.get(SESSION_COOKIE)?.value) {
    redirect("/login")
  }
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}