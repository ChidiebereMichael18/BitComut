import { Tabs } from "expo-router"
import { Platform, StyleSheet, type ColorValue } from "react-native"
import { SymbolView } from "expo-symbols"

type IconProps = { color: ColorValue; size: number }

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#F7931A",
        tabBarInactiveTintColor: "#666",
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }: IconProps) => (
            <SymbolView name="house.fill" size={size} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: "Invoices",
          tabBarIcon: ({ color, size }: IconProps) => (
            <SymbolView name="doc.text.fill" size={size} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color, size }: IconProps) => (
            <SymbolView name="bolt.fill" size={size} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }: IconProps) => (
            <SymbolView name="person.crop.circle.fill" size={size} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0a0a0a",
    borderTopColor: "#222",
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 88 : 64,
    paddingBottom: Platform.OS === "ios" ? 28 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
})
