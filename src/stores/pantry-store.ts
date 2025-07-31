
import { create } from 'zustand';
import type { PantryItem } from '@/types';

export interface PantryLogItem {
  id: string;
  name: string;
  estimatedAmount: string;
  estimatedExpirationDate: string;
  carbonFootprint?: number;
  // Optional details
  storageLocation?: string;
  useByTimeline?: string;
  purchaseSource?: string;
  priceAmount?: number;
  priceUnit?: string;
}

interface PantryLogState {
  photoDataUri: string | null;
  textInput: string;
  items: PantryLogItem[];
  liveItems: PantryItem[];
  optimisticItems: PantryItem[];
  pantryInitialized: boolean;
  setPhotoDataUri: (uri: string | null) => void;
  setTextInput: (text: string) => void;
  setItems: (items: PantryLogItem[]) => void;
  setLiveItems: (items: PantryItem[]) => void;
  addOptimisticItems: (items: PantryItem[]) => void;
  clearOptimisticItems: () => void;
  setPantryInitialized: (initialized: boolean) => void;
  reset: () => void;
}

const initialState = {
    photoDataUri: null,
    textInput: '',
    items: [],
    liveItems: [],
    optimisticItems: [],
    pantryInitialized: false,
};

export const usePantryLogStore = create<PantryLogState>()((set) => ({
  ...initialState,
  setPhotoDataUri: (uri) => set({ photoDataUri: uri }),
  setTextInput: (text) => set({ textInput: text }),
  setItems: (items) => set({ items }),
  setLiveItems: (items) => set({ liveItems: items }),
  addOptimisticItems: (items) => set((state) => ({ optimisticItems: [...state.optimisticItems, ...items] })),
  clearOptimisticItems: () => set({ optimisticItems: [] }),
  setPantryInitialized: (initialized) => set({ pantryInitialized: initialized }),
  reset: () => set({ 
    photoDataUri: null,
    textInput: '',
    items: [],
    // Do not reset liveItems, optimisticItems, or initialized status
  }),
}));
