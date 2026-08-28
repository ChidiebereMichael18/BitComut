import React from 'react';
import { Image, View, StyleSheet, Platform } from 'react-native';

interface AppLogoProps {
  size?: number;
  bg?: string; // background container color, defaults to #1B7F3B (Green)
  color?: string; // symbol color, defaults to #FFFFFF (White)
  style?: any;
  useImage?: boolean;
}

/**
 * Official BitComut Africa Logo Component
 * Renders the Graduation Cap + Open Academic Book + Bitcoin (₿) symbol.
 */
export function AppLogo({
  size = 48,
  bg = '#1B7F3B',
  color = '#FFFFFF',
  style,
  useImage = false,
}: AppLogoProps) {
  const borderRadius = Math.round(size * 0.26);

  if (useImage) {
    return (
      <View style={[{ width: size, height: size, borderRadius, overflow: 'hidden' }, style]}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Vector Logo Component
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: Math.round(size * 0.15),
        },
        style,
      ]}>
      {Platform.OS === 'web' ? (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          {/* Graduation Cap Diamond */}
          <polygon points="50,8 92,28 50,48 8,28" fill={color} />

          {/* Tassel */}
          <path d="M80 28v22" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <circle cx="80" cy="54" r="4.5" fill={color} />

          {/* Open Academic Book Base */}
          <path
            d="M15 54c15-4 28-2 35 6 7-8 20-10 35-6v26c-15-4-28-2-35 6-7-8-20-10-35-6V54z"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Bitcoin ₿ Emblem in Center */}
          <rect x="45" y="44" width="3.5" height="38" rx="1.5" fill={color} />
          <rect x="51.5" y="44" width="3.5" height="38" rx="1.5" fill={color} />
          <path
            d="M40 50h14c4 0 7 2.5 7 6s-3 6-7 6H40V50zm0 12h16c4.5 0 8 3 8 7s-3.5 7-8 7H40V62z"
            fill="none"
            stroke={color}
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <Image
          source={require('../../../assets/images/logo.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

export default AppLogo;
