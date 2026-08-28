import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { usePayment, Transaction } from '@/context/payment-context';
import { getCountryConfig } from '@/constants/universities';

type Filter = 'all' | 'success' | 'pending' | 'failed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'success', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed',  label: 'Failed' },
];

export default function HistoryScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuth();
  const { transactions } = usePayment();
  const [filter, setFilter] = useState<Filter>('all');

  const countryConfig  = getCountryConfig(user?.country);
  const currencySymbol = countryConfig.currencySymbol;

  const BG       = '#F4F6F4';
  const CARD_BG  = '#FFFFFF';
  const CHIP_BG  = '#EAEFEA';
  const BORDER   = '#E5E8E5';
  const TEXT     = '#1A2E1A';
  const MUTED    = '#6B7A6B';
  const GREEN    = '#386635';
  const SUCCESS  = '#2B7A28';
  const DANGER   = '#DC2626';
  const WARN     = '#F59E0B';

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((t) => t.status === filter);

  const statusColor = (s: Transaction['status']) =>
    s === 'success' ? SUCCESS : s === 'failed' ? DANGER : WARN;

  const statusLabel = (s: Transaction['status']) =>
    s === 'success' ? 'Paid' : s === 'failed' ? 'Failed' : 'Pending';

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={BG} />
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: TEXT }]}>Transaction History</Text>
          <Text style={[s.headerCount, { color: MUTED }]}>{filtered.length} records</Text>
        </View>

        {/* Filter Chips */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={[
                    s.filterChip,
                    { backgroundColor: active ? GREEN : CHIP_BG, borderColor: active ? GREEN : BORDER },
                  ]}
                  onPress={() => setFilter(f.key)}>
                  <Text style={[s.filterLabel, { color: active ? '#FFFFFF' : TEXT }]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* List of Transactions */}
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={44} color={MUTED} />
              <Text style={[s.emptyTitle, { color: TEXT }]}>No transactions found</Text>
              <Text style={[s.emptySub, { color: MUTED }]}>
                {filter === 'all' ? 'Your payment history will appear here.' : `No ${filter} transactions.`}
              </Text>
            </View>
          ) : (
            filtered.map((tx) => (
              <View key={tx.id} style={[s.txCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                {/* Top header row */}
                <View style={s.txTop}>
                  <View style={[s.txIcon, { backgroundColor: CHIP_BG }]}>
                    <Ionicons
                      name={tx.method === 'lightning' ? 'flash' : 'card-outline'}
                      size={20}
                      color={GREEN}
                    />
                  </View>
                  <View style={s.txMeta}>
                    <Text style={[s.txDesc, { color: TEXT }]}>{tx.description}</Text>
                    <Text style={[s.txId, { color: MUTED }]}>{tx.id}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: CHIP_BG }]}>
                    <Text style={[s.txStatus, { color: statusColor(tx.status) }]}>
                      {statusLabel(tx.status)}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={[s.divider, { backgroundColor: BORDER }]} />

                {/* Detail rows */}
                <View style={s.txDetails}>
                  <Detail label="Date"       value={tx.date} MUTED={MUTED} TEXT={TEXT} />
                  <Detail label="Amount"     value={`${currencySymbol}${tx.amount.toLocaleString()}`} MUTED={MUTED} TEXT={TEXT} bold />
                  <Detail label="BTC Amount" value={`${tx.btcAmount} BTC`} MUTED={MUTED} TEXT="#F59E0B" />
                  <Detail label="Method"     value={tx.method === 'lightning' ? 'Lightning Network ⚡' : 'Bank Card'} MUTED={MUTED} TEXT={TEXT} />
                  {tx.txHash && <Detail label="Tx Hash" value={tx.txHash} MUTED={MUTED} TEXT={MUTED} />}
                </View>
              </View>
            ))
          )}
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

function Detail({ label, value, MUTED, TEXT, bold }: any) {
  return (
    <View style={s.detailRow}>
      <Text style={[s.detailLabel, { color: MUTED }]}>{label}</Text>
      <Text style={[s.detailValue, { color: TEXT, fontWeight: bold ? '800' : '500' }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerCount: {
    fontSize: 13,
    fontWeight: '600',
  },

  filterRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110, // space for floating tab bar
    gap: 12,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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

  txCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  txTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMeta: {
    flex: 1,
    gap: 2,
  },
  txDesc: {
    fontSize: 15,
    fontWeight: '700',
  },
  txId: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  txStatus: {
    fontSize: 12,
    fontWeight: '800',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
  },

  txDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    maxWidth: '65%',
    textAlign: 'right',
  },
});
