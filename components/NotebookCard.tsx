import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import { Calendar, BookHeart } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Notebook } from "@/types";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 60) / 2;

interface NotebookCardProps {
  notebook: Notebook;
  onPress: () => void;
  onLongPress?: () => void;
  hideSubtitle?: boolean;
}

function NotebookCard({
  notebook,
  onPress,
  onLongPress,
  hideSubtitle,
}: NotebookCardProps) {
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }, [scaleAnim]);

  const isCalendar = notebook.name === "Calendar";
  const isJournal = notebook.name === "Journal";
  const isSpecial = isCalendar || isJournal;
  const isPink = isSpecial;

  const ringColor = isPink
    ? "rgba(244, 114, 182, 0.55)"
    : "rgba(79, 124, 255, 0.45)";

  const bgTint = isPink
    ? "rgba(244, 114, 182, 0.08)"
    : "rgba(79, 124, 255, 0.07)";

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}
    >
      <Pressable
        style={[
          styles.card,
          {
            borderColor: ringColor,
            backgroundColor: bgTint,
          },
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`notebook-card-${notebook.id}`}
      >
        {isSpecial && (
          <View
            style={[
              styles.iconBadge,
              isCalendar ? styles.calendarBadge : styles.journalBadge,
            ]}
          >
            {isCalendar ? (
              <Calendar size={18} color="#38BDF8" />
            ) : (
              <BookHeart size={18} color="#F472B6" />
            )}
          </View>
        )}

        <Text style={styles.name}>{notebook.name}</Text>

        {!hideSubtitle && (
          <Text style={styles.subtitle}>{notebook.subtitle}</Text>
        )}

        {!isSpecial && notebook.noteCount > 0 && (
          <Text style={styles.count}>
            {notebook.noteCount} {notebook.noteCount === 1 ? "note" : "notes"}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default React.memo(NotebookCard);

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    wrapper: {
      width: CARD_SIZE,
      height: CARD_SIZE,
      marginBottom: 16,
    },
    card: {
      width: CARD_SIZE,
      height: CARD_SIZE,
      borderRadius: CARD_SIZE / 2,
      borderWidth: 1.5,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    name: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: Colors.text,
      textAlign: "center",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    count: {
      fontSize: 11,
      color: Colors.textMuted,
      textAlign: "center",
      marginTop: 6,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginBottom: 8,
    },
    calendarBadge: {
      backgroundColor: "rgba(56, 189, 248, 0.16)",
    },
    journalBadge: {
      backgroundColor: "rgba(244, 114, 182, 0.16)",
    },
  });
