import React, { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppLogo } from '@/components/ui/app-logo';
import { useAuth } from '@/context/auth-context';

export default function SplashScreen() {
  const { isLoggedIn } = useAuth();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        if (isLoggedIn) {
          router.replace('/(main)');
        } else {
          router.replace('/(auth)/welcome');
        }
      }, 900);
    });
  }, [isLoggedIn, opacity, scale]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070C07" />

      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
        <AppLogo size={76} bg="#1B7F3B" color="#FFFFFF" />
        <Text style={styles.appName}>BitComut</Text>
        <Text style={styles.appRegion}>AFRICA</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C07',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appRegion: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B7F3B',
    letterSpacing: 4,
  },
});
