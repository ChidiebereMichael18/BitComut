import { Tabs } from 'expo-router';
import { Ionicons } from '@/components/ui/icon';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#386635',
        tabBarInactiveTintColor: '#889988',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E8E5',
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
            <Ionicons name="card-outline" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
