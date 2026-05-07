import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { User } from '@/types';

const AUTH_KEY = 'notevault_auth';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
          setIsAuthenticated(true);
          console.log('[Auth] Restored session for:', parsed.name);
        }
      } catch (e) {
        console.log('[Auth] Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    };
    void loadAuth();
  }, []);

  const signIn = useCallback(async (email: string, _password: string) => {
    console.log('[Auth] Signing in with:', email);
    const newUser: User = {
      id: Date.now().toString(),
      name: email.split('@')[0] || 'User',
      email,
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  }, []);

  const signUp = useCallback(async (name: string, email: string, _password: string) => {
    console.log('[Auth] Signing up:', name, email);
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  }, []);

  const signOut = useCallback(async () => {
    console.log('[Auth] Signing out');
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    setUser(updated);
    console.log('[Auth] Profile updated:', updated.name);
  }, [user]);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }), [user, isLoading, isAuthenticated, signIn, signUp, signOut, updateProfile]);
});
