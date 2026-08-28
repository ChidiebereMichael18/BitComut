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

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user, logout } = useAuth();
  const { transactions } = usePayment();

  const countryConfig = getCountryConfig(user?.country);

  const BG       = isDark ? '#070C07' : '#F4F6F4';
  const CARD_BG  = isDark ? '#0E150E' : '#FFFFFF';
  const STAT_BG  = isDark ? '#131D13' : '#F0F5F0';
  const BORDER   = isDark ? '#1C271C' : '#E5E7EB';
  const TEXT     = isDark ? '#F0F0F0' : '#111827';
  const MUTED    = isDark ? '#7E967E' : '#6B7280';
  const GREEN    = '#1B7F3B';
  const SUCCESS  = isDark ? '#22C55E' : '#16A34A';
  const DANGER   = isDark ? '#EF4444' : '#DC2626';

  const txCount = transactions.filter((t) => t.status === 'success').length;

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={BG} />
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* Top Header */}
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: TEXT }]}>Profile</Text>
          <Pressable style={s.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color={TEXT} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Centered Profile Hero Card */}
          <View style={[s.heroCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}>

            {/* Avatar with Verified Badge */}
            <View style={s.avatarWrapper}>
              <View style={[s.avatarCircle, { backgroundColor: GREEN }]}>
                <Text style={s.avatarTxt}>{user?.avatarInitials ?? 'BC'}</Text>
              </View>
              <View style={s.badgeCircle}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>

            {/* Name & Email */}
            <Text style={[s.userName, { color: TEXT }]}>{user?.name?.toUpperCase() ?? 'STUDENT'}</Text>
            <Text style={[s.userEmail, { color: MUTED }]}>{user?.email}</Text>

            {/* Approved Status Tag */}
            <View style={[s.statusTag, { backgroundColor: GREEN }]}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={s.statusTagTxt}>Approved Student</Text>
            </View>

            {/* Rating Subtitle */}
            <View style={s.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[s.ratingTxt, { color: MUTED }]}>Verified Bursar Account</Text>
            </View>

          </View>

          {/* 3 Grid Stats Row */}
          <View style={s.statsRow}>
            <View style={[s.statCard, { backgroundColor: STAT_BG }]}>
              <Text style={[s.statVal, { color: GREEN }]}>{txCount}</Text>
              <Text style={[s.statTitle, { color: TEXT }]}>Total Paid</Text>
              <Text style={[s.statSub, { color: MUTED }]}>Transactions</Text>
            </View>

            <View style={[s.statCard, { backgroundColor: STAT_BG }]}>
              <Text style={[s.statVal, { color: GREEN }]}>2026</Text>
              <Text style={[s.statTitle, { color: TEXT }]}>Member Since</Text>
              <Text style={[s.statSub, { color: MUTED }]}>Verified</Text>
            </View>

            <View style={[s.statCard, { backgroundColor: STAT_BG }]}>
              <Text style={[s.statVal, { color: GREEN }]}>Active</Text>
              <Text style={[s.statTitle, { color: TEXT }]}>Status</Text>
              <Text style={[s.statSub, { color: MUTED }]}>Synced</Text>
            </View>
          </View>

          {/* Student & Contact Information Card */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: TEXT }]}>Contact Information</Text>

            <View style={[s.infoCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}>

              <View style={[s.infoRow, { borderBottomColor: BORDER }]}>
                <Ionicons name="call-outline" size={18} color={MUTED} />
                <Text style={[s.infoLabel, { color: MUTED }]}>Phone:</Text>
                <Text style={[s.infoValue, { color: TEXT }]}>+250 788 123 456</Text>
              </View>

              <View style={[s.infoRow, { borderBottomColor: BORDER }]}>
                <Ionicons name="school-outline" size={18} color={MUTED} />
                <Text style={[s.infoLabel, { color: MUTED }]}>University:</Text>
                <Text style={[s.infoValue, { color: TEXT }]} numberOfLines={1}>
                  {user?.university || 'CMU Africa'}
                </Text>
              </View>

              <View style={[s.infoRow, { borderBottomColor: BORDER }]}>
                <Ionicons name="card-outline" size={18} color={MUTED} />
                <Text style={[s.infoLabel, { color: MUTED }]}>Student ID:</Text>
                <Text style={[s.infoValue, { color: TEXT }]}>{user?.studentId || 'CMU/2024/0189'}</Text>
              </View>

              <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
                <Ionicons name="location-outline" size={18} color={MUTED} />
                <Text style={[s.infoLabel, { color: MUTED }]}>Location:</Text>
                <Text style={[s.infoValue, { color: TEXT }]}>{countryConfig.flag} {countryConfig.name}</Text>
              </View>

            </View>
          </View>

          {/* Sign Out Button */}
          <Pressable
            style={({ pressed }) => [s.logoutBtn, { borderColor: DANGER, opacity: pressed ? 0.75 : 1 }]}
            onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={DANGER} />
            <Text style={[s.logoutTxt, { color: DANGER }]}>Sign Out</Text>
          </Pressable>

          <Text style={[s.versionTxt, { color: MUTED }]}>BitComut Africa v1.0.0</Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110, // space for tab bar
    gap: 20,
  },

  // Hero Card
  heroCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgeCircle: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  userName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: 13,
  },

  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  statusTagTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  ratingTxt: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
  },

  // Section
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Info Card
  infoCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutTxt: {
    fontSize: 15,
    fontWeight: '700',
  },

  versionTxt: {
    fontSize: 12,
    textAlign: 'center',
  },
});
