import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/lib/auth-context"
import { DEFAULT_SLUG } from "@/lib/constants"

export default function LoginScreen() {
  const router = useRouter()
  const { signIn, tenantSlug } = useAuth()
  const [slug, setSlug] = useState(tenantSlug || DEFAULT_SLUG)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!slug || !email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }
    setLoading(true)
    try {
      await signIn(email.trim(), password, slug.trim())
      router.replace("/dashboard" as never)
    } catch (e: any) {
      Alert.alert("Login Failed", e.message || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Bitcomut</Text>
          <Text style={styles.tagline}>Student payments, powered by Bitcoin</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>University</Text>
          <TextInput
            style={styles.input}
            value={slug}
            onChangeText={setSlug}
            placeholder="university-slug"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@student.edu"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#666"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/register" as never)} style={styles.linkButton}>
            <Text style={styles.linkText}>First time? Register with your student ID</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 48 },
  logo: { fontSize: 36, fontWeight: "bold", color: "#F7931A", letterSpacing: 1 },
  tagline: { fontSize: 14, color: "#888", marginTop: 8 },
  form: { gap: 12 },
  label: { fontSize: 14, color: "#aaa", marginBottom: 4 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  button: {
    backgroundColor: "#F7931A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkButton: { alignItems: "center", marginTop: 16 },
  linkText: { color: "#F7931A", fontSize: 14 },
})
