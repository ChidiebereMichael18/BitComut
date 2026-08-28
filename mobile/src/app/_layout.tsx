import { useRouter, useSegments, Slot } from "expo-router"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"

function RootNavigator() {
  const { student, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === "(auth)"

    if (!student && !inAuthGroup) {
      router.replace("/login" as never)
    } else if (student && inAuthGroup) {
      router.replace("/dashboard" as never)
    }
  }, [student, loading, segments])

  return null
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <Slot />
    </AuthProvider>
  )
}
