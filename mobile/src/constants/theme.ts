import '@/global.css';
import { Platform } from 'react-native';

/**
 * BitComut Africa Design System
 * 
 * Rule: Green (#1B7F3B / #22C55E) is used ONLY for:
 *   - Primary CTA button backgrounds
 *   - Active bottom-nav icon + label
 *   - Success / confirmed transaction status text
 * Nowhere else.
 */

export const Colors = {
  dark: {
    // Backgrounds
    background: '#070C07',
    surface: '#0E150E',
    card: '#131A13',
    // Borders
    border: '#1C271C',
    borderSubtle: '#172017',
    // Text
    text: '#F0F0F0',
    textSecondary: '#4E644E',
    textMuted: '#344534',
    // Accent — green
    primary: '#1B7F3B',          // button bg
    primaryActive: '#22C55E',    // active nav, success text
    // Others
    btcOrange: '#F59E0B',
    danger: '#EF4444',
    backgroundElement: '#131A13',
    backgroundSelected: '#1C271C',
    icon: '#4E644E',
  },
  light: {
    background: '#FFFFFF',
    surface: '#F6F6F6',
    card: '#F0F0F0',
    border: '#E4E4E4',
    borderSubtle: '#EEEEEE',
    text: '#0D0D0D',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    primary: '#1B7F3B',
    primaryActive: '#16A34A',
    btcOrange: '#D97706',
    danger: '#DC2626',
    backgroundElement: '#F0F0F0',
    backgroundSelected: '#E4E4E4',
    icon: '#9CA3AF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark & keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  default: { sans: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
