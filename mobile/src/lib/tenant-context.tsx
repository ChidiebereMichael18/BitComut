import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const TENANT_KEY = "@bitcomut/tenant_slug"
const DEFAULT_SLUG = "digital-art-university"

interface TenantContextValue {
  slug: string
  setSlug: (slug: string) => Promise<void>
}

const TenantContext = createContext<TenantContextValue>({ slug: DEFAULT_SLUG, setSlug: async () => {} })

export function useTenant(): TenantContextValue {
  return useContext(TenantContext)
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [slug, setSlugState] = useState(DEFAULT_SLUG)

  useEffect(() => {
    AsyncStorage.getItem(TENANT_KEY).then((s: string | null) => {
      if (s) setSlugState(s)
    })
  }, [])

  const setSlug = useCallback(async (s: string) => {
    await AsyncStorage.setItem(TENANT_KEY, s)
    setSlugState(s)
  }, [])

  return (
    <TenantContext.Provider value={{ slug, setSlug }}>
      {children}
    </TenantContext.Provider>
  )
}
