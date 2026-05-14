import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { NotesProvider } from "@/providers/NotesProvider";
import { CalendarJournalProvider } from "@/providers/CalendarJournalProvider";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useSettingsStore } from "@/stores/useSettingsStore";
import AuthLockGate from "@/components/AuthLockGate";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const Colors = useThemeColors();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const currentRoot = segments[0];
    const isOnLogin = currentRoot === "login";

    if (!isAuthenticated && !isOnLogin) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isOnLogin) {
      router.replace("/(tabs)/(notebooks)");
    }
  }, [isLoading, isAuthenticated, segments, router]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const noteId = response.notification.request.content.data?.noteId;

        if (typeof noteId === "string" && noteId.length > 0) {
          router.push({
            pathname: "/note-editor",
            params: { noteId },
          });
        }
      },
    );

    return () => subscription.remove();
  }, [router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const Colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        contentStyle: { backgroundColor: Colors.background },
        animation: "fade",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen
        name="login"
        options={{ headerShown: false, animation: "fade" }}
      />

      <Stack.Screen
        name="note-editor"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      <Stack.Screen
        name="ai-chat"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      <Stack.Screen
        name="notebook-detail"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="calendar"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="journal"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="modal"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

function RootLayoutContent() {
  const Colors = useThemeColors();
  const themeMode = useSettingsStore((s) => s.themeMode);

  const statusBarStyle = themeMode === "light" ? "dark" : "light";

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <AuthProvider>
        <NotesProvider>
          <CalendarJournalProvider>
            <StatusBar style={statusBarStyle} />

            <AuthLockGate>
              <AuthGate />
            </AuthLockGate>
          </CalendarJournalProvider>
        </NotesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutContent />
    </QueryClientProvider>
  );
}
