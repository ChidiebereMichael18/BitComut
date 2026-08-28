import React, { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native"
import { useAuth } from "@/lib/auth-context"
import { getMyPayments, getMyPaymentSettlement } from "@/lib/api/student"
import { formatCurrency, formatSats, formatDate } from "@/lib/format"
import type { Payment } from "@/lib/types"

const STATUS_COLORS: Record<string, string> = {
  Paid: "#22C55E",
  Pending: "#F59E0B",
  Processing: "#3B82F6",
  Failed: "#EF4444",
  Refunded: "#8B5CF6",
  "Settlement Pending": "#F59E0B",
  Settled: "#22C55E",
}

export default function PaymentsScreen() {
  const { tenant } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [settled, setSettled] = useState<Record<string, boolean>>({})
  const [refreshing, setRefreshing] = useState(false)
  const currency = tenant?.currency || "RWF"

  const load = useCallback(async () => {
    const data = await getMyPayments()
    setPayments(data)
    const s: Record<string, boolean> = {}
    await Promise.all(
      data.map(async (p) => {
        try {
          const st = await getMyPaymentSettlement(p.id)
          s[p.id] = st.status === "Settled" || st.status === "Processing"
        } catch {
          s[p.id] = false
        }
      })
    )
    setSettled(s)
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load().catch(() => {})
    setRefreshing(false)
  }, [load])

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={payments}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F7931A" />}
      ListHeaderComponent={<Text style={styles.listTitle}>My Payments</Text>}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No payments yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.reference}>{item.reference}</Text>
              <Text style={styles.method}>{item.method}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + "22" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.amount, item.currency || currency)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sats</Text>
              <Text style={styles.detailValue}>{formatSats(item.btcSats)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
            </View>
            {settled[item.id] ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Settlement</Text>
                <Text style={[styles.detailValue, { color: "#22C55E" }]}>Settled</Text>
              </View>
            ) : null}
          </View>
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
  cardInfo: { flex: 1 },
  reference: { fontSize: 15, fontWeight: "700", color: "#F7931A" },
  method: { fontSize: 13, color: "#888", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  details: { marginTop: 12, gap: 6 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 13, color: "#666" },
  detailValue: { fontSize: 13, color: "#ccc", fontWeight: "500" },
})
