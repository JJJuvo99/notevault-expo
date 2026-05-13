import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Fingerprint,
  EyeOff,
  Lock,
  Trash2,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/providers/AuthProvider";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useSettingsStore } from "../../../stores/useSettingsStore";

export default function PrivacyScreen() {
  const router = useRouter();
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);
  const { signOut } = useAuth();

  const biometricsEnabled = useSettingsStore((s) => s.biometricsEnabled);
  const setBiometricsEnabled = useSettingsStore((s) => s.setBiometricsEnabled);

  const hideNotePreviews = useSettingsStore((s) => s.hideNotePreviews);
  const setHideNotePreviews = useSettingsStore((s) => s.setHideNotePreviews);

  const autoLockEnabled = useSettingsStore((s) => s.autoLockEnabled);
  const setAutoLockEnabled = useSettingsStore((s) => s.setAutoLockEnabled);

  const autoLockDelaySeconds = useSettingsStore((s) => s.autoLockDelaySeconds);
  const setAutoLockDelaySeconds = useSettingsStore(
    (s) => s.setAutoLockDelaySeconds,
  );

  const handleBiometricToggle = async (value: boolean) => {
    if (!value) {
      setBiometricsEnabled(false);
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      if (!hasHardware) {
        Alert.alert(
          "Biometrics unavailable",
          "This device does not support biometric authentication.",
        );
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isEnrolled) {
        Alert.alert(
          "No biometrics enrolled",
          "Please set up Face ID, fingerprint, or device passcode first.",
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable biometric unlock",
        cancelLabel: "Cancel",
        fallbackLabel: "Use device passcode",
      });

      if (result.success) {
        setBiometricsEnabled(true);
      }
    } catch (e) {
      console.log("[Privacy] Failed biometric check:", e);
      Alert.alert(
        "Biometric Error",
        "Unable to verify biometric authentication.",
      );
    }
  };
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete account",
      "This will permanently remove all notes, notebooks, settings, and local data from this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert("Final confirmation", "This action cannot be undone.", [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Delete Everything",
                style: "destructive",
                onPress: async () => {
                  try {
                    await AsyncStorage.multiRemove([
                      "notevault_auth",
                      "notevault_notebooks",
                      "notevault_notes",
                      "notevault-settings",
                    ]);

                    await signOut();

                    Alert.alert(
                      "Account deleted",
                      "All local NoteVault data has been removed.",
                    );
                  } catch (e) {
                    console.log("[Privacy] Failed to delete account:", e);

                    Alert.alert(
                      "Delete failed",
                      "Something went wrong while deleting your data.",
                    );
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text} />
          <Text style={styles.backText}>Settings</Text>
        </Pressable>

        <Text style={styles.title}>Privacy & Security</Text>
        <Text style={styles.subtitle}>
          Manage how your notes and account are protected.
        </Text>

        <SettingToggle
          Colors={Colors}
          icon={<Fingerprint size={22} color={Colors.accent} />}
          title="Biometric unlock"
          subtitle="Require fingerprint or face unlock"
          value={biometricsEnabled}
          onValueChange={handleBiometricToggle}
        />

        <SettingToggle
          Colors={Colors}
          icon={<EyeOff size={22} color={Colors.accent} />}
          title="Hide note previews"
          subtitle="Keep note content hidden in previews"
          value={hideNotePreviews}
          onValueChange={setHideNotePreviews}
        />

        <SettingToggle
          Colors={Colors}
          icon={<Lock size={22} color={Colors.accent} />}
          title="Auto-lock"
          subtitle="Lock NoteVault after inactivity"
          value={autoLockEnabled}
          onValueChange={setAutoLockEnabled}
        />

        {autoLockEnabled && (
          <View style={styles.delayCard}>
            <Text style={styles.delayTitle}>Auto-lock delay</Text>

            <View style={styles.delayOptions}>
              {[
                { label: "30 sec", value: 30 },
                { label: "1 min", value: 60 },
                { label: "5 min", value: 300 },
                { label: "15 min", value: 900 },
              ].map((option) => {
                const selected = autoLockDelaySeconds === option.value;

                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.delayButton,
                      selected && styles.delayButtonSelected,
                    ]}
                    onPress={() => setAutoLockDelaySeconds(option.value)}
                  >
                    <Text
                      style={[
                        styles.delayButtonText,
                        selected && styles.delayButtonTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <Pressable style={styles.dangerRow} onPress={handleDeleteAccount}>
          <View style={styles.rowLeft}>
            <View style={styles.dangerIconCircle}>
              <Trash2 size={22} color={Colors.danger} />
            </View>

            <View style={styles.textBlock}>
              <Text style={styles.dangerTitle}>Delete account</Text>
              <Text style={styles.rowSubtitle}>
                Permanently remove your account and notes
              </Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SettingToggle({
  Colors,
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  Colors: any;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const styles = makeStyles(Colors);

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconCircle}>{icon}</View>

        <View style={styles.textBlock}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.surface, true: Colors.accentSoft }}
        thumbColor={value ? Colors.accent : Colors.textMuted}
      />
    </View>
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
    delayCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
      marginBottom: 12,
    },
    delayTitle: {
      color: Colors.text,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 14,
    },
    delayOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    delayButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: Colors.inputBg,
      borderWidth: 1,
      borderColor: Colors.inputBorder,
    },
    delayButtonSelected: {
      backgroundColor: Colors.accentSoft,
      borderColor: Colors.accent,
    },
    delayButtonText: {
      color: Colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    delayButtonTextSelected: {
      color: Colors.accent,
    },
    dangerRow: {
      backgroundColor: "rgba(255,77,106,0.1)",
      borderRadius: 16,
      padding: 16,
      borderWidth: 0.5,
      borderColor: "rgba(255,77,106,0.25)",
      marginTop: 12,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingRight: 12,
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
    dangerIconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "rgba(255,77,106,0.12)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    textBlock: {
      flex: 1,
    },
    rowTitle: {
      color: Colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    dangerTitle: {
      color: Colors.danger,
      fontSize: 16,
      fontWeight: "700",
    },
    rowSubtitle: {
      color: Colors.textSecondary,
      fontSize: 13,
      marginTop: 3,
    },
  });
