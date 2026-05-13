import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  Palette,
  Info,
  Pencil,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuth } from "@/providers/AuthProvider";

function SettingsRow({
  Colors,
  icon,
  label,
  onPress,
}: {
  Colors: any;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  const settingsStyles = makeSettingsStyles(Colors);

  const handlePress = async () => {
    await Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        settingsStyles.row,
        pressed && settingsStyles.rowPressed,
      ]}
      onPress={handlePress}
      testID={`settings-row-${label.toLowerCase().replace(/\s|&/g, "-")}`}
    >
      <View style={settingsStyles.rowLeft}>
        {icon}
        <Text style={settingsStyles.rowLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  const { user, signOut, updateProfile } = useAuth();

  const [showEditName, setShowEditName] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(user?.name ?? "");

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  }, [signOut, router]);

  const handleSaveName = useCallback(async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    await updateProfile({ name: editName.trim() });
    setShowEditName(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [editName, updateProfile]);

  const openEditName = useCallback(() => {
    setEditName(user?.name ?? "");
    setShowEditName(true);
  }, [user?.name]);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      testID="settings-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name?.[0] ?? "U").toUpperCase()}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? "User"}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ""}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.editBtn,
              pressed && styles.editBtnPressed,
            ]}
            onPress={openEditName}
            testID="btn-edit-profile"
          >
            <Pencil size={16} color={Colors.accent} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <SettingsRow
            Colors={Colors}
            icon={<User size={20} color={Colors.accent} />}
            label="Profile"
            onPress={() => router.push("/settings/profile" as any)}
          />

          <SettingsRow
            Colors={Colors}
            icon={<Shield size={20} color={Colors.accent} />}
            label="Privacy & Security"
            onPress={() => router.push("/(tabs)/settings/privacy")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <SettingsRow
            Colors={Colors}
            icon={<Bell size={20} color={Colors.accent} />}
            label="Notifications"
            onPress={() => router.push("/(tabs)/settings/notifications")}
          />

          <SettingsRow
            Colors={Colors}
            icon={<Palette size={20} color={Colors.accent} />}
            label="Appearance"
            onPress={() => router.push("/(tabs)/settings/appearance")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <SettingsRow
            Colors={Colors}
            icon={<Info size={20} color={Colors.accent} />}
            label="About NoteVault"
            onPress={() => router.push("/(tabs)/settings/about")}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.signOutBtn,
            pressed && styles.signOutBtnPressed,
          ]}
          onPress={handleSignOut}
          testID="btn-sign-out"
        >
          <LogOut size={18} color={Colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showEditName}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditName(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Display Name</Text>

            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your display name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              autoCapitalize="words"
              testID="input-edit-name"
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowEditName(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleSaveName}
                testID="btn-save-name"
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeSettingsStyles = (Colors: any) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: Colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 8,
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
    },
    rowPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.99 }],
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: "500" as const,
      color: Colors.text,
    },
  });

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: "800" as const,
      color: Colors.text,
      paddingTop: 16,
      marginBottom: 24,
      letterSpacing: -0.5,
    },
    profileSection: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: Colors.accentSoft,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: Colors.accent,
    },
    profileInfo: {
      flex: 1,
      marginLeft: 14,
    },
    profileName: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: Colors.text,
    },
    profileEmail: {
      fontSize: 13,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    editBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    editBtnPressed: {
      opacity: 0.75,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: Colors.textMuted,
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
      marginBottom: 10,
      paddingLeft: 4,
    },
    signOutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "rgba(255,77,106,0.1)",
      borderRadius: 14,
      padding: 16,
      marginTop: 8,
    },
    signOutBtnPressed: {
      opacity: 0.75,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: "600" as const,
      color: Colors.danger,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: Colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 28,
    },
    modalContent: {
      backgroundColor: Colors.surface,
      borderRadius: 20,
      padding: 24,
      width: "100%",
      maxWidth: 380,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: Colors.text,
      marginBottom: 20,
      textAlign: "center",
    },
    modalInput: {
      backgroundColor: Colors.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.inputBorder,
      paddingHorizontal: 16,
      height: 48,
      color: Colors.text,
      fontSize: 15,
      marginBottom: 16,
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
    },
    modalCancelBtn: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      justifyContent: "center",
      alignItems: "center",
    },
    modalCancelText: {
      color: Colors.textSecondary,
      fontSize: 15,
      fontWeight: "600" as const,
    },
    modalSaveBtn: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      backgroundColor: Colors.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    modalSaveText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600" as const,
    },
  });
