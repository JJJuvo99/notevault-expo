import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";
import { X, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/hooks/useThemeColors";

const getNoteBackgrounds = (Colors: any) => [
  { id: "default", color: Colors.background, label: "Default" },
  { id: "dark_slate", color: "#0F1923", label: "Slate" },
  { id: "midnight", color: "#0D0D1A", label: "Midnight" },
  { id: "deep_ocean", color: "#0A1628", label: "Ocean" },
  { id: "charcoal", color: "#1A1A1A", label: "Charcoal" },
  { id: "forest", color: "#0D1A14", label: "Forest" },
  { id: "plum", color: "#1A0D1F", label: "Plum" },
  { id: "warm_dark", color: "#1A1410", label: "Warm" },
  { id: "steel", color: "#16181D", label: "Steel" },
  { id: "paper", color: "#F5F0E8", label: "Paper" },
  { id: "cream", color: "#FFF8F0", label: "Cream" },
  { id: "soft_white", color: "#F0F2F5", label: "Light" },
];

const FONT_SIZES = [
  { id: "small", size: 14, label: "S" },
  { id: "medium", size: 16, label: "M" },
  { id: "large", size: 18, label: "L" },
  { id: "xlarge", size: 20, label: "XL" },
];

const LINE_SPACINGS = [
  { id: "compact", value: 20, label: "Compact" },
  { id: "normal", value: 24, label: "Normal" },
  { id: "relaxed", value: 28, label: "Relaxed" },
  { id: "loose", value: 32, label: "Loose" },
];

interface NoteSettingsPanelProps {
  visible: boolean;
  onClose: () => void;
  backgroundColor: string;
  onBackgroundChange: (color: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  lineSpacing: number;
  onLineSpacingChange: (spacing: number) => void;
}

export default function NoteSettingsPanel({
  visible,
  onClose,
  backgroundColor,
  onBackgroundChange,
  fontSize,
  onFontSizeChange,
  lineSpacing,
  onLineSpacingChange,
}: NoteSettingsPanelProps) {
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);
  const NOTE_BACKGROUNDS = getNoteBackgrounds(Colors);

  const handleBgSelect = useCallback(
    (color: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onBackgroundChange(color);
    },
    [onBackgroundChange],
  );

  const handleFontSelect = useCallback(
    (size: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onFontSizeChange(size);
    },
    [onFontSizeChange],
  );

  const handleSpacingSelect = useCallback(
    (spacing: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onLineSpacingChange(spacing);
    },
    [onLineSpacingChange],
  );

  const isLightBg = (color: string) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Page Settings</Text>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.sectionTitle}>Background</Text>

            <View style={styles.colorGrid}>
              {NOTE_BACKGROUNDS.map((bg) => (
                <Pressable
                  key={bg.id}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: bg.color },
                    isLightBg(bg.color) && styles.lightSwatchBorder,
                    backgroundColor === bg.color && styles.colorSwatchActive,
                  ]}
                  onPress={() => handleBgSelect(bg.color)}
                >
                  {backgroundColor === bg.color && (
                    <Check
                      size={14}
                      color={isLightBg(bg.color) ? "#333" : "#fff"}
                    />
                  )}
                </Pressable>
              ))}
            </View>

            <View style={styles.colorLabels}>
              {NOTE_BACKGROUNDS.map((bg) => (
                <Text
                  key={bg.id}
                  style={[
                    styles.colorLabel,
                    backgroundColor === bg.color && styles.colorLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {bg.label}
                </Text>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Font Size</Text>

            <View style={styles.optionRow}>
              {FONT_SIZES.map((fs) => (
                <Pressable
                  key={fs.id}
                  style={[
                    styles.optionChip,
                    fontSize === fs.size && styles.optionChipActive,
                  ]}
                  onPress={() => handleFontSelect(fs.size)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      { fontSize: fs.size - 2 },
                      fontSize === fs.size && styles.optionChipTextActive,
                    ]}
                  >
                    {fs.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Line Spacing</Text>

            <View style={styles.optionRow}>
              {LINE_SPACINGS.map((ls) => (
                <Pressable
                  key={ls.id}
                  style={[
                    styles.optionChip,
                    lineSpacing === ls.value && styles.optionChipActive,
                  ]}
                  onPress={() => handleSpacingSelect(ls.value)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      lineSpacing === ls.value && styles.optionChipTextActive,
                    ]}
                  >
                    {ls.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: Colors.overlay,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 40,
      maxHeight: "60%",
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.cardBorder,
      alignSelf: "center",
      marginTop: 10,
      marginBottom: 6,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: Colors.text,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.card,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: Colors.textMuted,
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
      marginTop: 16,
      marginBottom: 12,
    },
    colorGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    colorSwatch: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    lightSwatchBorder: {
      borderColor: Colors.cardBorder,
    },
    colorSwatchActive: {
      borderColor: Colors.accent,
      borderWidth: 2.5,
    },
    colorLabels: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 4,
    },
    colorLabel: {
      width: 44,
      fontSize: 9,
      color: Colors.textMuted,
      textAlign: "center" as const,
    },
    colorLabelActive: {
      color: Colors.accent,
    },
    optionRow: {
      flexDirection: "row",
      gap: 10,
    },
    optionChip: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      alignItems: "center",
    },
    optionChipActive: {
      backgroundColor: Colors.accentSoft,
      borderColor: Colors.accent,
    },
    optionChipText: {
      fontSize: 14,
      fontWeight: "600" as const,
      color: Colors.textSecondary,
    },
    optionChipTextActive: {
      color: Colors.accent,
    },
  });
