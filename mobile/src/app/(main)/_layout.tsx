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
  { name: 'index',   label: 'Home',    icon: 'home-outline',            iconFocused: 'home' },
  { name: 'pay',     label: 'Pay',     icon: 'arrow-up-circle-outline', iconFocused: 'arrow-up-circle' },
  { name: 'history', label: 'History', icon: 'time-outline',            iconFocused: 'time' },
  { name: 'profile', label: 'Profile', icon: 'person-outline',          iconFocused: 'person' },
];

export default function MainLayout() {
  const isDark = useColorScheme() === 'dark';

  const tabBg       = isDark ? '#080E08' : '#FFFFFF';
  const tabBorder   = isDark ? '#1C271C' : '#E5E7EB';
  const activeCol   = '#1B7F3B'; // Brand Green
  const inactiveCol = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: tabBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: activeCol,
        tabBarInactiveTintColor: inactiveCol,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
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
                size={24}
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
