import React, { useEffect, useState, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useAuth } from "@/lib/auth-context"
import {
  getMyInvoices,
  payInvoice,
  getMyPayment,
  type StudentPayResponse,
} from "@/lib/api/student"
import { formatCurrency, formatSats, formatExchangeRate } from "@/lib/format"
import * as Clipboard from "expo-clipboard"
import QRCode from "react-native-qrcode-svg"
import type { Invoice, Payment } from "@/lib/types"

const POLL_MS = 5000

export default function PayScreen() {
  const router = useRouter()
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>()
  const { tenant } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [pay, setPay] = useState<StudentPayResponse | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const currency = tenant?.currency || "RWF"

  const stopPolling = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  const created = async (res: StudentPayResponse) => {
    setPay(res)
    setPayment(res.payment)
    setCreating(false)
    setLoading(false)
    stopPolling()
    timer.current = setInterval(async () => {
      try {
        const p = await getMyPayment(res.payment.id)
        setPayment(p)
        if (p.status !== "Pending" && p.status !== "Processing") {
          stopPolling()
        }
      } catch {}
    }, POLL_MS)
  }

  const handlePay = async () => {
    if (!invoiceId) return
    setCreating(true)
    try {
      const res = await payInvoice(invoiceId)
      await created(res)
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCreating(false);
      setLoading(false);
      Alert.alert("Payment Error", e.message || "Unable to create payment");
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const invoices = await getMyInvoices()
        const found = invoices.find((i) => i.id === invoiceId)
        setInvoice(found ?? null)
        if (found) await handlePay()
        else setLoading(false)
      } catch {
        setLoading(false)
      }
    })()
    return stopPolling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copy = async () => {
    if (!pay) return
    await Clipboard.setStringAsync(pay.lightning.paymentRequest)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const settled = payment && payment.status !== "Pending" && payment.status !== "Processing"

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#F7931A" size="large" />
        <Text style={styles.centerText}>Preparing payment...</Text>
      </View>
    )
  }

  if (!invoice || !pay || !payment) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>We couldn't find this invoice.</Text>
        <TouchableOpacity style={styles.smallButton} onPress={() => router.back()}>
          <Text style={styles.smallButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pay Invoice</Text>

      <View style={styles.invoiceCard}>
        <Text style={styles.invoiceNumber}>{invoice.number}</Text>
        <Text style={styles.invoiceType}>{invoice.type}</Text>
        {invoice.description ? <Text style={styles.invoiceDesc}>{invoice.description}</Text> : null}
        <Text style={styles.invoiceAmount}>
          {formatCurrency(invoice.amount, invoice.currency || currency)}
        </Text>
      </View>

      {!pay && !creating ? (
        <TouchableOpacity style={styles.payButton} onPress={handlePay}>
          <Text style={styles.payButtonText}>Create Lightning Payment</Text>
        </TouchableOpacity>
      ) : null}

      {creating ? (
        <View style={styles.center}>
          <ActivityIndicator color="#F7931A" size="large" />
          <Text style={styles.centerText}>Contacting Lightning network...</Text>
        </View>
      ) : (
        <View style={styles.lightningCard}>
          <Text style={styles.cardTitle}>
            {settled ? "Payment Complete" : "Scan to Pay with Lightning"}
          </Text>

          <View style={styles.qrWrap}>
            <QRCode
              value={pay.lightning.paymentRequest}
              size={220}
              color="#000"
              backgroundColor="#fff"
            />
          </View>

          <Text style={styles.sats}>{formatSats(payment.btcSats || pay.lightning.sats)}</Text>
          <Text style={styles.rate}>{formatExchangeRate(pay.lightning.rate, currency)}</Text>

          {!settled ? (
            <View style={styles.waitingRow}>
              <ActivityIndicator color="#F7931A" size="small" />
              <Text style={styles.waitingText}>
                {payment.status === "Processing" ? "Processing payment..." : "Waiting for payment..."}
              </Text>
            </View>
          ) : (
            <Text style={styles.settledText}>
              Your payment is confirmed. You can check it under Payments.
            </Text>
          )}

          <TouchableOpacity style={styles.copyButton} onPress={copy}>
            <Text style={styles.copyButtonText}>
              {copied ? "Payment request copied!" : "Copy payment request"}
            </Text>
          </TouchableOpacity>

          {settled ? (
            <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a", padding: 24 },
  centerText: { color: "#888", fontSize: 15, marginTop: 12, textAlign: "center" },
  title: { fontSize: 26, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  invoiceCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 20,
  },
  invoiceNumber: { fontSize: 15, fontWeight: "700", color: "#F7931A" },
  invoiceType: { fontSize: 17, fontWeight: "700", color: "#fff", marginTop: 6 },
  invoiceDesc: { fontSize: 13, color: "#888", marginTop: 4 },
  invoiceAmount: { fontSize: 28, fontWeight: "800", color: "#fff", marginTop: 12 },
  payButton: {
    backgroundColor: "#F7931A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  payButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  lightningCard: {
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F7931A33",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 20 },
  qrWrap: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  sats: { fontSize: 26, fontWeight: "800", color: "#F7931A", marginTop: 16 },
  rate: { fontSize: 13, color: "#888", marginTop: 4 },
  waitingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20 },
  waitingText: { color: "#F59E0B", fontSize: 14 },
  settledText: { color: "#22C55E", fontSize: 14, marginTop: 20, textAlign: "center" },
  copyButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    alignSelf: "stretch",
    alignItems: "center",
  },
  copyButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  doneButton: {
    marginTop: 12,
    backgroundColor: "#F7931A",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    alignSelf: "stretch",
  },
  doneButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  smallButton: {
    marginTop: 20,
    backgroundColor: "#F7931A",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  smallButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
})
