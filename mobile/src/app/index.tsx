import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppLogo } from '@/components/ui/app-logo';
import { useAuth } from '@/context/auth-context';

const BRAND_GREEN = '#386635';

export default function SplashScreen() {
  const { isLoggedIn } = useAuth();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        if (isLoggedIn) {
          router.replace('/(main)');
        } else {
          router.replace('/(auth)/login');
        }
      }, 1400);
    });
  }, [isLoggedIn, opacity, scale]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Centered App Logo & Headline */}
      <Animated.View style={[styles.centerBlock, { opacity, transform: [{ scale }] }]}>
        <AppLogo size={110} bg={BRAND_GREEN} color="#FFFFFF" useImage />

        <View style={styles.textBlock}>
          <Text style={styles.appName}>BitComut Africa</Text>
          <Text style={styles.headline}>Cross-Border University Payments, Made Simple.</Text>
        </View>
      </Animated.View>

      {/* Bottom Footer */}
      <Animated.View style={[styles.bottomFooter, { opacity }]}>
        <View style={styles.pulseDot} />
        <Text style={styles.footerTxt}>Secured by Bitcoin Lightning Network ⚡</Text>
      </Animated.View>
    </View>
  );
}

const FONT_FAMILY = Platform.OS === 'ios' ? 'System' : 'sans-serif-medium';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure Crisp White
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
    maxWidth: 300,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    color: '#1A2E1A',
    letterSpacing: -0.8,
  },
  headline: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#445544',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 48,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_GREEN,
  },
  footerTxt: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#778877',
  },
});
