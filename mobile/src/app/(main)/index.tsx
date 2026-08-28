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

const BRAND_GREEN = '#386635'; // Exact Muted Forest Green from user reference screenshot

export default function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuth();
  const { pendingFees, transactions } = usePayment();

  // Dynamic Country Currency & Live BTC Rate Sync
  const countryConfig  = getCountryConfig(user?.country);
  const btcRate        = countryConfig.btcRate;
  const currencySymbol = countryConfig.currencySymbol;
  const currencyCode   = countryConfig.currency;

  // Theme Colors (Default White & Green theme)
  const BG       = isDark ? '#070C07' : '#F4F6F4';
  const SHEET_BG = isDark ? '#121C12' : '#FFFFFF';
  const STAT_BG  = isDark ? '#182418' : '#F4F8F4';
  const BORDER   = isDark ? '#233323' : '#E5E8E5';
  const TEXT     = isDark ? '#F0F0F0' : '#1A2E1A';
  const MUTED    = isDark ? '#7E967E' : '#6B7A6B';
  const SUCCESS  = isDark ? '#22C55E' : '#2B7A28';
  const DANGER   = isDark ? '#EF4444' : '#DC2626';
  const WARN     = '#F59E0B';

  const totalDue   = pendingFees.reduce((s, f) => s + f.amount, 0);
  const btcEquiv   = (totalDue / btcRate).toFixed(5);
  const userName   = user?.name?.toUpperCase() ?? 'STUDENT';
  const recentTxns = transactions.slice(0, 4);

  const statusColor = (s: string) =>
    s === 'success' ? SUCCESS : s === 'failed' ? DANGER : WARN;
  const statusLabel = (s: string) =>
    s === 'success' ? 'Paid' : s === 'failed' ? 'Failed' : 'Pending';

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_GREEN} />

      {/* ── Top Header Banner (Forest Green #386635) ── */}
      <View style={s.topHeader}>
        <SafeAreaView edges={['top']} style={s.headerSafeArea}>
          <View style={s.headerContent}>
            {/* User Avatar + Name */}
            <Pressable onPress={() => router.push('/(main)/profile')} style={s.userInfoRow}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarTxt}>{user?.avatarInitials ?? 'BC'}</Text>
              </View>
              <View>
                <Text style={s.greetingTxt}>Good Morning</Text>
                <Text style={s.userNameTxt}>{userName}</Text>
                <Text style={s.countryTagTxt}>{countryConfig.flag} {countryConfig.name}</Text>
              </View>
            </Pressable>

            {/* Bell Notification Button */}
            <Pressable style={s.bellBtn}>
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              <View style={s.bellDot} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Curved White Container Sheet ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}>

        <View style={[s.curvedSheet, { backgroundColor: SHEET_BG, borderColor: BORDER }]}>

          {/* 1. Featured Forest Green Outstanding Balance Card */}
          <Pressable
            style={({ pressed }) => [s.balanceCard, { opacity: pressed ? 0.92 : 1 }]}
            onPress={() => router.push('/(main)/pay')}>
            <View style={s.balanceCardTop}>
              <View>
                <Text style={s.balanceCardLabel}>Total Outstanding Fees</Text>
                <Text style={s.balanceCardAmt}>
                  {currencySymbol}{totalDue.toLocaleString()}
                </Text>
              </View>
              <View style={s.arrowCircle}>
                <Ionicons name="arrow-forward" size={20} color={BRAND_GREEN} />
              </View>
            </View>
            <Text style={s.balanceCardSub}>
              ≈ {btcEquiv} BTC · tap to pay ⚡
            </Text>
          </Pressable>

          {/* 2. Three Equal Grid Stats Row (Matching User Screenshot) */}
          <View style={s.statsRow}>
            {/* Stat 1 */}
            <View style={[s.statCard, { backgroundColor: STAT_BG, borderColor: BORDER }]}>
              <Ionicons name="school-outline" size={22} color={BRAND_GREEN} />
              <Text style={[s.statVal, { color: TEXT }]}>{pendingFees.length}</Text>
              <Text style={[s.statTitle, { color: TEXT }]}>Fees</Text>
              <Text style={[s.statSub, { color: MUTED }]}>Pending</Text>
            </View>

            {/* Stat 2 */}
            <View style={[s.statCard, { backgroundColor: STAT_BG, borderColor: BORDER }]}>
              <Ionicons name="logo-bitcoin" size={22} color="#F59E0B" />
              <Text style={[s.statVal, { color: TEXT }]}>{countryConfig.rateFormatted.replace(currencySymbol, '')}</Text>
              <Text style={[s.statTitle, { color: TEXT }]}>BTC Rate</Text>
              <Text style={[s.statSub, { color: MUTED }]}>{currencyCode}</Text>
            </View>

            {/* Stat 3 */}
            <View style={[s.statCard, { backgroundColor: STAT_BG, borderColor: BORDER }]}>
              <Ionicons name="time-outline" size={22} color={BRAND_GREEN} />
              <Text style={[s.statVal, { color: TEXT }]}>0.01s</Text>
              <Text style={[s.statTitle, { color: TEXT }]}>Speed</Text>
              <Text style={[s.statSub, { color: MUTED }]}>Lightning</Text>
            </View>
          </View>

          {/* 3. Shortcuts Section */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: TEXT }]}>Shortcuts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.shortcutsScroll}>
              <Pressable
                style={[s.shortcutBtn, { backgroundColor: STAT_BG, borderColor: BORDER }]}
                onPress={() => router.push('/(main)/pay')}>
                <Ionicons name="arrow-up-circle" size={18} color={BRAND_GREEN} />
                <Text style={[s.shortcutTxt, { color: TEXT }]}>Pay Fees</Text>
              </Pressable>

              <Pressable
                style={[s.shortcutBtn, { backgroundColor: STAT_BG, borderColor: BORDER }]}
                onPress={() => router.push('/(payment)/lightning')}>
                <Ionicons name="flash" size={18} color="#F59E0B" />
                <Text style={[s.shortcutTxt, { color: TEXT }]}>Lightning</Text>
              </Pressable>

              <Pressable
                style={[s.shortcutBtn, { backgroundColor: STAT_BG, borderColor: BORDER }]}
                onPress={() => router.push('/(main)/history')}>
                <Ionicons name="receipt-outline" size={18} color={BRAND_GREEN} />
                <Text style={[s.shortcutTxt, { color: TEXT }]}>Receipts</Text>
              </Pressable>

              <Pressable
                style={[s.shortcutBtn, { backgroundColor: STAT_BG, borderColor: BORDER }]}
                onPress={() => router.push('/(main)/profile')}>
                <Ionicons name="person-outline" size={18} color={BRAND_GREEN} />
                <Text style={[s.shortcutTxt, { color: TEXT }]}>Profile</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* 4. Recent Activity Section */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={[s.sectionTitle, { color: TEXT }]}>Recent Activity</Text>
              <Pressable onPress={() => router.push('/(main)/history')}>
                <Text style={[s.seeAllTxt, { color: BRAND_GREEN }]}>See all</Text>
              </Pressable>
            </View>

            <View style={[s.txListCard, { backgroundColor: STAT_BG, borderColor: BORDER }]}>
              {recentTxns.map((tx, i) => (
                <View
                  key={tx.id}
                  style={[
                    s.txRow,
                    { borderBottomColor: BORDER },
                    i === recentTxns.length - 1 && { borderBottomWidth: 0 },
                  ]}>
                  <View style={[s.txIconBox, { backgroundColor: SHEET_BG }]}>
                    <Ionicons
                      name={tx.method === 'lightning' ? 'flash' : 'card-outline'}
                      size={18}
                      color={BRAND_GREEN}
                    />
                  </View>

                  <View style={s.txMain}>
                    <Text style={[s.txDesc, { color: TEXT }]} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text style={[s.txDate, { color: MUTED }]}>{tx.date}</Text>
                  </View>

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

        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Top Header Banner
  topHeader: {
    backgroundColor: BRAND_GREEN,
    paddingBottom: 28,
  },
  headerSafeArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  greetingTxt: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  userNameTxt: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  countryTagTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2F7E2',
    marginTop: 1,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },

  // Curved Sheet
  scrollContent: {
    paddingBottom: 100, // accommodate floating tab bar
  },
  curvedSheet: {
    marginTop: -20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 600,
  },

  // 1. Balance Card
  balanceCard: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 20,
    padding: 22,
    gap: 12,
  },
  balanceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
  },
  balanceCardAmt: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  arrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCardSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2F7E2',
  },

  // 2. Stats Grid Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  statSub: {
    fontSize: 10,
  },

  // Section
  section: {
    gap: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllTxt: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Shortcuts
  shortcutsScroll: {
    gap: 10,
  },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shortcutTxt: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Recent Transactions List
  txListCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMain: {
    flex: 1,
    gap: 2,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 11,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txAmt: {
    fontSize: 14,
    fontWeight: '800',
  },
  txStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
});
