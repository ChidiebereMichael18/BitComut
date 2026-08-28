import { Ionicons } from '@/components/ui/icon';
import { useState } from 'react';
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

import { usePayment, Transaction } from '@/context/payment-context';

type Filter = 'all' | 'success' | 'pending' | 'failed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'success', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed',  label: 'Failed' },
];

export default function HistoryScreen() {
  const isDark = useColorScheme() === 'dark';
  const { transactions } = usePayment();
  const [filter, setFilter] = useState<Filter>('all');

  const BG     = isDark ? '#070C07' : '#FFFFFF';
  const SURF   = isDark ? '#0E150E' : '#F6F6F6';
  const CARD   = isDark ? '#131A13' : '#F0F0F0';
  const BORDER = isDark ? '#1C271C' : '#E4E4E4';
  const TEXT   = isDark ? '#F0F0F0' : '#0D0D0D';
  const MUTED  = isDark ? '#4E644E' : '#6B7280';
  const DIM    = isDark ? '#2A3A2A' : '#C0C8C0';
  const GREEN  = '#1B7F3B';
  const SUCCESS = isDark ? '#22C55E' : '#16A34A';
  const DANGER  = isDark ? '#EF4444' : '#DC2626';
  const WARN    = '#F59E0B';

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
        <View style={[s.header, { borderBottomColor: BORDER }]}>
          <Text style={[s.headerTitle, { color: TEXT }]}>History</Text>
          <Text style={[s.headerCount, { color: MUTED }]}>{filtered.length} records</Text>
        </View>

        {/* Filter row */}
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
                  { backgroundColor: active ? GREEN : CARD, borderColor: active ? GREEN : BORDER },
                ]}
                onPress={() => setFilter(f.key)}>
                <Text style={[s.filterLabel, { color: active ? '#FFF' : MUTED }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* List */}
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="time-outline" size={40} color={DIM} />
              <Text style={[s.emptyTitle, { color: TEXT }]}>No transactions</Text>
              <Text style={[s.emptySub, { color: MUTED }]}>
                {filter === 'all' ? 'Your payment history will appear here.' : `No ${filter} transactions.`}
              </Text>
            </View>
          ) : (
            filtered.map((tx) => (
              <View key={tx.id} style={[s.txCard, { backgroundColor: SURF, borderColor: BORDER }]}>
                {/* Top row */}
                <View style={s.txTop}>
                  <View style={[s.txIcon, { backgroundColor: CARD }]}>
                    <Ionicons
                      name={tx.method === 'lightning' ? 'flash' : 'card-outline'}
                      size={18}
                      color={MUTED}
                    />
                  </View>
                  <View style={s.txMeta}>
                    <Text style={[s.txDesc, { color: TEXT }]}>{tx.description}</Text>
                    <Text style={[s.txId, { color: DIM }]}>{tx.id}</Text>
                  </View>
                  <Text style={[s.txStatus, { color: statusColor(tx.status) }]}>
                    {statusLabel(tx.status)}
                  </Text>
                </View>

                {/* Divider */}
                <View style={[s.divider, { backgroundColor: BORDER }]} />

                {/* Detail rows */}
                <View style={s.txDetails}>
                  <Detail label="Date"           value={tx.date}                        MUTED={MUTED} TEXT={TEXT} />
                  <Detail label="Amount"         value={`₦${tx.amount.toLocaleString()}`} MUTED={MUTED} TEXT={TEXT} bold />
                  <Detail label="BTC"            value={`${tx.btcAmount} BTC`}          MUTED={MUTED} TEXT="#F59E0B" />
                  <Detail label="Method"         value={tx.method === 'lightning' ? 'Lightning Network' : 'Card'} MUTED={MUTED} TEXT={TEXT} />
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
      <Text style={[s.detailValue, { color: TEXT, fontWeight: bold ? '700' : '500' }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerCount: { fontSize: 13 },

  filterRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterLabel: { fontSize: 13, fontWeight: '600' },

  scroll: { padding: 16, gap: 10, paddingBottom: 40 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  txCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 10 },
  txTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txMeta: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '600' },
  txId: { fontSize: 11, marginTop: 2 },
  txStatus: { fontSize: 12, fontWeight: '700' },

  divider: { height: StyleSheet.hairlineWidth },

  txDetails: { gap: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 13, maxWidth: '60%', textAlign: 'right' },
});
