import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light" | "system";

type SettingsState = {
  themeMode: ThemeMode;

  noteReminders: boolean;
  dailyReview: boolean;
  securityAlerts: boolean;

  biometricsEnabled: boolean;
  hideNotePreviews: boolean;
  autoLockEnabled: boolean;

  setThemeMode: (themeMode: ThemeMode) => void;

  setNoteReminders: (value: boolean) => void;
  setDailyReview: (value: boolean) => void;
  setSecurityAlerts: (value: boolean) => void;

  setBiometricsEnabled: (value: boolean) => void;
  setHideNotePreviews: (value: boolean) => void;
  setAutoLockEnabled: (value: boolean) => void;
  autoLockDelaySeconds: number;
  setAutoLockDelaySeconds: (value: number) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: "dark",

      noteReminders: true,
      dailyReview: false,
      securityAlerts: true,

      biometricsEnabled: false,
      hideNotePreviews: true,
      autoLockEnabled: false,
      autoLockDelaySeconds: 300, // 5 minutes

      setThemeMode: (themeMode) => set({ themeMode }),

      setNoteReminders: (value) => set({ noteReminders: value }),
      setDailyReview: (value) => set({ dailyReview: value }),
      setSecurityAlerts: (value) => set({ securityAlerts: value }),

      setBiometricsEnabled: (value) => set({ biometricsEnabled: value }),
      setHideNotePreviews: (value) => set({ hideNotePreviews: value }),
      setAutoLockEnabled: (value) => set({ autoLockEnabled: value }),
      setAutoLockDelaySeconds: (value) => set({ autoLockDelaySeconds: value }),
    }),
    {
      name: "notevault-settings",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
