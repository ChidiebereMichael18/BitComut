import React, { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppLogo } from '@/components/ui/app-logo';
import { useAuth } from '@/context/auth-context';

export default function SplashScreen() {
  const { isLoggedIn } = useAuth();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
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
      }, 1200);
    });
  }, [isLoggedIn, opacity, scale]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B7F3B" />

      {/* Centered Large App Logo */}
      <Animated.View style={[styles.centerLogo, { opacity, transform: [{ scale }] }]}>
        <AppLogo size={110} bg="#FFFFFF" color="#1B7F3B" useImage />
      </Animated.View>

      {/* Bottom Branding (Matching Raenest reference layout) */}
      <Animated.View style={[styles.bottomBrand, { opacity }]}>
        <Text style={styles.appName}>BitComut</Text>
        <Text style={styles.tagline}>Your Bitcoin Tuition Partner for Africa</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B7F3B', // Brand Green
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLogo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBrand: {
    alignItems: 'center',
    paddingBottom: 48,
    gap: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.2,
  },
});
