import { Ionicons } from '@/components/ui/icon';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { usePayment } from '@/context/payment-context';

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user, logout } = useAuth();
  const { transactions } = usePayment();

  const BG     = isDark ? '#070C07' : '#FFFFFF';
  const SURF   = isDark ? '#0E150E' : '#F6F6F6';
  const CARD   = isDark ? '#131A13' : '#F0F0F0';
  const BORDER = isDark ? '#1C271C' : '#E4E4E4';
  const TEXT   = isDark ? '#F0F0F0' : '#0D0D0D';
  const MUTED  = isDark ? '#4E644E' : '#6B7280';
  const GREEN  = '#1B7F3B';
  const SUCCESS = isDark ? '#22C55E' : '#16A34A';
  const DANGER  = isDark ? '#EF4444' : '#DC2626';

  const totalPaid = transactions
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);
  const txCount = transactions.filter((t) => t.status === 'success').length;

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={BG} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Identity block ── */}
          <View style={[s.idBlock, { backgroundColor: SURF, borderColor: BORDER }]}>
            <View style={[s.avatar, { backgroundColor: GREEN }]}>
              <Text style={s.avatarTxt}>{user?.avatarInitials ?? 'BC'}</Text>
            </View>
            <View style={s.idInfo}>
              <Text style={[s.idName, { color: TEXT }]}>{user?.name}</Text>
              <Text style={[s.idEmail, { color: MUTED }]}>{user?.email}</Text>
            </View>
          </View>

          {/* ── Stats ── */}
          <View style={s.statsRow}>
            <Stat label="Total paid" value={`₦${(totalPaid / 1000).toFixed(0)}K`} TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
            <Stat label="Payments" value={String(txCount)} TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
          </View>

          {/* ── Account ── */}
          <Section label="ACCOUNT" MUTED={MUTED}>
            <Row icon="person-outline"  label="Full Name"   value={user?.name ?? '—'}       last={false} TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
            <Row icon="mail-outline"    label="Email"       value={user?.email ?? '—'}      last={false} TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
            <Row icon="globe-outline"   label="Country"     value={user?.country ?? '—'}    last={false} TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
            <Row icon="school-outline"  label="University"  value={user?.university ?? '—'} last={false} TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
            <Row icon="card-outline"    label="Student ID"  value={user?.studentId ?? '—'}  last TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
          </Section>

          {/* ── Security ── */}
          <Section label="SECURITY" MUTED={MUTED}>
            <Row icon="lock-closed-outline"  label="Change Password"          last={false} TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
            <Row icon="shield-checkmark-outline" label="Two-Factor Auth"
              trailing={<Switch value={false} trackColor={{ true: SUCCESS }} thumbColor="#FFF" />}
              last TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
          </Section>

          {/* ── Notifications ── */}
          <Section label="NOTIFICATIONS" MUTED={MUTED}>
            <Row icon="notifications-outline" label="Payment Confirmations"
              trailing={<Switch value={true} trackColor={{ true: SUCCESS }} thumbColor="#FFF" />}
              last={false} TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
            <Row icon="alarm-outline" label="Fee Reminders"
              trailing={<Switch value={true} trackColor={{ true: SUCCESS }} thumbColor="#FFF" />}
              last TEXT={TEXT} MUTED={MUTED} SURF={SURF} BORDER={BORDER} />
          </Section>

          {/* ── Sign out ── */}
          <Pressable
            style={({ pressed }) => [s.logoutBtn, { borderColor: DANGER, opacity: pressed ? 0.7 : 1 }]}
            onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={DANGER} />
            <Text style={[s.logoutTxt, { color: DANGER }]}>Sign Out</Text>
          </Pressable>

          <Text style={[s.version, { color: MUTED }]}>BitComut Africa v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({ label, MUTED, children }: any) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionLabel, { color: MUTED }]}>{label}</Text>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ icon, label, value, trailing, last, TEXT, MUTED, SURF, BORDER }: any) {
  return (
    <View style={[s.row, { backgroundColor: SURF, borderBottomColor: BORDER }, last && s.rowLast]}>
      <Ionicons name={icon} size={18} color={MUTED} />
      <Text style={[s.rowLabel, { color: TEXT }]}>{label}</Text>
      <View style={s.rowRight}>
        {value && <Text style={[s.rowValue, { color: MUTED }]} numberOfLines={1}>{value}</Text>}
        {trailing}
        {!trailing && <Ionicons name="chevron-forward" size={16} color={MUTED} />}
      </View>
    </View>
  );
}

function Stat({ label, value, TEXT, MUTED, SURF, BORDER }: any) {
  return (
    <View style={[s.stat, { backgroundColor: SURF, borderColor: BORDER }]}>
      <Text style={[s.statValue, { color: TEXT }]}>{value}</Text>
      <Text style={[s.statLabel, { color: MUTED }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },

  idBlock: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  avatar:  { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 18, color: '#FFF', fontWeight: '700' },
  idInfo: { flex: 1, gap: 2 },
  idName:  { fontSize: 16, fontWeight: '700' },
  idEmail: { fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 2, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12 },

  section: { gap: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, paddingHorizontal: 2 },
  sectionBody: { borderRadius: 14, overflow: 'hidden' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '45%' },
  rowValue: { fontSize: 13, textAlign: 'right' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1 },
  logoutTxt: { fontSize: 15, fontWeight: '700' },

  version: { fontSize: 12, textAlign: 'center' },
});
