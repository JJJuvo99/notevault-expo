import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuth } from "@/providers/AuthProvider";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const Colors = useThemeColors();
  const styles = makeStyles(Colors);

  const {
    signIn,
    signUp,
    authError,
    clearAuthError,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const displayError = localError || authError;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/(tabs)/(notebooks)");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const clearErrors = useCallback(() => {
    setLocalError(null);
    clearAuthError();
  }, [clearAuthError]);

  const validateForm = useCallback(() => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (isSignUp && !cleanName) {
      return "Please enter your full name.";
    }

    if (!cleanEmail) {
      return "Please enter your email address.";
    }

    if (!isValidEmail(cleanEmail)) {
      return "Please enter a valid email address.";
    }

    if (!cleanPassword) {
      return "Please enter your password.";
    }

    if (cleanPassword.length < 6) {
      return "Password must be at least 6 characters.";
    }

    return null;
  }, [name, email, password, isSignUp]);

  const handleSubmit = useCallback(async () => {
    clearErrors();

    const validationError = validateForm();

    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUp(name.trim(), email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }

      router.replace("/(tabs)/(notebooks)");
    } catch (e) {
      console.log("[Login] Authentication error:", e);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    clearErrors,
    validateForm,
    isSignUp,
    signUp,
    signIn,
    name,
    email,
    password,
    router,
  ]);

  const toggleMode = useCallback(() => {
    clearErrors();
    setIsSignUp((prev) => !prev);
  }, [clearErrors]);

  const handleGoogleComingSoon = useCallback(() => {
    Alert.alert(
      "Coming Soon",
      "Google sign-in will be available in a future update.",
    );
  }, []);

  const handleAppleComingSoon = useCallback(() => {
    Alert.alert(
      "Coming Soon",
      "Apple sign-in will be available in a future update.",
    );
  }, []);

  const disabled = isSubmitting || isLoading;

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      testID="login-screen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>NV</Text>
            </View>

            <Text style={styles.title}>NoteVault</Text>
            <Text style={styles.subtitle}>Your thoughts, secured.</Text>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
            {displayError && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            {isSignUp && (
              <View style={styles.inputWrapper}>
                <User
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    clearErrors();
                  }}
                  editable={!disabled}
                  autoCapitalize="words"
                  testID="input-name"
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Mail
                size={18}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  clearErrors();
                }}
                editable={!disabled}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="input-email"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock
                size={18}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />

              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  clearErrors();
                }}
                editable={!disabled}
                secureTextEntry={!showPassword}
                testID="input-password"
              />

              <Pressable
                onPress={() => setShowPassword((p) => !p)}
                style={styles.eyeBtn}
                hitSlop={8}
                disabled={disabled}
              >
                {showPassword ? (
                  <EyeOff size={18} color={Colors.textMuted} />
                ) : (
                  <Eye size={18} color={Colors.textMuted} />
                )}
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                disabled && styles.submitBtnDisabled,
                pressed && !disabled && styles.submitBtnPressed,
              ]}
              onPress={handleSubmit}
              disabled={disabled}
              testID="btn-submit"
            >
              {disabled ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>
                  {isSignUp ? "Create Account" : "Sign In"}
                </Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.socialBtn,
                  pressed && styles.socialBtnPressed,
                ]}
                onPress={handleGoogleComingSoon}
                disabled={disabled}
                testID="btn-google"
              >
                <Text style={styles.socialBtnText}>Google</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.socialBtn,
                  pressed && styles.socialBtnPressed,
                ]}
                onPress={handleAppleComingSoon}
                disabled={disabled}
                testID="btn-apple"
              >
                <Text style={styles.socialBtnText}>Apple</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={toggleMode}
              style={styles.toggleRow}
              disabled={disabled}
              testID="btn-toggle-mode"
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <Text style={styles.toggleLink}>
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 28,
      paddingBottom: 40,
    },
    header: {
      alignItems: "center",
      marginBottom: 48,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: Colors.card,
      borderWidth: 2,
      borderColor: Colors.accent,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      shadowColor: Colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    logoText: {
      fontSize: 28,
      fontWeight: "800" as const,
      color: Colors.accent,
      letterSpacing: -1,
    },
    title: {
      fontSize: 32,
      fontWeight: "800" as const,
      color: Colors.text,
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: Colors.textSecondary,
      letterSpacing: 0.3,
    },
    form: {
      gap: 14,
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(255,77,106,0.1)",
      borderWidth: 1,
      borderColor: "rgba(255,77,106,0.25)",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    errorText: {
      flex: 1,
      color: Colors.danger,
      fontSize: 13,
      fontWeight: "500" as const,
      lineHeight: 18,
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
    passwordInput: {
      paddingRight: 40,
    },
    eyeBtn: {
      position: "absolute" as const,
      right: 16,
      padding: 4,
    },
    submitBtn: {
      backgroundColor: Colors.accent,
      borderRadius: 14,
      height: 52,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
      shadowColor: Colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    submitBtnDisabled: {
      opacity: 0.7,
    },
    submitBtnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    submitText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700" as const,
      letterSpacing: 0.3,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 8,
    },
    divider: {
      flex: 1,
      height: 0.5,
      backgroundColor: Colors.cardBorder,
    },
    dividerText: {
      color: Colors.textMuted,
      fontSize: 12,
      marginHorizontal: 12,
    },
    socialRow: {
      flexDirection: "row",
      gap: 12,
    },
    socialBtn: {
      flex: 1,
      height: 48,
      backgroundColor: Colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      justifyContent: "center",
      alignItems: "center",
    },
    socialBtnPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    socialBtnText: {
      color: Colors.text,
      fontSize: 14,
      fontWeight: "600" as const,
    },
    toggleRow: {
      alignItems: "center",
      marginTop: 8,
    },
    toggleText: {
      color: Colors.textSecondary,
      fontSize: 14,
    },
    toggleLink: {
      color: Colors.accent,
      fontWeight: "600" as const,
    },
  });
