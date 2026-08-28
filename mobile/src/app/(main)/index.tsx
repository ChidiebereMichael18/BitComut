import React from 'react';
import {
  Pressable,
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
import { getCountryConfig } from '@/constants/universities';

const BRAND_GREEN = '#386635'; // Exact Forest Green

export default function HomeScreen() {
  const { user } = useAuth();
  const { pendingFees, transactions } = usePayment();

  // Dynamic Country Currency & Live BTC Rate Sync
  const countryConfig  = getCountryConfig(user?.country);
  const btcRate        = countryConfig.btcRate;
  const currencySymbol = countryConfig.currencySymbol;

  const totalDue   = pendingFees.reduce((s, f) => s + f.amount, 0);
  const btcEquiv   = (totalDue / btcRate).toFixed(5);
  const firstName  = user?.name?.split(' ')[0] ?? 'Student';
  const avatarInit = user?.avatarInitials ?? 'BC';
  const recentTxns = transactions.slice(0, 3);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_GREEN} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}>

        {/* ── 1. TOP GREEN HEADER WITH STAT CARDS INSIDE (Screenshot Design) ── */}
        <View style={s.headerContainer}>
          <SafeAreaView edges={['top']} style={s.headerSafeArea}>
            {/* Top User Greeting + Profile Circle */}
            <View style={s.headerTopRow}>
              <View>
                <Text style={s.greetingLabel}>Good morning,</Text>
                <Text style={s.userNameTitle}>{firstName} 👋</Text>
              </View>

              <Pressable
                onPress={() => router.push('/(main)/profile')}
                style={s.avatarBtn}>
                <Text style={s.avatarBtnTxt}>{avatarInit}</Text>
              </Pressable>
            </View>

            {/* 3 Stat Cards INSIDE Header Banner */}
            <View style={s.headerStatsRow}>
              {/* Stat 1 */}
              <View style={s.glassStatCard}>
                <Ionicons name="school-outline" size={18} color="#FFFFFF" />
                <Text style={s.glassStatVal}>{pendingFees.length}</Text>
                <Text style={s.glassStatLabel}>FEES DUE</Text>
              </View>

              {/* Stat 2 */}
              <View style={s.glassStatCard}>
                <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                <Text style={s.glassStatVal} numberOfLines={1}>
                  {currencySymbol}{totalDue > 1000 ? `${(totalDue / 1000).toFixed(0)}k` : totalDue}
                </Text>
                <Text style={s.glassStatLabel}>DUE AMT</Text>
              </View>

              {/* Stat 3 */}
              <View style={s.glassStatCard}>
                <Ionicons name="logo-bitcoin" size={18} color="#F59E0B" />
                <Text style={s.glassStatVal} numberOfLines={1}>{btcEquiv}</Text>
                <Text style={s.glassStatLabel}>BTC EQUIV</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* ── 2. OVERLAPPING WHITE FLOATING QUICK ACTIONS CARD ── */}
        <View style={s.floatingActionsCard}>
          <Pressable
            style={s.actionTile}
            onPress={() => router.push('/(main)/pay')}>
            <View style={[s.actionIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="add-circle-outline" size={22} color="#3B82F6" />
            </View>
            <Text style={s.actionLabel}>Pay Fees</Text>
          </Pressable>

          <Pressable
            style={s.actionTile}
            onPress={() => router.push('/(main)/history')}>
            <View style={[s.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="receipt-outline" size={22} color="#10B981" />
            </View>
            <Text style={s.actionLabel}>Receipts</Text>
          </Pressable>

          <Pressable
            style={s.actionTile}
            onPress={() => router.push('/(main)/pay')}>
            <View style={[s.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="school-outline" size={22} color="#06B6D4" />
            </View>
            <Text style={s.actionLabel}>Universities</Text>
          </Pressable>

          <Pressable
            style={s.actionTile}
            onPress={() => router.push('/(main)/profile')}>
            <View style={[s.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="headset-outline" size={22} color="#D97706" />
            </View>
            <Text style={s.actionLabel}>Support</Text>
          </Pressable>
        </View>

        {/* ── 3. PENDING TUITION & FEES CARD SECTION ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Pending Tuition & Fees</Text>
            <Pressable onPress={() => router.push('/(main)/pay')}>
              <Text style={s.seeAllLink}>See All</Text>
            </Pressable>
          </View>

          <View style={s.pendingCard}>
            <View style={s.pendingIconCircle}>
              <Ionicons name="school-outline" size={32} color="#94A3B8" />
            </View>
            <Text style={s.pendingTitle}>2024/25 Academic Tuition</Text>
            <Text style={s.pendingSub}>
              {countryConfig.name} University · {currencySymbol}{totalDue.toLocaleString()} (≈ {btcEquiv} BTC)
            </Text>

            <Pressable
              style={({ pressed }) => [s.payFeeCtaBtn, { opacity: pressed ? 0.9 : 1 }]}
              onPress={() => router.push('/(main)/pay')}>
              <Text style={s.payFeeCtaTxt}>Pay Fee Now →</Text>
            </Pressable>
          </View>
        </View>

        {/* ── 4. RECENT ACTIVITY SECTION ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Activity</Text>
            <Pressable onPress={() => router.push('/(main)/history')}>
              <Text style={s.seeAllLink}>View All</Text>
            </Pressable>
          </View>

          <View style={s.activityListCard}>
            {recentTxns.map((tx, i) => (
              <View
                key={tx.id}
                style={[
                  s.activityRow,
                  i === recentTxns.length - 1 && { borderBottomWidth: 0 },
                ]}>
                <View style={s.activityIconBox}>
                  <Ionicons
                    name={tx.method === 'lightning' ? 'flash' : 'card-outline'}
                    size={18}
                    color={BRAND_GREEN}
                  />
                </View>

                <View style={s.activityMain}>
                  <Text style={s.activityDesc} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text style={s.activityDate}>{tx.date}</Text>
                </View>

                <View style={s.activityRight}>
                  <Text style={s.activityAmt}>
                    {currencySymbol}{tx.amount.toLocaleString()}
                  </Text>
                  <Text style={s.activityStatus}>Paid ⚡</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // 1. Header Container
  headerContainer: {
    backgroundColor: BRAND_GREEN,
    paddingBottom: 44,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerSafeArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  userNameTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  avatarBtnTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 3 Stat Cards INSIDE Header
  headerStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  glassStatCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  glassStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  glassStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.78)',
    letterSpacing: 0.5,
  },

  // 2. Floating Actions Card
  floatingActionsCard: {
    marginHorizontal: 16,
    marginTop: -28,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  actionTile: {
    alignItems: 'center',
    gap: 6,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_GREEN,
  },

  // Pending Tuition Card
  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  pendingIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  pendingSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  payFeeCtaBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
  },
  payFeeCtaTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_GREEN,
  },

  // Recent Activity List
  activityListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F0F5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityMain: {
    flex: 1,
    gap: 2,
  },
  activityDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  activityDate: {
    fontSize: 11,
    color: '#64748B',
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  activityAmt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  activityStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
});
