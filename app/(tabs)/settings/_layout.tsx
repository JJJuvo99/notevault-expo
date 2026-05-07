import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function SettingsLayout() {
  console.log("[SettingsLayout] Rendering settings stack layout");
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
