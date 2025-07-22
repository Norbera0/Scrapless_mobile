
import { create } from 'zustand';

interface LogItem {
  id: string;
  name: string;
  estimatedAmount: string;
}

interface WasteLogState {
  photoDataUri: string | null;
  photoPreview: string | null;
  items: LogItem[];
  setPhotoDataUri: (uri: string | null) => void;
  setPhotoPreview: (uri: string | null) => void;
  setItems: (items: LogItem[]) => void;
  reset: () => void;
}

const initialState = {
    photoDataUri: null,
    photoPreview: null,
    items: [],
};

export const useWasteLogStore = create<WasteLogState>()((set) => ({
  ...initialState,
  setPhotoDataUri: (uri) => set({ photoDataUri: uri }),
  setPhotoPreview: (uri) => set({ photoPreview: uri }),
  setItems: (items) => set({ items: items }),
  reset: () => set(initialState),
}));
