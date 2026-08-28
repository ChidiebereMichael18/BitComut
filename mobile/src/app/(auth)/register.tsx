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

export default function RegisterScreen() {
  const router = useRouter()
  const { signUp, tenantSlug } = useAuth()
  const [slug, setSlug] = useState(tenantSlug || DEFAULT_SLUG)
  const [studentId, setStudentId] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!slug || !studentId || !email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters")
      return
    }
    setLoading(true)
    try {
      await signUp({
        tenantSlug: slug.trim(),
        studentId: studentId.trim(),
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      })
      router.replace("/dashboard" as never)
    } catch (e: any) {
      Alert.alert("Registration Failed", e.message || "Try again")
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
          <Text style={styles.tagline}>Link your student account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>University</Text>
          <TextInput
            style={styles.input}
            value={slug}
            onChangeText={setSlug}
            placeholder="university-slug"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Your Details</Text>
          <TextInput
            style={styles.input}
            value={studentId}
            onChangeText={setStudentId}
            placeholder="Student record number (e.g. STU-001)"
            placeholderTextColor="#666"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name (your record)"
            placeholderTextColor="#666"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Your email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password (8+ characters)"
            placeholderTextColor="#666"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.linkButton}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: "bold", color: "#F7931A", letterSpacing: 1 },
  tagline: { fontSize: 14, color: "#888", marginTop: 8 },
  form: { gap: 10 },
  sectionTitle: {
    fontSize: 13,
    color: "#F7931A",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
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
  linkButton: { alignItems: "center", marginTop: 16, marginBottom: 32 },
  linkText: { color: "#F7931A", fontSize: 14 },
})
