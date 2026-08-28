import React, { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/lib/auth-context"
import { getMyBalance, getMyInvoices, type StudentBalance } from "@/lib/api/student"
import { formatCurrency } from "@/lib/format"
import type { Invoice } from "@/lib/types"

export default function DashboardScreen() {
  const router = useRouter()
  const { student, tenant } = useAuth()
  const [balance, setBalance] = useState<StudentBalance | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const currency = tenant?.currency || "RWF"

  const load = useCallback(async () => {
    const [b, i] = await Promise.all([getMyBalance(), getMyInvoices()])
    setBalance(b)
    setInvoices(i)
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load().catch(() => {})
    setRefreshing(false)
  }, [load])

  const unpaid = invoices
    .filter((i) => i.status === "Unpaid" || i.status === "Overdue")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F7931A" />}
    >
      <Text style={styles.greeting}>
        {student ? `Hi, ${student.name.split(" ")[0] || "there"}` : "Hi there"}
      </Text>
      <Text style={styles.subGreeting}>{tenant?.name || "University"}</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Outstanding Balance</Text>
        <Text style={styles.balanceValue} numberOfLines={1}>
          {balance ? formatCurrency(balance.outstanding, currency) : "—"}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Total Invoiced</Text>
            <Text style={styles.balanceItemValue}>
              {balance ? formatCurrency(balance.totalInvoiced, currency) : "—"}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Total Paid</Text>
            <Text style={[styles.balanceItemValue, { color: "#22C55E" }]}>
              {balance ? formatCurrency(balance.totalPaid, currency) : "—"}
            </Text>
          </View>
        </View>
        {balance ? (
          <View style={styles.balanceStats}>
            <Text style={styles.statText}>
              {balance.unpaidInvoices} unpaid invoice{balance.unpaidInvoices !== 1 ? "s" : ""}
            </Text>
            {balance.dueSoonInvoices > 0 ? (
              <Text style={[styles.statText, { color: "#F59E0B" }]}>
                {balance.dueSoonInvoices} due soon
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Payments</Text>
        {unpaid.length === 0 ? (
          <Text style={styles.emptyText}>You're all caught up</Text>
        ) : (
          unpaid.slice(0, 3).map((inv) => (
            <TouchableOpacity
              key={inv.id}
              style={styles.invoiceCard}
              onPress={() => router.push(`/pay?invoiceId=${encodeURIComponent(inv.id)}` as never)}
            >
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceType}>{inv.type}</Text>
                <Text style={styles.invoiceDesc} numberOfLines={1}>
                  {inv.description || inv.number}
                </Text>
              </View>
              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceAmount}>
                  {formatCurrency(inv.amount, inv.currency)}
                </Text>
                <Text style={styles.invoiceDue}>due {new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {unpaid.length > 0 ? (
        <TouchableOpacity
          style={styles.payAllButton}
          onPress={() => router.push("/invoices" as never)}
        >
          <Text style={styles.payAllText}>View all invoices →</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 100 },
  greeting: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  subGreeting: { fontSize: 14, color: "#888", marginTop: 4, marginBottom: 20 },
  balanceCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F7931A33",
  },
  balanceLabel: { fontSize: 13, color: "#888" },
  balanceValue: { fontSize: 34, fontWeight: "800", color: "#F7931A", marginTop: 4 },
  balanceRow: { flexDirection: "row", gap: 24, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#222" },
  balanceItem: { flex: 1 },
  balanceItemLabel: { fontSize: 12, color: "#666" },
  balanceItemValue: { fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 2 },
  balanceStats: { flexDirection: "row", gap: 12, marginTop: 16 },
  statText: { fontSize: 13, color: "#22C55E", fontWeight: "600" },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 12 },
  emptyText: { color: "#666", fontSize: 14 },
  invoiceCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#222",
  },
  invoiceInfo: { flex: 1, marginRight: 12 },
  invoiceType: { fontSize: 15, fontWeight: "700", color: "#fff" },
  invoiceDesc: { fontSize: 13, color: "#666", marginTop: 2 },
  invoiceRight: { alignItems: "flex-end" },
  invoiceAmount: { fontSize: 15, fontWeight: "700", color: "#F7931A" },
  invoiceDue: { fontSize: 12, color: "#888", marginTop: 2 },
  payAllButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  payAllText: { color: "#F7931A", fontSize: 15, fontWeight: "600" },
})
