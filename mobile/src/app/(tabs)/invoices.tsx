import React, { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/lib/auth-context"
import { getMyInvoices } from "@/lib/api/student"
import { formatCurrency } from "@/lib/format"
import type { Invoice } from "@/lib/types"

const STATUS_COLORS: Record<string, string> = {
  Unpaid: "#EF4444",
  "Partially Paid": "#F59E0B",
  Paid: "#22C55E",
  Overdue: "#DC2626",
  Cancelled: "#6B7280",
}

export default function InvoicesScreen() {
  const router = useRouter()
  const { tenant } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const currency = tenant?.currency || "RWF"

  const load = useCallback(async () => {
    const data = await getMyInvoices()
    setInvoices(data)
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load().catch(() => {})
    setRefreshing(false)
  }, [load])

  const canPay = (status: string) => status === "Unpaid" || status === "Partially Paid"

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={invoices}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F7931A" />}
      ListHeaderComponent={<Text style={styles.listTitle}>My Invoices</Text>}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No invoices yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.number}>{item.number}</Text>
              <Text style={styles.type}>{item.type}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + "22" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
            </View>
          </View>
          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          <View style={styles.footer}>
            <View>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amount}>{formatCurrency(item.amount, item.currency || currency)}</Text>
            </View>
            <View>
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={[styles.amount, { color: "#22C55E" }]}>
                {formatCurrency(item.amountPaid, item.currency || currency)}
              </Text>
            </View>
            <View>
              <Text style={styles.amountLabel}>Due</Text>
              <Text style={styles.amount}>
                {new Date(item.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </Text>
            </View>
          </View>
          {canPay(item.status) ? (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => router.push(`/pay?invoiceId=${encodeURIComponent(item.id)}` as never)}
            >
              <Text style={styles.payButtonText}>Pay with Lightning</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: "#666", fontSize: 15 },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  number: { fontSize: 15, fontWeight: "700", color: "#F7931A" },
  type: { fontSize: 14, color: "#fff", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  description: { fontSize: 13, color: "#666", marginTop: 10 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  amountLabel: { fontSize: 11, color: "#666" },
  amount: { fontSize: 14, fontWeight: "600", color: "#fff", marginTop: 2 },
  payButton: {
    marginTop: 14,
    backgroundColor: "#F7931A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  payButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
})
