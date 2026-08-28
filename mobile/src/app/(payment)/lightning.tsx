import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@/components/ui/icon';
import { usePayment } from '@/context/payment-context';

const MOCK_INVOICE =
  'lnbc2800000n1p3xh9ppsp5kh9x2u7l9fmz4jkz3hq0nf4d3w7y8e5vgza3q0px2n8ys7w6ksdq5w3jhxapqd4jhx6pqd4jhxap5cqzpuxqyz5vqsp5kh9x2u7l9fmz4jkz3hq0nf4d3w7y8e5vgza3q0px2n8ys7w6ks';

const COUNTDOWN_SECONDS = 600; // 10 min

export default function LightningPaymentScreen() {
  const isDark = useColorScheme() === 'dark';
  const { selectedAmount, selectedUniversity, selectedStudentId, btcRate, addTransaction } =
    usePayment();

  const BG     = isDark ? '#070C07' : '#FFFFFF';
  const SURF   = isDark ? '#0E150E' : '#F6F6F6';
  const CARD   = isDark ? '#131A13' : '#F0F0F0';
  const BORDER = isDark ? '#1C271C' : '#E4E4E4';
  const TEXT   = isDark ? '#F0F0F0' : '#0D0D0D';
  const MUTED  = isDark ? '#4E644E' : '#6B7280';
  const GREEN  = '#1B7F3B';
  const SUCCESS = isDark ? '#22C55E' : '#16A34A';
  const BTC    = '#F59E0B';
  const WARN   = '#F59E0B';

  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'confirming' | 'done'>('waiting');
  const [copied, setCopied] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const qrAnim = useRef(new Animated.Value(0)).current;

  const btcAmount = (selectedAmount / btcRate).toFixed(6);
  const satAmount = Math.round((selectedAmount / btcRate) * 100000000);

  useEffect(() => {
    Animated.spring(qrAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    const interval = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? (clearInterval(interval), 0) : t - 1));
    }, 1000);

    const simulatePayment = setTimeout(() => {
      pulse.stop();
      setPaymentStatus('confirming');
      setTimeout(() => {
        setPaymentStatus('done');
        addTransaction({
          university: selectedUniversity,
          studentId: selectedStudentId,
          amount: selectedAmount,
          currency: 'NGN',
          btcAmount,
          method: 'lightning',
          status: 'success',
          description: 'School Fees Payment',
          txHash: 'bc1q9x4q0r...k4f2',
        });
        clearInterval(interval);
        setTimeout(() => router.replace('/(payment)/success'), 1000);
      }, 1500);
    }, 7000);

    return () => {
      clearInterval(interval);
      clearTimeout(simulatePayment);
      pulse.stop();
    };
  }, [addTransaction, btcAmount, pulseAnim, qrAnim, selectedAmount, selectedStudentId, selectedUniversity]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={BG} />
      <SafeAreaView style={s.safe}>

        {/* Header */}
        <View style={[s.header, { borderBottomColor: BORDER }]}>
          <Pressable style={s.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={MUTED} />
          </Pressable>
          <Text style={[s.headerTitle, { color: TEXT }]}>Lightning Invoice</Text>
          <View style={s.closeBtn} />
        </View>

        <View style={s.content}>
          {/* Amount info */}
          <View style={s.amtBlock}>
            <Text style={[s.amtBtc, { color: BTC }]}>{btcAmount} BTC</Text>
            <Text style={[s.amtSats, { color: MUTED }]}>{satAmount.toLocaleString()} sats  ·  ≈ ₦{selectedAmount.toLocaleString()}</Text>
          </View>

          {/* Animated QR container */}
          <Animated.View
            style={[
              s.qrWrapper,
              { backgroundColor: SURF, borderColor: BORDER, transform: [{ scale: qrAnim }] },
            ]}>
            <QRMock isDark={isDark} />
            <View style={[s.qrCenter, { backgroundColor: CARD }]}>
              <Ionicons name="flash" size={18} color={BTC} />
            </View>
          </Animated.View>

          {/* Status Row */}
          {paymentStatus === 'waiting' && (
            <Animated.View style={[s.statusRow, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[s.statusDot, { backgroundColor: WARN }]} />
              <Text style={[s.statusTxt, { color: WARN }]}>Waiting for Lightning payment...</Text>
            </Animated.View>
          )}
          {paymentStatus === 'confirming' && (
            <View style={s.statusRow}>
              <View style={[s.statusDot, { backgroundColor: SUCCESS }]} />
              <Text style={[s.statusTxt, { color: SUCCESS }]}>Confirming transaction...</Text>
            </View>
          )}
          {paymentStatus === 'done' && (
            <View style={s.statusRow}>
              <Ionicons name="checkmark-circle" size={16} color={SUCCESS} />
              <Text style={[s.statusTxt, { color: SUCCESS }]}>Payment received!</Text>
            </View>
          )}

          {/* Countdown card */}
          <View style={[s.card, { backgroundColor: SURF, borderColor: BORDER }]}>
            <Text style={[s.cardLabel, { color: MUTED }]}>Invoice expires in</Text>
            <Text style={[s.countdown, { color: timeLeft < 60 ? '#EF4444' : TEXT }]}>
              {formatTime(timeLeft)}
            </Text>
          </View>

          {/* Invoice copy card */}
          <View style={[s.card, { backgroundColor: SURF, borderColor: BORDER, gap: 10 }]}>
            <Text style={[s.cardLabel, { color: MUTED }]}>Invoice String</Text>
            <Text style={[s.invoiceCode, { color: TEXT }]} numberOfLines={2}>
              {MOCK_INVOICE}
            </Text>
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [
                s.copyBtn,
                { backgroundColor: copied ? SURF : GREEN, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleCopy}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#FFF" />
              <Text style={s.copyBtnTxt}>{copied ? 'Copied to Clipboard' : 'Copy Invoice'}</Text>
            </Pressable>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

function QRMock({ isDark }: { isDark: boolean }) {
  const blocks = [
    [true, true, true, true, false, true, true],
    [true, false, false, true, true, false, true],
    [true, false, true, false, true, false, true],
    [true, true, false, true, false, true, true],
    [false, true, true, false, true, true, false],
    [true, false, true, true, false, false, true],
    [true, true, true, false, true, true, true],
  ];

  return (
    <View style={qrStyles.grid}>
      {blocks.map((row, ri) => (
        <View key={ri} style={qrStyles.row}>
          {row.map((filled, ci) => (
            <View
              key={ci}
              style={[
                qrStyles.cell,
                { backgroundColor: filled ? (isDark ? '#F0F0F0' : '#0D0D0D') : 'transparent' },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const qrStyles = StyleSheet.create({
  grid: { gap: 4 },
  row:  { flexDirection: 'row', gap: 4 },
  cell: { width: 18, height: 18, borderRadius: 2 },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16, gap: 16, alignItems: 'center' },

  amtBlock: { alignItems: 'center', gap: 2 },
  amtBtc:   { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  amtSats:  { fontSize: 13, fontWeight: '500' },

  qrWrapper: { width: 196, height: 196, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  qrCenter:  { position: 'absolute', width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { fontSize: 13, fontWeight: '600' },

  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, alignItems: 'center', alignSelf: 'stretch', gap: 4 },
  cardLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  countdown: { fontSize: 24, fontWeight: '800', letterSpacing: 2 },
  invoiceCode: { fontSize: 11, lineHeight: 16, fontFamily: 'monospace', textAlign: 'center' },

  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 10, alignSelf: 'stretch', marginTop: 2 },
  copyBtnTxt: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
