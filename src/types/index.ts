
export interface User {
  uid: string;
  name?: string | null;
  email?: string | null;
}

export interface FoodItem {
  id: string;
  name: string;
  estimatedAmount: string;
  pesoValue: number;
  carbonFootprint: number;
}

export interface WasteLog {
  id: string;
  date: string; // ISO string
  userId: string;
  items: FoodItem[];
  totalPesoValue: number;
  totalCarbonFootprint: number;
  photoDataUri?: string;
}

export interface PantryItem extends FoodItem {
    addedDate: string; // ISO string for when the item was added
    estimatedExpirationDate: string; // ISO string for the predicted expiration
    freshness?: 'Fresh' | 'Use Soon' | 'Expiring'; // Tag based on expiration
}
  
export interface PantryLog {
    id: string;
    date: string; // ISO string
    userId: string;
    items: PantryItem[];
    photoDataUri?: string;
}
