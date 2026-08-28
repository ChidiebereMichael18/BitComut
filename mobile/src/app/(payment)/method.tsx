import React, { useState } from 'react';
import {
  Pressable,
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

const METHODS = [
  {
    id: 'lightning',
    name: 'Lightning Network',
    sub: 'Instant · Near-zero fees',
    icon: 'flash' as const,
    tag: 'FASTEST',
  },
  {
    id: 'btc',
    name: 'Bitcoin On-chain',
    sub: '~30 min confirmation',
    icon: 'logo-bitcoin' as const,
    tag: null,
  },
  {
    id: 'card',
    name: 'Bank Card',
    sub: 'Visa / Mastercard / Verve',
    icon: 'card-outline' as const,
    tag: null,
  },
];

export default function MethodScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuth();
  const { selectedAmount } = usePayment();
  const [selected, setSelected] = useState('lightning');

  const countryConfig = getCountryConfig(user?.country);
  const btcRate       = countryConfig.btcRate;
  const currencySym   = countryConfig.currencySymbol;

  const BG     = isDark ? '#070C07' : '#FFFFFF';
  const SURF   = isDark ? '#0E150E' : '#F6F6F6';
  const CARD   = isDark ? '#131A13' : '#F0F0F0';
  const BORDER = isDark ? '#1C271C' : '#E4E4E4';
  const TEXT   = isDark ? '#F0F0F0' : '#0D0D0D';
  const MUTED  = isDark ? '#4E644E' : '#6B7280';
  const GREEN  = '#1B7F3B';
  const BTC    = '#F59E0B';

  const amtToPay = selectedAmount || 285000;
  const btcAmt   = (amtToPay / btcRate).toFixed(6);

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={BG} />
      <SafeAreaView style={s.safe}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: BORDER }]}>
          <Pressable onPress={() => router.back()} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={MUTED} />
          </Pressable>
          <Text style={[s.headerTitle, { color: TEXT }]}>Payment Method</Text>
          <View style={s.closeBtn} />
        </View>

        {/* Amount summary */}
        <View style={[s.amtBlock, { backgroundColor: SURF, borderColor: BORDER }]}>
          <Text style={[s.amtLabel, { color: MUTED }]}>You are paying</Text>
          <Text style={[s.amtNGN, { color: TEXT }]}>{currencySym}{amtToPay.toLocaleString()}</Text>
          <Text style={[s.amtBTC, { color: BTC }]}>≈ {btcAmt} BTC  ·  rate locked</Text>
        </View>

        {/* Methods */}
        <View style={s.methods}>
          {METHODS.map((m) => {
            const active = selected === m.id;
            return (
              <Pressable
                key={m.id}
                style={[
                  s.method,
                  { backgroundColor: SURF, borderColor: active ? GREEN : BORDER, borderWidth: active ? 1.5 : StyleSheet.hairlineWidth },
                ]}
                onPress={() => setSelected(m.id)}>
                <View style={[s.methodIcon, { backgroundColor: CARD }]}>
                  <Ionicons name={m.icon} size={22} color={active ? GREEN : MUTED} />
                </View>
                <View style={s.methodInfo}>
                  <View style={s.methodNameRow}>
                    <Text style={[s.methodName, { color: TEXT }]}>{m.name}</Text>
                    {m.tag && (
                      <View style={[s.tag, { backgroundColor: CARD }]}>
                        <Text style={[s.tagTxt, { color: BTC }]}>{m.tag}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.methodSub, { color: MUTED }]}>{m.sub}</Text>
                </View>
                <View style={[s.radio, { borderColor: active ? GREEN : BORDER }]}>
                  {active && <View style={[s.radioFill, { backgroundColor: GREEN }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* CTA */}
        <View style={s.cta}>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [s.btn, { backgroundColor: GREEN, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push('/(payment)/lightning')}>
            <Text style={s.btnTxt}>Proceed to Pay</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },

  amtBlock: { margin: 20, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 18, gap: 4 },
  amtLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  amtNGN:   { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  amtBTC:   { fontSize: 13, fontWeight: '500' },

  methods: { paddingHorizontal: 20, gap: 10 },
  method:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 },
  methodIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  methodInfo: { flex: 1 },
  methodNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  methodName: { fontSize: 15, fontWeight: '600' },
  methodSub:  { fontSize: 13, marginTop: 2 },
  tag:  { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  radio:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioFill: { width: 10, height: 10, borderRadius: 5 },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 30 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 14 },
  btnTxt: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
