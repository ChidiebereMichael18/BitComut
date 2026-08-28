import React, { useState, useCallback } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Ionicons } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { usePayment } from '@/context/payment-context';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Invoice, Payment } from '@/lib/types';

type Tab = 'invoices' | 'payments';
type Filter = 'all' | 'Unpaid' | 'Paid' | 'Overdue';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Unpaid:          { bg: '#FEE2E2', text: '#EF4444' },
  'Partially Paid':{ bg: '#FEF3C7', text: '#F59E0B' },
  Paid:            { bg: '#DCFCE7', text: '#22C55E' },
  Settled:         { bg: '#DCFCE7', text: '#22C55E' },
  Overdue:         { bg: '#FEE2E2', text: '#DC2626' },
  Cancelled:       { bg: '#F3F4F6', text: '#6B7280' },
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const { invoices, transactions, refresh, setPaymentDetails } = usePayment();

  const [tab, setTab] = useState<Tab>('invoices');
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const BG       = '#F4F6F4';
  const CARD_BG  = '#FFFFFF';
  const CHIP_BG  = '#EAEFEA';
  const BORDER   = '#E5E8E5';
  const TEXT     = '#1A2E1A';
  const MUTED    = '#6B7A6B';
  const GREEN    = '#386635';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh().catch(() => {});
    setRefreshing(false);
  }, [refresh]);

  const filteredInvoices = invoices.filter((i) => {
    if (filter === 'all') return true;
    return i.status === filter;
  });

  const handlePayInvoice = (inv: Invoice) => {
    const remaining = inv.amount - inv.amountPaid;
    setPaymentDetails(
      inv.id,
      user?.university || 'Digital Art University (DAU)',
      user?.studentId || 'DAU-2024-8841',
      remaining > 0 ? remaining : inv.amount,
      inv.currency || 'RWF'
    );
    router.push('/(payment)/method');
  };

  const canPay = (status: string) => status === 'Unpaid' || status === 'Partially Paid' || status === 'Overdue';

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: TEXT }]}>Invoices & History</Text>
        </View>

        {/* Segmented Tab Switcher */}
        <View style={s.tabContainer}>
          <Pressable
            style={[s.tabBtn, tab === 'invoices' && s.tabBtnActive]}
            onPress={() => setTab('invoices')}>
            <Text style={[s.tabTxt, tab === 'invoices' ? s.tabTxtActive : { color: MUTED }]}>
              Invoices ({invoices.length})
            </Text>
          </Pressable>
          <Pressable
            style={[s.tabBtn, tab === 'payments' && s.tabBtnActive]}
            onPress={() => setTab('payments')}>
            <Text style={[s.tabTxt, tab === 'payments' ? s.tabTxtActive : { color: MUTED }]}>
              Payments ({transactions.length})
            </Text>
          </Pressable>
        </View>

        {/* Filter Chips (Invoices view) */}
        {tab === 'invoices' && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filterRow}>
              {(['all', 'Unpaid', 'Paid', 'Overdue'] as Filter[]).map((f) => {
                const active = filter === f;
                return (
                  <Pressable
                    key={f}
                    style={[
                      s.filterChip,
                      { backgroundColor: active ? GREEN : CHIP_BG, borderColor: active ? GREEN : BORDER },
                    ]}
                    onPress={() => setFilter(f)}>
                    <Text style={[s.filterLabel, { color: active ? '#FFFFFF' : TEXT }]}>
                      {f === 'all' ? 'All Invoices' : f}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Main Content List */}
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} colors={[GREEN]} />
          }>

          {tab === 'invoices' ? (
            /* ── INVOICES TAB ── */
            filteredInvoices.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="receipt-outline" size={44} color={MUTED} />
                <Text style={[s.emptyTitle, { color: TEXT }]}>No Invoices Found</Text>
                <Text style={[s.emptySub, { color: MUTED }]}>
                  {filter === 'all' ? 'Your university invoices will appear here.' : `No ${filter} invoices.`}
                </Text>
              </View>
            ) : (
              filteredInvoices.map((item) => {
                const colorScheme = STATUS_COLORS[item.status] || { bg: CHIP_BG, text: TEXT };
                return (
                  <View key={item.id} style={[s.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                    <View style={s.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.number}>{item.number}</Text>
                        <Text style={[s.type, { color: TEXT }]}>{item.type}</Text>
                      </View>
                      <View style={[s.badge, { backgroundColor: colorScheme.bg }]}>
                        <Text style={[s.badgeText, { color: colorScheme.text }]}>{item.status}</Text>
                      </View>
                    </View>

                    {item.description ? (
                      <Text style={[s.description, { color: MUTED }]}>{item.description}</Text>
                    ) : null}

                    <View style={[s.footer, { borderTopColor: BORDER }]}>
                      <View>
                        <Text style={[s.amountLabel, { color: MUTED }]}>Total Amount</Text>
                        <Text style={[s.amount, { color: TEXT }]}>
                          {formatCurrency(item.amount, item.currency || 'RWF')}
                        </Text>
                      </View>

                      <View>
                        <Text style={[s.amountLabel, { color: MUTED }]}>Amount Paid</Text>
                        <Text style={[s.amount, { color: '#22C55E' }]}>
                          {formatCurrency(item.amountPaid, item.currency || 'RWF')}
                        </Text>
                      </View>

                      <View>
                        <Text style={[s.amountLabel, { color: MUTED }]}>Due Date</Text>
                        <Text style={[s.amount, { color: TEXT }]}>
                          {item.dueDate ? formatDate(item.dueDate) : '—'}
                        </Text>
                      </View>
                    </View>

                    {canPay(item.status) && (
                      <Pressable
                        style={({ pressed }) => [s.payButton, { opacity: pressed ? 0.85 : 1 }]}
                        onPress={() => handlePayInvoice(item)}>
                        <Ionicons name="flash" size={16} color="#FFFFFF" />
                        <Text style={s.payButtonText}>Pay with Lightning ⚡</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })
            )
          ) : (
            /* ── PAYMENTS TAB ── */
            transactions.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="card-outline" size={44} color={MUTED} />
                <Text style={[s.emptyTitle, { color: TEXT }]}>No Payment Records</Text>
                <Text style={[s.emptySub, { color: MUTED }]}>
                  Completed transactions will be displayed here.
                </Text>
              </View>
            ) : (
              transactions.map((tx: Payment) => (
                <View key={tx.id} style={[s.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                  <View style={s.cardHeader}>
                    <View style={s.txIconBox}>
                      <Ionicons name="flash" size={20} color={GREEN} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.type, { color: TEXT }]}>{tx.invoiceId || 'School Fees Payment'}</Text>
                      <Text style={[s.description, { color: MUTED }]}>{tx.reference || tx.id}</Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[s.badgeText, { color: '#22C55E' }]}>{tx.status}</Text>
                    </View>
                  </View>

                  <View style={[s.footer, { borderTopColor: BORDER }]}>
                    <View>
                      <Text style={[s.amountLabel, { color: MUTED }]}>Date</Text>
                      <Text style={[s.amount, { color: TEXT }]}>{tx.date}</Text>
                    </View>
                    <View>
                      <Text style={[s.amountLabel, { color: MUTED }]}>Amount</Text>
                      <Text style={[s.amount, { color: TEXT }]}>
                        {tx.currency} {tx.amount.toLocaleString()}
                      </Text>
                    </View>
                    <View>
                      <Text style={[s.amountLabel, { color: MUTED }]}>Lightning Sats</Text>
                      <Text style={[s.amount, { color: '#F59E0B' }]}>
                        {tx.btcSats ? `${tx.btcSats.toLocaleString()} sats` : '⚡'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )
          )}

        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#EAEFEA',
    borderRadius: 14,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabTxt: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabTxtActive: {
    color: '#386635',
  },

  filterRow: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
    gap: 12,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
  },

  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EAEFEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  number: {
    fontSize: 14,
    fontWeight: '800',
    color: '#386635',
  },
  type: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  payButton: {
    marginTop: 8,
    backgroundColor: '#386635',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
