import AsyncStorage from "@react-native-async-storage/async-storage"

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/+$/, "")

const SESSION_COOKIE = "bitcomut_session"
const SESSION_KEY = "@bitcomut/session_token"

export const STUDENT_SESSION_COOKIE = "bitcomut_student_session"
const STUDENT_SESSION_KEY = "@bitcomut/student_session_token"

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

export async function getSessionToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export async function setSessionToken(token: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, token)
}

export async function clearSessionToken(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY)
}

export async function getStudentAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STUDENT_SESSION_KEY)
  } catch {
    return null
  }
}

export async function setStudentAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(STUDENT_SESSION_KEY, token)
}

export async function clearStudentAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(STUDENT_SESSION_KEY)
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  formData?: FormData
  slug?: string
  idempotencyKey?: string
  headers?: Record<string, string>
  student?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const isMultipart = options.formData !== undefined
  const token = options.student
    ? await getStudentAuthToken()
    : await getSessionToken()
  const cookieName = options.student ? STUDENT_SESSION_COOKIE : SESSION_COOKIE

  const headers: Record<string, string> = {
    ...(isMultipart ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  }
  if (options.slug) headers["X-Tenant-Slug"] = options.slug
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey
  if (token) headers["Cookie"] = `${cookieName}=${token}`

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
