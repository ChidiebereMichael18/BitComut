import { Ionicons } from '@/components/ui/icon';
import { Tabs } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';

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

  const tabBg      = isDark ? '#070C07' : '#FFFFFF';
  const tabBorder  = isDark ? '#1C271C' : '#E4E4E4';
  const activeCol  = isDark ? '#22C55E' : '#16A34A';
  const inactiveCol = isDark ? '#2A3A2A' : '#B0B8B0';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: tabBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
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
                size={22}
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
