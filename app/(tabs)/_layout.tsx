import { Tabs } from "expo-router";
import { BookOpen, Search, Clock, Settings } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function TabLayout() {
  const Colors = useThemeColors();

  console.log("[TabLayout] Rendering tab navigator");

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,

        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 0.5,

          ...(Platform.OS === "web"
            ? {
                height: 60,
              }
            : {}),
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
          marginTop: -2,
        },

        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(notebooks)"
        options={{
          title: "Notebooks",
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="recents"
        options={{
          title: "Recents",
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
