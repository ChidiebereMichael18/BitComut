import React from 'react';
import { Platform, View } from 'react-native';

interface AppLogoProps {
  size?: number;
  bg?: string; // background container color, defaults to #1B7F3B (Green)
  color?: string; // symbol color, defaults to #FFFFFF (White)
  style?: any;
}

/**
 * Official BitComut Africa Logo
 * Combines the Graduation Cap (Education) with the Bitcoin (₿) Symbol.
 * Palette: Pure Green (#1B7F3B) and White (#FFFFFF).
 */
export function AppLogo({ size = 48, bg = '#1B7F3B', color = '#FFFFFF', style }: AppLogoProps) {
  const borderRadius = Math.round(size * 0.28);

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: borderRadius,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          style,
        ]}>
        <svg
          width={Math.round(size * 0.65)}
          height={Math.round(size * 0.65)}
          viewBox="0 0 100 100"
          fill="none">
          {/* Graduation Cap Top (Mortarboard Diamond) */}
          <polygon points="50,10 90,30 50,50 10,30" fill={color} />

          {/* Graduation Cap Base Band */}
          <path d="M26 38v14c0 6 10 10 24 10s24-4 24-10V38" fill="none" stroke={color} strokeWidth="5" />

          {/* Tassel hanging on right */}
          <path d="M82 30v25" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <circle cx="82" cy="57" r="4" fill={color} />

          {/* Bitcoin ₿ Emblem in center bottom */}
          {/* Vertical double bars */}
          <rect x="44" y="52" width="4" height="42" rx="2" fill={color} />
          <rect x="52" y="52" width="4" height="42" rx="2" fill={color} />

          {/* Bitcoin B shapes */}
          <path
            d="M38 58h18c5 0 8 3 8 7.5S61 73 56 73H38V58zm0 15h20c5.5 0 9 3.5 9 8s-3.5 8-9 8H38V73z"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinejoin="round"
          />
        </svg>
      </View>
    );
  }

  // Native Fallback View
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: borderRadius,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <View style={{ width: size * 0.5, height: 4, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: size * 0.4, height: size * 0.4, borderWidth: 3, borderColor: color, borderRadius: size * 0.1, marginTop: 2 }} />
    </View>
  );
}

export default AppLogo;
