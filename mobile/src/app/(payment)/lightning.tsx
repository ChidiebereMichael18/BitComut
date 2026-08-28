import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';

import { Ionicons } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { usePayment } from '@/context/payment-context';
import {
  getMyInvoices,
  payInvoice,
  getMyPayment,
  type StudentPayResponse,
} from '@/lib/api/student';
import { formatCurrency, formatSats, formatExchangeRate } from '@/lib/format';
import type { Invoice, Payment } from '@/lib/types';

const POLL_MS = 5000;

export default function LightningPaymentScreen() {
  const { invoiceId: paramInvoiceId } = useLocalSearchParams<{ invoiceId?: string }>();
  const { user } = useAuth();
  const { selectedInvoiceId, selectedCurrency, invoices: contextInvoices, refresh } = usePayment();

  const activeInvoiceId = paramInvoiceId || selectedInvoiceId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [pay, setPay] = useState<StudentPayResponse | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const currency = selectedCurrency || 'RWF';

  const stopPolling = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const onPaymentCreated = useCallback(
    async (res: StudentPayResponse) => {
      setPay(res);
      setPayment(res.payment);
      setCreating(false);
      setLoading(false);
      stopPolling();

      timer.current = setInterval(async () => {
        try {
          const p = await getMyPayment(res.payment.id);
          setPayment(p);
          if (p.status !== 'Pending' && p.status !== 'Processing') {
            stopPolling();
            refresh().catch(() => {});
          }
        } catch {
          // ignore transient poll error
        }
      }, POLL_MS);
    },
    [refresh, stopPolling]
  );

  const handlePay = useCallback(
    async (targetId: string) => {
      if (!targetId) return;
      setCreating(true);
      try {
        const res = await payInvoice(targetId);
        await onPaymentCreated(res);
      } catch (e: any) {
        setCreating(false);
        setLoading(false);
        Alert.alert('Payment Error', e?.message || 'Unable to create Lightning payment');
      }
    },
    [onPaymentCreated]
  );

  useEffect(() => {
    (async () => {
      try {
        let invs = contextInvoices;
        if (!invs || invs.length === 0) {
          invs = await getMyInvoices();
        }
        const found = invs.find((i) => i.id === activeInvoiceId);
        setInvoice(found ?? invs[0] ?? null);

        const targetId = found?.id || activeInvoiceId || invs[0]?.id;
        if (targetId) {
          await handlePay(targetId);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    })();

    return stopPolling;
  }, [activeInvoiceId, contextInvoices, handlePay, stopPolling]);

  const copy = async () => {
    if (!pay) return;
    await Clipboard.setStringAsync(pay.lightning.paymentRequest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const settled = payment && payment.status !== 'Pending' && payment.status !== 'Processing';

  const BG     = '#FFFFFF';
  const SURF   = '#F8FAF8';
  const BORDER = '#E5E8E5';
  const TEXT   = '#1A2E1A';
  const MUTED  = '#6B7A6B';
  const GREEN  = '#386635';
  const BTC    = '#F59E0B';
  const SUCCESS = '#22C55E';

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={BTC} size="large" />
        <Text style={s.centerText}>Preparing Lightning payment...</Text>
      </View>
    );
  }

  if (!invoice || (!pay && !creating)) {
    return (
      <View style={s.center}>
        <Ionicons name="alert-circle-outline" size={48} color={MUTED} />
        <Text style={s.centerText}>We couldn't find this invoice or create payment.</Text>
        <Pressable style={s.smallButton} onPress={() => router.back()}>
          <Text style={s.smallButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <SafeAreaView style={s.safe}>
        {/* Top Header */}
        <View style={[s.header, { borderBottomColor: BORDER }]}>
          <Pressable style={s.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={MUTED} />
          </Pressable>
          <Text style={[s.headerTitle, { color: TEXT }]}>Lightning Invoice</Text>
          <View style={s.closeBtn} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Invoice Summary Card */}
          <View style={[s.invoiceCard, { backgroundColor: SURF, borderColor: BORDER }]}>
            <View style={s.invoiceTop}>
              <Text style={[s.invoiceNumber, { color: GREEN }]}>{invoice.number}</Text>
              <View style={s.typeBadge}>
                <Text style={s.typeBadgeTxt}>{invoice.type}</Text>
              </View>
            </View>
            {invoice.description ? (
              <Text style={[s.invoiceDesc, { color: MUTED }]}>{invoice.description}</Text>
            ) : null}
            <Text style={[s.invoiceAmount, { color: TEXT }]}>
              {formatCurrency(invoice.amount - invoice.amountPaid, invoice.currency || currency)}
            </Text>
          </View>

          {/* Lightning Payment QR Card */}
          {creating ? (
            <View style={s.centerBox}>
              <ActivityIndicator color={BTC} size="large" />
              <Text style={s.centerText}>Contacting Lightning network...</Text>
            </View>
          ) : pay && payment ? (
            <View style={[s.lightningCard, { backgroundColor: SURF, borderColor: BORDER }]}>
              <Text style={[s.cardTitle, { color: TEXT }]}>
                {settled ? 'Payment Complete 🎉' : 'Scan to Pay with Lightning'}
              </Text>

              {/* QR Code Container */}
              <View style={s.qrWrap}>
                <QRCode
                  value={pay.lightning.paymentRequest}
                  size={200}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
              </View>

              {/* Sats & Rate Display */}
              <Text style={[s.sats, { color: BTC }]}>
                {formatSats(payment.btcSats || pay.lightning.sats)}
              </Text>
              <Text style={[s.rate, { color: MUTED }]}>
                {formatExchangeRate(pay.lightning.rate, currency)}
              </Text>

              {/* Status Indicator */}
              {!settled ? (
                <View style={s.waitingRow}>
                  <ActivityIndicator color={BTC} size="small" />
                  <Text style={[s.waitingText, { color: BTC }]}>
                    {payment.status === 'Processing'
                      ? 'Processing payment...'
                      : 'Waiting for Lightning payment...'}
                  </Text>
                </View>
              ) : (
                <Text style={[s.settledText, { color: SUCCESS }]}>
                  Your payment is confirmed. You can check it under History.
                </Text>
              )}

              {/* Copy Invoice Button */}
              <Pressable
                style={({ pressed }) => [
                  s.copyButton,
                  { borderColor: BORDER, opacity: pressed ? 0.75 : 1 },
                ]}
                onPress={copy}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={TEXT} />
                <Text style={[s.copyButtonText, { color: TEXT }]}>
                  {copied ? 'Payment request copied!' : 'Copy payment request'}
                </Text>
              </Pressable>

              {/* Done CTA */}
              {settled && (
                <Pressable
                  style={({ pressed }) => [
                    s.doneButton,
                    { backgroundColor: GREEN, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => router.replace('/(main)')}>
                  <Text style={s.doneButtonText}>Done</Text>
                </Pressable>
              )}
            </View>
          ) : null}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },

  content: { padding: 20, gap: 16, paddingBottom: 40 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  centerBox: { padding: 40, alignItems: 'center', gap: 12 },
  centerText: { fontSize: 14, color: '#6B7A6B', textAlign: 'center' },

  smallButton: {
    backgroundColor: '#386635',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  smallButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  invoiceCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 8,
  },
  invoiceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumber: { fontSize: 15, fontWeight: '800' },
  typeBadge: {
    backgroundColor: '#EAEFEA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeTxt: { fontSize: 12, fontWeight: '700', color: '#1A2E1A' },
  invoiceDesc: { fontSize: 13 },
  invoiceAmount: { fontSize: 26, fontWeight: '800', marginTop: 4 },

  lightningCard: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800' },

  qrWrap: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E8E5',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  sats: { fontSize: 24, fontWeight: '800' },
  rate: { fontSize: 12, fontWeight: '500' },

  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  waitingText: { fontSize: 13, fontWeight: '700' },

  settledText: { fontSize: 14, fontWeight: '700', marginTop: 8, textAlign: 'center' },

  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  copyButtonText: { fontSize: 14, fontWeight: '700' },

  doneButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  doneButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
