import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Info } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function ModalScreen() {
  console.log("[ModalScreen] Rendering NoteVault info modal");
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <View style={styles.modalContent}>
        <View style={styles.iconWrapper}>
          <Info size={28} color={Colors.accent} />
        </View>
        <Text style={styles.title}>NoteVault</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.description}>
          Your thoughts, secured. A premium notes app with AI-powered writing assistance, voice transcription, calendar, and journal features.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={() => router.back()}
          testID="btn-close-modal"
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    margin: 24,
    alignItems: "center",
    minWidth: 300,
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  version: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
    fontWeight: "500" as const,
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
    paddingHorizontal: 8,
  },
  closeButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 14,
    minWidth: 120,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "700" as const,
    textAlign: "center",
    fontSize: 15,
  },
});
