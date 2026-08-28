import { Tabs } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@/components/ui/icon';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: 'Pay Fees',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="pay" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
