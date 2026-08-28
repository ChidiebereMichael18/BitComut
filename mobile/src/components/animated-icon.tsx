import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { AppLogo } from '@/components/ui/app-logo';

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut.duration(500)} style={styles.splashOverlay}>
      <View
        onLayout={() => {
          SplashScreen.hideAsync().finally(() => {
            setTimeout(() => setVisible(false), 600);
          });
        }}>
        <AppLogo size={90} bg="#1B7F3B" color="#FFFFFF" />
      </View>
    </Animated.View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <AppLogo size={72} bg="#1B7F3B" color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#070C07',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
