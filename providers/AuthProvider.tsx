import { useState, useEffect, useCallback, useMemo } from "react";
import * as SecureStore from "expo-secure-store";
import createContextHook from "@nkzw/create-context-hook";
import { User } from "@/types";

const AUTH_KEY = "notevault_auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function makeUser(name: string, email: string): User {
  return {
    id: `user-${Date.now()}`,
    name: name.trim() || email.split("@")[0] || "User",
    email: email.trim().toLowerCase(),
  };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const stored = await SecureStore.getItemAsync(AUTH_KEY);

        if (!stored) return;

        const parsed = JSON.parse(stored) as User;

        if (!parsed?.email || !parsed?.id) {
          await SecureStore.deleteItemAsync(AUTH_KEY);
          return;
        }

        setUser(parsed);
      } catch (e) {
        console.log("[Auth] Failed to load session:", e);
        await SecureStore.deleteItemAsync(AUTH_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    void loadAuth();
  }, []);

  const saveSession = useCallback(async (nextUser: User) => {
    await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setAuthError(null);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const cleanEmail = email.trim().toLowerCase();

      if (!isValidEmail(cleanEmail)) {
        const message = "Please enter a valid email address.";
        setAuthError(message);
        throw new Error(message);
      }

      if (password.trim().length < 6) {
        const message = "Password must be at least 6 characters.";
        setAuthError(message);
        throw new Error(message);
      }

      const newUser = makeUser(cleanEmail.split("@")[0], cleanEmail);
      await saveSession(newUser);

      return newUser;
    },
    [saveSession],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName) {
        const message = "Please enter your name.";
        setAuthError(message);
        throw new Error(message);
      }

      if (!isValidEmail(cleanEmail)) {
        const message = "Please enter a valid email address.";
        setAuthError(message);
        throw new Error(message);
      }

      if (password.trim().length < 6) {
        const message = "Password must be at least 6 characters.";
        setAuthError(message);
        throw new Error(message);
      }

      const newUser = makeUser(cleanName, cleanEmail);
      await saveSession(newUser);

      return newUser;
    },
    [saveSession],
  );

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(AUTH_KEY);
    setUser(null);
    setAuthError(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;

      const updated: User = {
        ...user,
        ...updates,
        email: updates.email?.trim().toLowerCase() ?? user.email,
        name: updates.name?.trim() ?? user.name,
      };

      await saveSession(updated);
    },
    [user, saveSession],
  );

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      authError,
      signIn,
      signUp,
      signOut,
      updateProfile,
      clearAuthError,
    }),
    [
      user,
      isLoading,
      isAuthenticated,
      authError,
      signIn,
      signUp,
      signOut,
      updateProfile,
      clearAuthError,
    ],
  );
});
