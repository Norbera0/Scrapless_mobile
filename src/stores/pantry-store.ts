
import { create } from 'zustand';
import type { PantryItem } from '@/types';

export interface PantryLogItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedExpirationDate: string;
  shelfLifeByStorage: {
      counter: number;
      pantry: number;
      refrigerator: number;
      freezer: number;
  };
  carbonFootprint?: number;
  estimatedCost?: number;
  // Optional details
  storageLocation?: string;
  useByTimeline?: string;
  purchaseSource?: string;
}

interface PantryLogState {
  photoDataUri: string | null;
  textInput: string;
  items: PantryLogItem[];
  liveItems: PantryItem[];
  archivedItems: PantryItem[];
  pantryInitialized: boolean;
  setPhotoDataUri: (uri: string | null) => void;
  setTextInput: (text: string) => void;
  setItems: (items: PantryLogItem[]) => void;
  setLiveItems: (items: PantryItem[]) => void;
  setArchivedItems: (items: PantryItem[]) => void;
  addLiveItems: (items: PantryItem[]) => void;
  archiveItem: (itemId: string, status: 'used' | 'wasted') => void;
  updatePantryItemQuantity: (itemId: string, newQuantity: number) => void;
  setPantryInitialized: (initialized: boolean) => void;
  reset: () => void;
}

const initialState = {
    photoDataUri: null,
    textInput: '',
    items: [],
    liveItems: [],
    archivedItems: [],
    pantryInitialized: false,
};

export const usePantryLogStore = create<PantryLogState>()((set, get) => ({
  ...initialState,
  setPhotoDataUri: (uri) => set({ photoDataUri: uri }),
  setTextInput: (text) => set({ textInput: text }),
  setItems: (items) => set({ items }),
  setLiveItems: (items) => set({ liveItems: items }),
  setArchivedItems: (items) => set({ archivedItems: items }),
  addLiveItems: (itemsToAdd) => set(state => ({
    liveItems: [...state.liveItems, ...itemsToAdd].sort((a, b) => new Date(a.estimatedExpirationDate).getTime() - new Date(b.estimatedExpirationDate).getTime())
  })),
  archiveItem: (itemId, status) => {
    const itemToArchive = get().liveItems.find(item => item.id === itemId);
    if (itemToArchive) {
        const updatedItem = { ...itemToArchive, status, usedDate: new Date().toISOString() };
        set(state => ({
            liveItems: state.liveItems.filter(item => item.id !== itemId),
            archivedItems: [updatedItem, ...state.archivedItems],
        }));
    }
  },
  updatePantryItemQuantity: (itemId, newQuantity) => {
    set(state => ({
      liveItems: state.liveItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ),
    }));
  },
  setPantryInitialized: (initialized) => set({ pantryInitialized: initialized }),
  reset: () => set({ 
    photoDataUri: null,
    textInput: '',
    items: [],
  }),
}));
