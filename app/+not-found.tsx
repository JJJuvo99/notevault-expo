import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AlertCircle } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  console.log("[NotFound] Screen rendered");
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <AlertCircle size={48} color={Colors.textMuted} />
        </View>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>
          The screen you&#39;re looking for doesn&#39;t exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.accentSoft,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.accent,
  },
});
