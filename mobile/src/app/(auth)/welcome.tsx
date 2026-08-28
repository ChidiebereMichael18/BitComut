import React from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppLogo } from '@/components/ui/app-logo';
import { Ionicons } from '@/components/ui/icon';

export default function WelcomeScreen() {
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070C07" />
      <SafeAreaView style={s.safe}>

        {/* ── Top Header Brand ── */}
        <View style={s.topHeader}>
          <View style={s.brandRow}>
            <AppLogo size={36} bg="#1B7F3B" color="#FFFFFF" />
            <Text style={s.brandName}>BitComut</Text>
            <View style={s.africaBadge}>
              <Text style={s.africaBadgeTxt}>AFRICA</Text>
            </View>
          </View>
        </View>

        {/* ── Hero Center Content ── */}
        <View style={s.heroCenter}>

          {/* Central Logo & Visual Icon Badge */}
          <View style={s.logoGraphicWrapper}>
            <View style={s.outerGlowRing} />
            <AppLogo size={96} bg="#1B7F3B" color="#FFFFFF" />
          </View>

          {/* Title & Tagline */}
          <View style={s.titleGroup}>
            <Text style={s.title}>
              Pay African Tuition{'\n'}with Bitcoin
            </Text>
            <Text style={s.subtitle}>
              Instant, borderless fee payments powered by the Lightning Network. Direct settlement for universities in Kigali, Kenya, Nigeria & Ghana.
            </Text>
          </View>

          {/* Supported Regions Pill */}
          <View style={s.regionPill}>
            <Ionicons name="school-outline" size={16} color="#1B7F3B" />
            <Text style={s.regionPillTxt}>🇷🇼 Kigali · 🇰🇪 Kenya · 🇳🇬 Nigeria · 🇬🇭 Ghana</Text>
          </View>

        </View>

        {/* ── Bottom Action Buttons ── */}
        <View style={s.bottomActions}>

          {/* Get Started / Sign Up */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              s.btnPrimary,
              { opacity: pressed ? 0.88 : 1 },
            ]}
            onPress={() => router.push('/(auth)/signup')}>
            <Text style={s.btnPrimaryTxt}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>

          {/* Log In */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              s.btnSecondary,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={() => router.push('/(auth)/login')}>
            <Text style={s.btnSecondaryTxt}>Log In</Text>
          </Pressable>

        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C07',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  // Top header
  topHeader: {
    alignItems: 'center',
    paddingTop: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  africaBadge: {
    backgroundColor: '#131A13',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C271C',
  },
  africaBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1B7F3B',
    letterSpacing: 1.5,
  },

  // Center hero
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 20,
  },
  logoGraphicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  outerGlowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(27, 127, 59, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(27, 127, 59, 0.3)',
  },

  titleGroup: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8A9E8C',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  regionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#0E150E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C271C',
  },
  regionPillTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D0D8D0',
    letterSpacing: 0.2,
  },

  // Bottom actions
  bottomActions: {
    gap: 12,
    marginTop: 'auto',
  },
  btnPrimary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#1B7F3B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSecondary: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#0E150E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C271C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
