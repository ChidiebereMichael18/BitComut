/**
 * Shared HTTP + WebSocket transport for the BitComut backend.
 *
 * Every call is tenant-scoped: requests carry the active tenant slug in the
 * `X-Tenant-Slug` header (the backend resolves it to the real tenant id), and
 * idempotency keys are sent on all POST requests that create resources so a
 * retried request can never double-apply.
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/+$/, "")

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function wsUrl(path = "/ws"): string {
  return `${API_BASE_URL.replace(/^http/, "ws")}${path}`
}

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /** JSON body (ignored when `formData` is provided). */
  body?: unknown
  /** Multipart body; overrides `body` and drops the JSON content-type. */
  formData?: FormData
  /** Active tenant slug — sent as the `X-Tenant-Slug` header. */
  slug?: string
  /** Idempotency key for create-style requests. */
  idempotencyKey?: string
  headers?: Record<string, string>
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const isMultipart = options.formData !== undefined
  const headers: Record<string, string> = {
    ...(isMultipart ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  }
  if (options.slug) headers["X-Tenant-Slug"] = options.slug
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey

  let res: Response
  try {
    res = await fetch(apiUrl(path), {
      method: options.method ?? "GET",
      headers,
      body: isMultipart
        ? options.formData
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
      cache: "no-store",
    })
  } catch (cause) {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Unable to reach the BitComut backend at ${API_BASE_URL}. Is it running?`,
      { cause }
    )
  }

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error
    throw new ApiError(
      res.status,
      err?.code ?? "HTTP_ERROR",
      err?.message ?? `Request failed with status ${res.status}`,
      err?.details ?? data
    )
  }

  return data as T
}