import { create } from 'zustand';
import type { UserSettings } from '@/types';

interface UserSettingsState {
  settings: UserSettings;
  settingsInitialized: boolean;
  setSettings: (settings: UserSettings) => void;
  setSettingsInitialized: (initialized: boolean) => void;
  setSavingsGoal: (goal: number) => void;
}

export const useUserSettingsStore = create<UserSettingsState>()((set) => ({
  settings: {
    language: 'en',
    savingsGoal: 5000, // Default goal
  },
  settingsInitialized: false,
  setSettings: (settings) => set({ settings }),
  setSettingsInitialized: (initialized) => set({ settingsInitialized: initialized }),
  setSavingsGoal: (goal) => set(state => ({
    settings: { ...state.settings, savingsGoal: goal }
  })),
}));
