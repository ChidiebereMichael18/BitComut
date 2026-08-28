import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@/components/ui/icon';
import { AppLogo } from '@/components/ui/app-logo';
import { useAuth } from '@/context/auth-context';

const BRAND_GREEN = '#386635'; // Forest Green

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('alain.niyonzima@student.dau.edu');
  const [password, setPassword] = useState('Rwanda@123');
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
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.kbav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* Top Logo */}
            <View style={s.topNav}>
              <AppLogo size={42} bg={BRAND_GREEN} color="#FFFFFF" useImage />
            </View>

            {/* Title Block Raised Up */}
            <View style={s.head}>
              <Text style={s.title}>Welcome Back 👋</Text>
              <Text style={s.sub}>Sign in to your BitComut Africa student account to pay and track tuition fees.</Text>
            </View>

            {/* Clean Form Card */}
            <View style={s.card}>
              {error ? (
                <View style={s.errBox}>
                  <Text style={s.errTxt}>{error}</Text>
                </View>
              ) : null}

              {/* Email Field */}
              <View style={s.field}>
                <Text style={s.label}>Email Address</Text>
                <TextInput
                  style={s.input}
                  placeholder="student@university.edu"
                  placeholderTextColor="#99A899"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password Field */}
              <View style={s.field}>
                <Text style={s.label}>Password</Text>
                <View style={s.inputRow}>
                  <TextInput
                    style={s.inputFlex}
                    placeholder="Enter your password"
                    placeholderTextColor="#99A899"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#667766" />
                  </Pressable>
                </View>
              </View>

              {/* Primary Sign In CTA */}
              <Pressable
                style={({ pressed }) => [s.btn, { opacity: loading ? 0.8 : pressed ? 0.88 : 1 }]}
                onPress={handleLogin}
                disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.btnTxt}>Sign In</Text>}
              </Pressable>
            </View>

            {/* Footer Callout */}
            <View style={s.footer}>
              <Text style={s.footerTxt}>Don't have an account? </Text>
              <Pressable onPress={() => router.replace('/(auth)/signup')}>
                <Text style={s.footerLink}>Create Account</Text>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure White Background
  },
  safe: {
    flex: 1,
  },
  kbav: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
    justifyContent: 'flex-start', // Raised up layout
  },

  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  head: {
    gap: 6,
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A2E1A',
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: 14,
    color: '#556955',
    lineHeight: 20,
  },

  card: {
    backgroundColor: '#F8FAF8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E8E5',
    padding: 20,
    gap: 16,
  },
  errBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },

  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#445544',
    letterSpacing: 0.3,
  },

  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E8E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A2E1A',
  },
  inputRow: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E8E5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputFlex: {
    flex: 1,
    fontSize: 15,
    color: '#1A2E1A',
  },
  eyeBtn: {
    paddingLeft: 10,
  },

  btn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerTxt: {
    fontSize: 14,
    color: '#667766',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_GREEN,
  },
});
