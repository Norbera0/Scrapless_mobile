export interface User {
  name: string;
  email: string;
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
  userEmail: string;
  items: FoodItem[];
  totalPesoValue: number;
  totalCarbonFootprint: number;
  photoDataUri?: string;
}
