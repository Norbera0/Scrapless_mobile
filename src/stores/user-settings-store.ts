import { create } from 'zustand';
import type { UserSettings, HouseholdSize, MonthlyBudget, DietaryRestriction, CookingFrequency, ShoppingLocation, UserGoal } from '@/types';

interface UserSettingsState {
  settings: UserSettings;
  settingsInitialized: boolean;
  setSettings: (settings: UserSettings) => void;
  setSettingsInitialized: (initialized: boolean) => void;
  setSavingsGoal: (goal: number) => void;
  setHouseholdSize: (size: HouseholdSize) => void;
  setMonthlyBudget: (budget: MonthlyBudget) => void;
  setDietaryRestrictions: (restrictions: DietaryRestriction[]) => void;
  setFoodAllergies: (allergies: string) => void;
  setCookingFrequency: (frequency: CookingFrequency) => void;
  setShoppingLocations: (locations: ShoppingLocation[]) => void;
  setPrimaryGoal: (goal: UserGoal) => void;
  setNotes: (notes: string) => void;
}

const defaultSettings: UserSettings = {
  language: 'en',
  savingsGoal: 5000,
  householdSize: '2',
  monthlyBudget: '6k_10k',
  dietaryRestrictions: [],
  foodAllergies: '',
  cookingFrequency: 'daily',
  shoppingLocations: ['supermarket'],
  primaryGoal: 'save_money',
  notes: '',
};

export const useUserSettingsStore = create<UserSettingsState>()((set) => ({
  settings: defaultSettings,
  settingsInitialized: false,
  setSettings: (settings) => set({ settings: { ...defaultSettings, ...settings } }),
  setSettingsInitialized: (initialized) => set({ settingsInitialized: initialized }),
  setSavingsGoal: (goal) => set(state => ({
    settings: { ...state.settings, savingsGoal: goal }
  })),
  setHouseholdSize: (size) => set(state => ({
    settings: { ...state.settings, householdSize: size }
  })),
  setMonthlyBudget: (budget) => set(state => ({
    settings: { ...state.settings, monthlyBudget: budget }
  })),
  setDietaryRestrictions: (restrictions) => set(state => ({
    settings: { ...state.settings, dietaryRestrictions: restrictions }
  })),
  setFoodAllergies: (allergies) => set(state => ({
    settings: { ...state.settings, foodAllergies: allergies }
  })),
  setCookingFrequency: (frequency) => set(state => ({
    settings: { ...state.settings, cookingFrequency: frequency }
  })),
  setShoppingLocations: (locations) => set(state => ({
    settings: { ...state.settings, shoppingLocations: locations }
  })),
  setPrimaryGoal: (goal) => set(state => ({
    settings: { ...state.settings, primaryGoal: goal }
  })),
  setNotes: (notes) => set(state => ({
    settings: { ...state.settings, notes: notes }
  })),
}));
