
import { create } from 'zustand';
import type { PantryItem, RecipeIngredient } from '@/types';
import { updatePantryItemStatus } from '@/lib/data';

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
  otherPurchaseSourceText?: string;
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
  deductRecipeIngredients: (ingredients: RecipeIngredient[]) => { deductedItems: PantryItem[], missingItems: RecipeIngredient[] };
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

// A very simple singular/plural unit converter for comparison.
const getBaseUnit = (unit: string): string => {
    const s = unit.toLowerCase().trim();
    if (s.endsWith('s')) {
        return s.slice(0, -1);
    }
    return s;
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
    set(state => {
        if (newQuantity <= 0) {
            // If quantity is zero or less, archive the item as 'used'
            const itemToArchive = state.liveItems.find(item => item.id === itemId);
            if (itemToArchive) {
                const updatedItem = { ...itemToArchive, status: 'used' as 'used' | 'wasted', usedDate: new Date().toISOString(), quantity: 0 };
                 // Fire-and-forget the backend update
                updatePantryItemStatus(itemToArchive.userId, itemId, 'used').catch(console.error);

                return {
                    liveItems: state.liveItems.filter(item => item.id !== itemId),
                    archivedItems: [updatedItem, ...state.archivedItems],
                };
            }
            return state;
        } else {
            // Otherwise, just update the quantity
            return {
                liveItems: state.liveItems.map(item =>
                    item.id === itemId ? { ...item, quantity: newQuantity } : item
                ),
            };
        }
    });
  },
  deductRecipeIngredients: (ingredients) => {
    const { liveItems, updatePantryItemQuantity } = get();
    const deductedItems: PantryItem[] = [];
    const missingItems: RecipeIngredient[] = [];

    for (const ingredient of ingredients) {
        if (ingredient.status !== 'Have') continue;

        const pantryItem = liveItems.find(p => p.name.toLowerCase() === ingredient.name.toLowerCase());

        if (pantryItem) {
            const basePantryUnit = getBaseUnit(pantryItem.unit);
            const baseIngredientUnit = getBaseUnit(ingredient.unit);

            if (basePantryUnit === baseIngredientUnit && pantryItem.quantity >= ingredient.quantity) {
                const newQuantity = pantryItem.quantity - ingredient.quantity;
                updatePantryItemQuantity(pantryItem.id, newQuantity);
                deductedItems.push(pantryItem);
            } else {
                missingItems.push(ingredient);
            }
        } else {
            missingItems.push(ingredient);
        }
    }
    return { deductedItems, missingItems };
  },
  setPantryInitialized: (initialized) => set({ pantryInitialized: initialized }),
  reset: () => set({ 
    photoDataUri: null,
    textInput: '',
    items: [],
  }),
}));
