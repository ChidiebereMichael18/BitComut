import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@/components/ui/icon';
import { usePayment } from '@/context/payment-context';

export default function SuccessScreen() {
  const isDark = useColorScheme() === 'dark';
  const { lastTransaction } = usePayment();

  const BG      = '#FFFFFF';
  const SURF    = '#F8FAF8';
  const BORDER  = '#E5E8E5';
  const TEXT    = '#1A2E1A';
  const MUTED   = '#6B7A6B';
  const GREEN   = '#386635';
  const SUCCESS = '#2B7A28';
  const BTC     = '#F59E0B';

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 70,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
      Animated.spring(slideUpAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [opacityAnim, scaleAnim, slideUpAnim]);

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <SafeAreaView style={s.safe}>
        <View style={s.content}>

          {/* Animated check circle */}
          <Animated.View style={[s.iconBox, { transform: [{ scale: scaleAnim }] }]}>
            <Ionicons name="checkmark-circle" size={80} color={SUCCESS} />
          </Animated.View>

          {/* Title & subtitle */}
          <Animated.View
            style={[s.headGroup, { opacity: opacityAnim, transform: [{ translateY: slideUpAnim }] }]}>
            <Text style={[s.title, { color: TEXT }]}>Payment Confirmed</Text>
            <Text style={[s.sub, { color: MUTED }]}>
              Your tuition fee has been processed and credited on the Lightning Network.
            </Text>
          </Animated.View>

          {/* Receipt card */}
          <Animated.View
            style={[
              s.card,
              { backgroundColor: SURF, borderColor: BORDER, opacity: opacityAnim, transform: [{ translateY: slideUpAnim }] },
            ]}>
            <Row label="Amount Paid" value={`₦${lastTransaction?.amount.toLocaleString() ?? '—'}`} TEXT={TEXT} MUTED={MUTED} bold />
            <View style={[s.divider, { backgroundColor: BORDER }]} />
            <Row label="BTC Amount" value={`${lastTransaction?.btcAmount ?? '—'} BTC`} TEXT={BTC} MUTED={MUTED} />
            <View style={[s.divider, { backgroundColor: BORDER }]} />
            <Row label="University" value={lastTransaction?.university ?? '—'} TEXT={TEXT} MUTED={MUTED} />
            <View style={[s.divider, { backgroundColor: BORDER }]} />
            <Row label="Transaction ID" value={lastTransaction?.id ?? '—'} TEXT={MUTED} MUTED={MUTED} mono />
            {lastTransaction?.txHash && (
              <>
                <View style={[s.divider, { backgroundColor: BORDER }]} />
                <Row label="Tx Hash" value={lastTransaction.txHash} TEXT={SUCCESS} MUTED={MUTED} mono />
              </>
            )}
            <View style={[s.divider, { backgroundColor: BORDER }]} />
            <View style={s.row}>
              <Text style={[s.rowLabel, { color: MUTED }]}>Status</Text>
              <Text style={[s.statusBadgeText, { color: SUCCESS }]}>CONFIRMED</Text>
            </View>
          </Animated.View>

          {/* Bottom actions */}
          <Animated.View
            style={[s.actions, { opacity: opacityAnim, transform: [{ translateY: slideUpAnim }] }]}>
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [s.btnSecondary, { borderColor: BORDER, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push('/(main)/history')}>
              <Ionicons name="receipt-outline" size={18} color={TEXT} />
              <Text style={[s.btnSecondaryTxt, { color: TEXT }]}>View History</Text>
            </Pressable>

            <Pressable
              style={({ pressed }: { pressed: boolean }) => [s.btnPrimary, { backgroundColor: GREEN, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => router.replace('/(main)')}>
              <Text style={s.btnPrimaryTxt}>Done</Text>
            </Pressable>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

function Row({ label, value, TEXT, MUTED, bold, mono }: any) {
  return (
    <View style={s.row}>
      <Text style={[s.rowLabel, { color: MUTED }]}>{label}</Text>
      <Text
        style={[
          s.rowValue,
          { color: TEXT, fontWeight: bold ? '700' : '500' },
          mono && { fontFamily: 'monospace', fontSize: 12 },
        ]}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 20,
  },

  iconBox: { marginBottom: 4 },

  headGroup: { alignItems: 'center', gap: 6 },
  title:     { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  sub:       { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },

  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 10, alignSelf: 'stretch' },
  row:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 14, maxWidth: '55%', textAlign: 'right' },
  statusBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  divider:  { height: StyleSheet.hairlineWidth },

  actions: { gap: 10, alignSelf: 'stretch', marginTop: 'auto' },
  btnPrimary:   { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryTxt: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  btnSecondary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  btnSecondaryTxt: { fontSize: 15, fontWeight: '600' },
});
