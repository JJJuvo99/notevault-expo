import { Stack } from "expo-router";
import React from "react";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function NotebooksLayout() {
  const Colors = useThemeColors();

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
