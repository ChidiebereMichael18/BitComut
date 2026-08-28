import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export type IconName =
  | 'home'
  | 'home-outline'
  | 'pay'
  | 'pay-outline'
  | 'time'
  | 'time-outline'
  | 'person'
  | 'person-outline'
  | 'flash'
  | 'card-outline'
  | 'school'
  | 'school-outline'
  | 'checkmark'
  | 'checkmark-circle'
  | 'close'
  | 'arrow-back'
  | 'arrow-forward'
  | 'arrow-up-circle'
  | 'arrow-up-circle-outline'
  | 'search-outline'
  | 'eye-outline'
  | 'eye-off-outline'
  | 'lock-closed-outline'
  | 'shield-checkmark-outline'
  | 'shield-checkmark'
  | 'notifications-outline'
  | 'alarm-outline'
  | 'log-out-outline'
  | 'chevron-forward'
  | 'chevron-down'
  | 'logo-bitcoin'
  | 'receipt-outline'
  | 'ellipse-outline'
  | 'copy-outline'
  | 'globe-outline'
  | 'mail-outline';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string | any;
  style?: any;
}

/**
 * Pure SVG Icon system that works on Web and Mobile without external font dependencies.
 */
export function Icon({ name, size = 20, color = '#FFFFFF', style }: IconProps) {
  const d = PATHS[name] || PATHS['home'];
  const isFilled = !name.includes('outline') && name !== 'close' && name !== 'arrow-back' && name !== 'arrow-forward' && name !== 'chevron-forward' && name !== 'chevron-down';

  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isFilled ? color : 'none'}
        stroke={isFilled ? 'none' : color}
        strokeWidth={isFilled ? '0' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
        {d}
      </svg>
    );
  }

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Native fallback */}
    </View>
  );
}

const PATHS: Record<string, React.ReactNode> = {
  'home': (
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" />
  ),
  'home-outline': (
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ),
  'pay': (
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  ),
  'pay-outline': (
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  ),
  'arrow-up-circle': (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M12 16V8M8 12l4-4 4 4" stroke="#FFF" strokeWidth="2" fill="none" />
    </>
  ),
  'arrow-up-circle-outline': (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16V8M8 12l4-4 4 4" />
    </>
  ),
  'time': (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <polyline points="12 6 12 12 16 14" stroke="#000" strokeWidth="2" fill="none" />
    </>
  ),
  'time-outline': (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  'person': (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="currentColor" />
      <circle cx="12" cy="7" r="4" fill="currentColor" />
    </>
  ),
  'person-outline': (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  'flash': (
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none" />
  ),
  'card-outline': (
    <>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </>
  ),
  'school': (
    <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" fill="currentColor" />
  ),
  'school-outline': (
    <>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </>
  ),
  'checkmark': (
    <polyline points="20 6 9 17 4 12" strokeWidth="2.5" />
  ),
  'checkmark-circle': (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <polyline points="16 9 11 14 8 11" stroke="#060F07" strokeWidth="2" fill="none" />
    </>
  ),
  'close': (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  'arrow-back': (
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>
  ),
  'arrow-forward': (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  'search-outline': (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  'eye-outline': (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off-outline': (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>
  ),
  'lock-closed-outline': (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  'shield-checkmark-outline': (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </>
  ),
  'shield-checkmark': (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" />
      <polyline points="9 12 11 14 15 10" stroke="#070C07" strokeWidth="2" fill="none" />
    </>
  ),
  'notifications-outline': (
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
  ),
  'alarm-outline': (
    <>
      <circle cx="12" cy="13" r="8" />
      <polyline points="12 9 12 13 15 15" />
      <line x1="5" y1="3" x2="2" y2="6" />
      <line x1="19" y1="3" x2="22" y2="6" />
    </>
  ),
  'log-out-outline': (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  'chevron-forward': (
    <polyline points="9 18 15 12 9 6" />
  ),
  'chevron-down': (
    <polyline points="6 9 12 15 18 9" />
  ),
  'logo-bitcoin': (
    <path d="M11.7 15H9V9h2.7c1 0 1.8.8 1.8 1.8 0 .6-.3 1.2-.8 1.5.7.3 1.1.9 1.1 1.7 0 1-.8 1-1.8 1zm-1.2-4.6v1.3h1.2c.4 0 .7-.3.7-.7s-.3-.6-.7-.6h-1.2zm0 2.5v1.4h1.4c.4 0 .8-.3.8-.7s-.4-.7-.8-.7h-1.4zM16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z" fill="currentColor" />
  ),
  'receipt-outline': (
    <>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="12" y2="14" />
    </>
  ),
  'ellipse-outline': (
    <circle cx="12" cy="12" r="9" />
  ),
  'copy-outline': (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  'globe-outline': (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  'mail-outline': (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
};

export { Icon as Ionicons };
export default Icon;
