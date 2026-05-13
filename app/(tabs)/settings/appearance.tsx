import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Check, Moon, Sun, Smartphone } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  useSettingsStore,
  type ThemeMode,
} from "../../../stores/useSettingsStore";

export default function AppearanceScreen() {
  const router = useRouter();
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  const theme = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);

  const selectTheme = async (value: ThemeMode) => {
    setThemeMode(value);
    await Haptics.selectionAsync();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text} />
          <Text style={styles.backText}>Settings</Text>
        </Pressable>

        <Text style={styles.title}>Appearance</Text>
        <Text style={styles.subtitle}>Choose how NoteVault looks.</Text>

        <OptionRow
          Colors={Colors}
          icon={<Moon size={22} color={Colors.accent} />}
          title="Dark"
          subtitle="Use the dark NoteVault theme"
          selected={theme === "dark"}
          onPress={() => selectTheme("dark")}
        />

        <OptionRow
          Colors={Colors}
          icon={<Sun size={22} color={Colors.accent} />}
          title="Light"
          subtitle="Use a brighter theme"
          selected={theme === "light"}
          onPress={() => selectTheme("light")}
        />

        <OptionRow
          Colors={Colors}
          icon={<Smartphone size={22} color={Colors.accent} />}
          title="System"
          subtitle="Match your device settings"
          selected={theme === "system"}
          onPress={() => selectTheme("system")}
        />
      </ScrollView>
    </View>
  );
}

function OptionRow({
  Colors,
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  Colors: any;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = makeStyles(Colors);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.iconCircle}>{icon}</View>
        <View>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
      </View>

      {selected && <Check size={20} color={Colors.accent} />}
    </Pressable>
  );
}

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 40,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    backText: {
      color: Colors.textSecondary,
      fontSize: 16,
      marginLeft: 4,
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: Colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: Colors.textSecondary,
      marginBottom: 24,
    },
    row: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: Colors.accentSoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    rowTitle: {
      color: Colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    rowSubtitle: {
      color: Colors.textSecondary,
      fontSize: 13,
      marginTop: 3,
    },
  });
