import React from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { usePayment } from '@/context/payment-context';
import { getCountryConfig } from '@/constants/universities';

export default function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuth();
  const { pendingFees, transactions } = usePayment();

  // Dynamic Country Currency & Live BTC Rate Sync
  const countryConfig = getCountryConfig(user?.country);
  const btcRate       = countryConfig.btcRate;
  const currencySymbol = countryConfig.currencySymbol;
  const currencyCode   = countryConfig.currency;

  // ── Palette ──────────────────────────────────────────────────────────
  const BG      = isDark ? '#070C07' : '#FFFFFF';
  const SURF    = isDark ? '#0E150E' : '#F6F6F6';
  const CARD    = isDark ? '#131A13' : '#F0F0F0';
  const BORDER  = isDark ? '#1C271C' : '#E4E4E4';
  const TEXT    = isDark ? '#F0F0F0' : '#0D0D0D';
  const MUTED   = isDark ? '#4E644E' : '#6B7280';
  const DIM     = isDark ? '#2A3A2A' : '#C0C8C0';
  const GREEN   = '#1B7F3B';               // primary CTA
  const SUCCESS = isDark ? '#22C55E' : '#16A34A'; // confirmed status text
  const DANGER  = isDark ? '#EF4444' : '#DC2626';
  const WARN    = '#F59E0B';
  const BTC     = '#F59E0B';
  // ─────────────────────────────────────────────────────────────────────

  const totalDue     = pendingFees.reduce((s, f) => s + f.amount, 0);
  const btcEquiv     = (totalDue / btcRate).toFixed(5);
  const firstName    = user?.name?.split(' ')[0] ?? 'Student';
  const recentTxns   = transactions.slice(0, 4);

  const statusColor = (s: string) =>
    s === 'success' ? SUCCESS : s === 'failed' ? DANGER : WARN;
  const statusLabel = (s: string) =>
    s === 'success' ? 'Paid' : s === 'failed' ? 'Failed' : 'Pending';

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={BG} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}>

          {/* ── Header ── */}
          <View style={s.header}>
            <View>
              <Text style={[s.greeting, { color: MUTED }]}>
                {countryConfig.flag} {user?.country || 'Rwanda (Kigali)'}
              </Text>
              <Text style={[s.name, { color: TEXT }]}>Hello, {firstName}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(main)/profile')}
              style={[s.avatar, { backgroundColor: GREEN }]}>
              <Text style={s.avatarText}>{user?.avatarInitials ?? 'BC'}</Text>
            </Pressable>
          </View>

          {/* ── Country-Synced BTC Live Rate Pill ── */}
          <View style={[s.ratePill, { backgroundColor: CARD, borderColor: BORDER }]}>
            <View style={[s.rateDot, { backgroundColor: BTC }]} />
            <Text style={[s.rateLabel, { color: MUTED }]}>BTC / {currencyCode}</Text>
            <Text style={[s.rateValue, { color: TEXT }]}>{countryConfig.rateFormatted}</Text>
            <View style={s.rateLivePill}>
              <Text style={[s.rateLiveText, { color: SUCCESS }]}>LIVE</Text>
            </View>
          </View>

          {/* ── Outstanding fees card ── */}
          <View style={[s.feesCard, { backgroundColor: SURF, borderColor: BORDER }]}>
            <Text style={[s.feesLabel, { color: MUTED }]}>OUTSTANDING FEES ({currencyCode})</Text>
            <Text style={[s.feesAmount, { color: TEXT }]}>
              {currencySymbol}{totalDue.toLocaleString()}
            </Text>
            <Text style={[s.feesBtc, { color: MUTED }]}>≈ {btcEquiv} BTC</Text>

            <View style={[s.feesDivider, { backgroundColor: BORDER }]} />

            {pendingFees.map((fee, i) => (
              <View key={i} style={s.feeRow}>
                <Text style={[s.feeRowLabel, { color: MUTED }]}>{fee.label}</Text>
                <Text style={[s.feeRowAmt, { color: TEXT }]}>
                  {currencySymbol}{fee.amount.toLocaleString()}
                </Text>
              </View>
            ))}

            <Pressable
              style={({ pressed }) => [s.payBtn, { backgroundColor: GREEN, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => router.push('/(main)/pay')}>
              <Ionicons name="arrow-up-circle" size={18} color="#FFF" />
              <Text style={s.payBtnText}>Pay Fees Now</Text>
            </Pressable>
          </View>

          {/* ── Recent transactions ── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={[s.sectionTitle, { color: TEXT }]}>Recent Activity</Text>
              <Pressable onPress={() => router.push('/(main)/history')}>
                <Text style={[s.seeAll, { color: MUTED }]}>See all</Text>
              </Pressable>
            </View>

            <View style={[s.txList, { backgroundColor: SURF, borderColor: BORDER }]}>
              {recentTxns.map((tx, i) => (
                <View
                  key={tx.id}
                  style={[
                    s.txRow,
                    { borderBottomColor: BORDER },
                    i === recentTxns.length - 1 && s.txRowLast,
                  ]}>
                  {/* Icon */}
                  <View style={[s.txIcon, { backgroundColor: CARD }]}>
                    <Ionicons
                      name={tx.method === 'lightning' ? 'flash' : 'card-outline'}
                      size={18}
                      color={MUTED}
                    />
                  </View>
                  {/* Details */}
                  <View style={s.txInfo}>
                    <Text style={[s.txDesc, { color: TEXT }]} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text style={[s.txDate, { color: DIM }]}>{tx.date}</Text>
                  </View>
                  {/* Amount + status */}
                  <View style={s.txRight}>
                    <Text style={[s.txAmt, { color: TEXT }]}>
                      {currencySymbol}{tx.amount.toLocaleString()}
                    </Text>
                    <Text style={[s.txStatus, { color: statusColor(tx.status) }]}>
                      {statusLabel(tx.status)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  safe:    { flex: 1 },
  scroll:  { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },

  // Header
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  greeting:    { fontSize: 13, fontWeight: '600' },
  name:        { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  avatar:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 14, color: '#FFF', fontWeight: '700' },

  // Rate pill
  ratePill:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  rateDot:     { width: 7, height: 7, borderRadius: 3.5 },
  rateLabel:   { fontSize: 13, fontWeight: '600', flex: 1 },
  rateValue:   { fontSize: 14, fontWeight: '700' },
  rateLivePill:{ },
  rateLiveText:{ fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  // Fees card
  feesCard:    { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 8 },
  feesLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  feesAmount:  { fontSize: 36, fontWeight: '800', letterSpacing: -1, lineHeight: 42 },
  feesBtc:     { fontSize: 13, fontWeight: '500' },
  feesDivider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  feeRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  feeRowLabel: { fontSize: 13 },
  feeRowAmt:   { fontSize: 13, fontWeight: '600' },
  payBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 50, borderRadius: 12, marginTop: 8 },
  payBtnText:  { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Section
  section:     { gap: 10 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:{ fontSize: 16, fontWeight: '700' },
  seeAll:      { fontSize: 13, fontWeight: '500' },

  // Transaction list
  txList:      { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  txRow:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  txRowLast:   { borderBottomWidth: 0 },
  txIcon:      { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txInfo:      { flex: 1, gap: 2 },
  txDesc:      { fontSize: 14, fontWeight: '600' },
  txDate:      { fontSize: 12 },
  txRight:     { alignItems: 'flex-end', gap: 2 },
  txAmt:       { fontSize: 14, fontWeight: '700' },
  txStatus:    { fontSize: 11, fontWeight: '600' },
});
