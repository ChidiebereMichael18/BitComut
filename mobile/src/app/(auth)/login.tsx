import { Ionicons } from '@/components/ui/icon';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const isDark = useColorScheme() === 'dark';
  const { login } = useAuth();

  const BG     = isDark ? '#070C07' : '#FFFFFF';
  const SURF   = isDark ? '#0E150E' : '#F6F6F6';
  const BORDER = isDark ? '#1C271C' : '#E4E4E4';
  const TEXT   = isDark ? '#F0F0F0' : '#0D0D0D';
  const MUTED  = isDark ? '#4E644E' : '#6B7280';
  const INPUT  = isDark ? '#0E150E' : '#F6F6F6';
  const GREEN  = '#1B7F3B';
  const DANGER = isDark ? '#EF4444' : '#DC2626';
  const PH     = isDark ? '#2A3A2A' : '#C0C8C0';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(main)');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={BG} />
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.kbav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Back button */}
            <Pressable style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={MUTED} />
            </Pressable>

            {/* Title block */}
            <View style={s.head}>
              <Text style={[s.title, { color: TEXT }]}>Sign In</Text>
              <Text style={[s.sub, { color: MUTED }]}>Enter your credentials to manage and pay fees.</Text>
            </View>

            {/* Card form */}
            <View style={[s.card, { backgroundColor: SURF, borderColor: BORDER }]}>
              {error ? (
                <View style={[s.errBox, { borderColor: DANGER }]}>
                  <Text style={[s.errTxt, { color: DANGER }]}>{error}</Text>
                </View>
              ) : null}

              {/* Email */}
              <View style={s.field}>
                <Text style={[s.label, { color: MUTED }]}>Email Address</Text>
                <TextInput
                  style={[s.input, { backgroundColor: INPUT, borderColor: BORDER, color: TEXT }]}
                  placeholder="your@email.com"
                  placeholderTextColor={PH}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={s.field}>
                <Text style={[s.label, { color: MUTED }]}>Password</Text>
                <View style={[s.inputRow, { backgroundColor: INPUT, borderColor: BORDER }]}>
                  <TextInput
                    style={[s.inputFlex, { color: TEXT }]}
                    placeholder="Your password"
                    placeholderTextColor={PH}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={MUTED} />
                  </Pressable>
                </View>
              </View>

              {/* Primary CTA */}
              <Pressable
                style={({ pressed }) => [s.btn, { backgroundColor: GREEN, opacity: loading ? 0.8 : pressed ? 0.85 : 1 }]}
                onPress={handleLogin}
                disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnTxt}>Sign In</Text>}
              </Pressable>
            </View>

            {/* Footer link */}
            <View style={s.footer}>
              <Text style={[s.footerTxt, { color: MUTED }]}>Don't have an account? </Text>
              <Pressable onPress={() => router.replace('/(auth)/signup')}>
                <Text style={[s.footerLink, { color: TEXT }]}>Create Account</Text>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kbav: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, gap: 20, justifyContent: 'center' },

  backBtn: { width: 36, height: 36, justifyContent: 'center' },

  head: { gap: 6 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
  sub:   { fontSize: 14, lineHeight: 20 },

  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 16 },
  errBox: { padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  errTxt: { fontSize: 13, fontWeight: '500' },

  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },

  input: { height: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 15 },
  inputRow: { height: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  inputFlex: { flex: 1, fontSize: 15 },
  eyeBtn: { paddingLeft: 10 },

  btn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnTxt: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerTxt: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
