import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, User, Mail, Save } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuth } from "@/providers/AuthProvider";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ProfileScreen() {
  const router = useRouter();
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const initials = (name || email || "U").trim().slice(0, 1).toUpperCase();

  const handleSave = useCallback(async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      Alert.alert("Missing name", "Please enter your name.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile({
        name: cleanName,
        email: cleanEmail,
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert("Profile updated", "Your profile details have been saved.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (e) {
      console.log("[Profile] Failed to update profile:", e);

      Alert.alert(
        "Save failed",
        "Something went wrong while saving your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [name, email, updateProfile, router]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text} />
          <Text style={styles.backText}>Settings</Text>
        </Pressable>

        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Update the details shown inside NoteVault.
        </Text>

        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.avatarName}>{name || "Your name"}</Text>
          <Text style={styles.avatarEmail}>{email || "your@email.com"}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Account details</Text>

          <View style={styles.inputWrapper}>
            <User size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isSaving}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
            />
          </View>
        </View>

        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Save changes</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
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
      lineHeight: 21,
    },
    avatarSection: {
      alignItems: "center",
      backgroundColor: Colors.card,
      borderRadius: 20,
      padding: 22,
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
      marginBottom: 16,
    },
    avatarCircle: {
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor: Colors.accentSoft,
      borderWidth: 1,
      borderColor: Colors.accent,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },
    avatarText: {
      color: Colors.accent,
      fontSize: 34,
      fontWeight: "800",
    },
    avatarName: {
      color: Colors.text,
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 4,
    },
    avatarEmail: {
      color: Colors.textSecondary,
      fontSize: 14,
    },
    formCard: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
      marginBottom: 18,
    },
    sectionTitle: {
      color: Colors.text,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 14,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.inputBorder,
      paddingHorizontal: 16,
      height: 52,
      marginBottom: 12,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      color: Colors.text,
      fontSize: 15,
      height: 52,
    },
    saveButton: {
      height: 52,
      borderRadius: 14,
      backgroundColor: Colors.accent,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
  });
