
import { create } from 'zustand';
import type { PantryItem } from '@/types';

export interface PantryLogItem {
  id: string;
  name: string;
  estimatedAmount: string;
  estimatedExpirationDate: string;
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
  setPhotoDataUri: (uri: string | null) => void;
  setTextInput: (text: string) => void;
  setItems: (items: PantryLogItem[]) => void;
  setLiveItems: (items: PantryItem[]) => void;
  addOptimisticItems: (items: PantryItem[]) => void;
  clearOptimisticItems: () => void;
  reset: () => void;
}

const initialState = {
    photoDataUri: null,
    textInput: '',
    items: [],
    liveItems: [],
    optimisticItems: [],
};

export const usePantryLogStore = create<PantryLogState>()((set) => ({
  ...initialState,
  setPhotoDataUri: (uri) => set({ photoDataUri: uri }),
  setTextInput: (text) => set({ textInput: text }),
  setItems: (items) => set({ items }),
  setLiveItems: (items) => set({ liveItems: items }),
  addOptimisticItems: (items) => set((state) => ({ optimisticItems: [...state.optimisticItems, ...items] })),
  clearOptimisticItems: () => set({ optimisticItems: [] }),
  reset: () => set({ 
    photoDataUri: null,
    textInput: '',
    items: [],
  }),
}));
