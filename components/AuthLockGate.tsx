import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { LockKeyhole } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAuth } from "@/providers/AuthProvider";

export default function AuthLockGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  const { isAuthenticated } = useAuth();

  const biometricsEnabled = useSettingsStore((s) => s.biometricsEnabled);

  const autoLockEnabled = useSettingsStore((s) => s.autoLockEnabled);

  const autoLockDelaySeconds = useSettingsStore((s) => s.autoLockDelaySeconds);

  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const unlock = useCallback(async () => {
    if (!isAuthenticated || !biometricsEnabled) {
      setIsLocked(false);
      return;
    }

    setIsChecking(true);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsLocked(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock NoteVault",
        cancelLabel: "Cancel",
        fallbackLabel: "Use device passcode",
        disableDeviceFallback: false,
      });

      setIsLocked(!result.success);
    } catch (e) {
      console.log("[AuthLockGate] Biometric unlock error:", e);

      setIsLocked(false);
    } finally {
      setIsChecking(false);
    }
  }, [isAuthenticated, biometricsEnabled]);

  useEffect(() => {
    if (isAuthenticated && biometricsEnabled) {
      setIsLocked(true);
      void unlock();
    } else {
      setIsLocked(false);
    }
  }, [isAuthenticated, biometricsEnabled, unlock]);

  useEffect(() => {
    let backgroundedAt: number | null = null;

    const sub = AppState.addEventListener("change", (state) => {
      if (!isAuthenticated || !biometricsEnabled || !autoLockEnabled) {
        return;
      }

      if (state === "background" || state === "inactive") {
        backgroundedAt = Date.now();
        return;
      }

      if (state === "active") {
        if (!backgroundedAt) return;

        const elapsedSeconds = (Date.now() - backgroundedAt) / 1000;

        backgroundedAt = null;

        if (elapsedSeconds >= autoLockDelaySeconds) {
          setIsLocked(true);
          void unlock();
        }
      }
    });

    return () => sub.remove();
  }, [
    isAuthenticated,
    biometricsEnabled,
    autoLockEnabled,
    autoLockDelaySeconds,
    unlock,
  ]);

  if (!isLocked && !isChecking) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.lockIcon}>
        <LockKeyhole size={34} color={Colors.accent} />
      </View>

      <Text style={styles.title}>NoteVault Locked</Text>

      <Text style={styles.subtitle}>
        Use biometrics or your device passcode to unlock your notes.
      </Text>

      {isChecking ? (
        <ActivityIndicator
          color={Colors.accent}
          size="large"
          style={styles.loader}
        />
      ) : (
        <Pressable style={styles.unlockButton} onPress={unlock}>
          <Text style={styles.unlockText}>Unlock</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },

    lockIcon: {
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor: Colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 22,
      borderWidth: 1,
      borderColor: Colors.accent,
    },

    title: {
      color: Colors.text,
      fontSize: 24,
      fontWeight: "800",
      marginBottom: 8,
    },

    subtitle: {
      color: Colors.textSecondary,
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
    },

    loader: {
      marginTop: 8,
    },

    unlockButton: {
      backgroundColor: Colors.accent,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 14,
    },

    unlockText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
  });
