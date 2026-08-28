import React from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/lib/auth-context"

export default function ProfileScreen() {
  const router = useRouter()
  const { student, tenant, signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut()
          router.replace("/login" as never)
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(student?.name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{student?.name || "Student"}</Text>
        <Text style={styles.recordNumber}>{student?.id}</Text>
        <Text style={styles.uniName}>{tenant?.name}</Text>
      </View>

      <View style={styles.details}>
        <Row label="Program" value={student?.program || "—"} />
        <Row label="Year" value={student?.year || "—"} />
        <Row label="Email" value={student?.email || "—"} />
        <Row label="Status" value={student?.status || "—"} />
        {student?.phone ? <Row label="Phone" value={student.phone} /> : null}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  card: { alignItems: "center", backgroundColor: "#1a1a1a", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#222" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F7931A22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: "800", color: "#F7931A" },
  name: { fontSize: 20, fontWeight: "700", color: "#fff" },
  recordNumber: { fontSize: 14, color: "#F7931A", marginTop: 4 },
  uniName: { fontSize: 13, color: "#888", marginTop: 8 },
  details: {
    marginTop: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    gap: 14,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { fontSize: 14, color: "#666" },
  rowValue: { fontSize: 14, color: "#fff", fontWeight: "600", flexShrink: 1, textAlign: "right" },
  signOutButton: {
    marginTop: 28,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  signOutText: { color: "#EF4444", fontSize: 16, fontWeight: "700" },
})
