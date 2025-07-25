
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
  setOptimisticItems: (items: PantryItem[]) => void;
  clearOptimisticItems: () => void;
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
  setOptimisticItems: (items) => set({ optimisticItems: items }),
  clearOptimisticItems: () => set({ optimisticItems: [] }),
  reset: () => set({ ...initialState, optimisticItems: [] }), // Keep optimistic items separate from main reset
}));
