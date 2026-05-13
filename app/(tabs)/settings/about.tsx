import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Shield, Sparkles } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function AboutScreen() {
  const router = useRouter();
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text} />
          <Text style={styles.backText}>Settings</Text>
        </Pressable>

        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>NV</Text>
        </View>

        <Text style={styles.title}>NoteVault</Text>
        <Text style={styles.subtitle}>Your thoughts, secured.</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Shield size={22} color={Colors.accent} />

            <Text style={styles.cardTitle}>Private by design</Text>
          </View>

          <Text style={styles.cardText}>
            NoteVault is designed to help you keep your notes organised,
            searchable, and protected.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Sparkles size={22} color={Colors.accent} />

            <Text style={styles.cardTitle}>Built for focused notes</Text>
          </View>

          <Text style={styles.cardText}>
            Capture thoughts, organise notebooks, and quickly return to recent
            notes.
          </Text>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
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
      alignItems: "center",
    },

    backButton: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 32,
    },

    backText: {
      color: Colors.textSecondary,
      fontSize: 16,
      marginLeft: 4,
    },

    logoCircle: {
      width: 108,
      height: 108,
      borderRadius: 54,
      backgroundColor: Colors.accentSoft,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: Colors.accent,
      marginBottom: 22,
    },

    logoText: {
      color: Colors.accent,
      fontSize: 34,
      fontWeight: "800",
    },

    title: {
      color: Colors.text,
      fontSize: 34,
      fontWeight: "800",
      marginBottom: 6,
    },

    subtitle: {
      color: Colors.textSecondary,
      fontSize: 16,
      marginBottom: 28,
    },

    card: {
      alignSelf: "stretch",
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 0.5,
      borderColor: Colors.cardBorder,
      marginBottom: 12,
    },

    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      gap: 10,
    },

    cardTitle: {
      color: Colors.text,
      fontSize: 16,
      fontWeight: "700",
    },

    cardText: {
      color: Colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },

    version: {
      color: Colors.textMuted,
      fontSize: 13,
      marginTop: 20,
    },
  });
