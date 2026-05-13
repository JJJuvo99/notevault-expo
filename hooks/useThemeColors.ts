import { useColorScheme } from "react-native";
import { darkColors, lightColors } from "@/constants/colors";
import { useSettingsStore } from "../stores/useSettingsStore";

export function useThemeColors() {
  const systemTheme = useColorScheme();

  const themeMode = useSettingsStore((s) => s.themeMode);

  const resolvedTheme =
    themeMode === "system" ? (systemTheme ?? "dark") : themeMode;

  return resolvedTheme === "light" ? lightColors : darkColors;
}
