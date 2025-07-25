
import { create } from 'zustand';
import type { PantryItem } from '@/types';

interface PantryLogItem {
  id: string;
  name: string;
  estimatedAmount: string;
  estimatedExpirationDate: string;
}

interface PantryLogState {
  photoDataUri: string | null;
  textInput: string;
  items: PantryLogItem[];
  optimisticItems: PantryItem[];
  setPhotoDataUri: (uri: string | null) => void;
  setTextInput: (text: string) => void;
  setItems: (items: PantryLogItem[]) => void;
  setOptimisticPantryItems: (items: PantryItem[]) => void;
  clearOptimisticPantryItems: () => void;
  reset: () => void;
}

const initialState = {
    photoDataUri: null,
    textInput: '',
    items: [],
    optimisticItems: [],
};

export const usePantryLogStore = create<PantryLogState>()((set) => ({
  ...initialState,
  setPhotoDataUri: (uri) => set({ photoDataUri: uri }),
  setTextInput: (text) => set({ textInput: text }),
  setItems: (items) => set({ items }),
  setOptimisticPantryItems: (items) => set({ optimisticItems: items }),
  clearOptimisticPantryItems: () => set({ optimisticItems: [] }),
  reset: () => set(initialState),
}));
