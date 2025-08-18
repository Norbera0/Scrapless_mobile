
import { create } from 'zustand';
import type { PantryItem, RecipeIngredient } from '@/types';
import { updatePantryItemStatus, savePantryItems } from '@/lib/data';
import { convertToBaseUnit, convertFromBaseUnit } from '@/lib/conversions';

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
        const itemToUpdate = state.liveItems.find(item => item.id === itemId);
        if (!itemToUpdate) return state;

        if (newQuantity <= 0) {
            const updatedItem = { ...itemToUpdate, status: 'used' as 'used' | 'wasted', usedDate: new Date().toISOString(), quantity: 0 };
            updatePantryItemStatus(itemToUpdate.userId, itemId, 'used').catch(console.error);

            return {
                liveItems: state.liveItems.filter(item => item.id !== itemId),
                archivedItems: [updatedItem, ...state.archivedItems],
            };
        } else {
            const updatedLiveItems = state.liveItems.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            );
             // Fire-and-forget the backend update for quantity change
            savePantryItems(itemToUpdate.userId, [{...itemToUpdate, quantity: newQuantity, id: itemId}]).catch(console.error);
            return { liveItems: updatedLiveItems };
        }
    });
  },
  deductRecipeIngredients: (ingredients) => {
    const { liveItems, updatePantryItemQuantity } = get();
    const deductedItems: PantryItem[] = [];
    const missingItems: RecipeIngredient[] = [];

    for (const ingredient of ingredients) {
        if (ingredient.status !== 'Have') continue;

        const pantryItem = liveItems.find(p => p.name.toLowerCase().includes(ingredient.name.toLowerCase()));

        if (pantryItem) {
            try {
                const pantryBase = convertToBaseUnit(pantryItem.quantity, pantryItem.unit, pantryItem.name);
                const recipeBase = convertToBaseUnit(ingredient.quantity, ingredient.unit, ingredient.name);

                if (pantryBase.unit === recipeBase.unit && pantryBase.quantity >= recipeBase.quantity) {
                    const remainingBaseQuantity = pantryBase.quantity - recipeBase.quantity;
                    const remainingOriginalUnit = convertFromBaseUnit(remainingBaseQuantity, pantryBase.unit, pantryItem.unit, pantryItem.name);

                    updatePantryItemQuantity(pantryItem.id, remainingOriginalUnit.quantity);
                    deductedItems.push(pantryItem);
                } else {
                    missingItems.push(ingredient);
                }
            } catch (error) {
                console.warn(`Conversion/deduction failed for "${ingredient.name}":`, error);
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
