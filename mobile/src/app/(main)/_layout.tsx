import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@/components/ui/icon';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: {
  name: string;
  label: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}[] = [
  { name: 'index',   label: 'Dashboard', icon: 'home-outline',            iconFocused: 'home' },
  { name: 'pay',     label: 'Pay Fees',  icon: 'arrow-up-circle-outline', iconFocused: 'arrow-up-circle' },
  { name: 'history', label: 'History',   icon: 'time-outline',            iconFocused: 'time' },
  { name: 'profile', label: 'Profile',   icon: 'person-outline',          iconFocused: 'person' },
];

export default function MainLayout() {
  const isDark = useColorScheme() === 'dark';

  const tabBg       = isDark ? '#0F170F' : '#FFFFFF';
  const tabBorder   = isDark ? '#1C2B1C' : '#E5E7EB';
  const activeCol   = '#1B7F3B'; // Brand Green
  const inactiveCol = isDark ? '#6B7280' : '#8E8E93';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 16,
          right: 16,
          height: 66,
          borderRadius: 33,
          backgroundColor: tabBg,
          borderColor: tabBorder,
          borderWidth: StyleSheet.hairlineWidth,
          paddingTop: 8,
          paddingBottom: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        },
        tabBarActiveTintColor: activeCol,
        tabBarInactiveTintColor: inactiveCol,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={23}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({});
