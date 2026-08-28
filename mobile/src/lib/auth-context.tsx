import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Student, Tenant } from "@/lib/types"
import {
  studentLogin,
  studentLogout,
  studentMe,
  studentRegister,
} from "@/lib/api/student"
import { getStoredTenantSlug, setStoredTenantSlug, clearStoredTenantSlug } from "@/lib/api/auth"
import { DEFAULT_SLUG } from "@/lib/constants"

interface SignUpInput {
  tenantSlug: string
  studentId: string
  email: string
  password: string
  name?: string
}

interface AuthState {
  student: StudentWithAccount | null
  tenant: Tenant | null
  tenantSlug: string
  loading: boolean
  signIn: (email: string, password: string, tenantSlug: string) => Promise<void>
  signUp: (input: SignUpInput) => Promise<void>
  signOut: () => Promise<void>
  setSlug: (slug: string) => void
}

interface StudentWithAccount extends Student {
  hasAccount?: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<StudentWithAccount | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [tenantSlug, setTenantSlug] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const slug = await getStoredTenantSlug()
        setTenantSlug(slug)
        const me = await studentMe()
        if (me) {
          setStudent(me.student)
          setTenant(me.tenant)
          setTenantSlug(me.tenant.slug)
        }
      } catch {}
      setLoading(false)
    })()
  }, [])

  const signIn = useCallback(
    async (email: string, password: string, slug: string) => {
      const res = await studentLogin(email, password, slug)
      setStudent(res.student)
      setTenant(res.tenant)
      setTenantSlug(res.tenant.slug)
      await setStoredTenantSlug(res.tenant.slug)
    },
    []
  )

  const signUp = useCallback(async (input: SignUpInput) => {
    const res = await studentRegister(input)
    setStudent(res.student)
    setTenant(res.tenant)
    setTenantSlug(res.tenant.slug)
    await setStoredTenantSlug(res.tenant.slug)
  }, [])

  const signOut = useCallback(async () => {
    await studentLogout()
    setStudent(null)
    setTenant(null)
    setTenantSlug("")
    await clearStoredTenantSlug()
  }, [])

  const setSlug = useCallback((slug: string) => {
    setTenantSlug(slug)
    void setStoredTenantSlug(slug)
  }, [])

  return (
    <AuthContext.Provider
      value={{ student, tenant, tenantSlug, loading, signIn, signUp, signOut, setSlug }}
    >
      {children}
    </AuthContext.Provider>
  )
}
