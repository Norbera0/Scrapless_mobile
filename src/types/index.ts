
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
  wasteReason: string;
}

export interface WasteLog {
  id:string;
  date: string; // ISO string
  userId: string;
  items: FoodItem[];
  totalPesoValue: number;
  totalCarbonFootprint: number;
  photoDataUri?: string;
  sessionWasteReason?: string;
}

export interface PantryItem {
    id: string;
    name: string;
    estimatedAmount: string;
    estimatedExpirationDate: string;
    addedDate: string; // ISO string for when the item was added
    pesoValue: number; 
    carbonFootprint: number;
    // Optional details
    storageLocation?: string;
    useByTimeline?: string;
    purchaseSource?: string;
    priceAmount?: number;
    priceUnit?: string;
}
  
export interface PantryLog {
    id: string;
    date: string; // ISO string
    userId: string;
    items: PantryItem[];
    photoDataUri?: string;
}

// Recipe Types
export interface RecipeIngredient {
  name: string;
  status: 'Have' | 'Basic' | 'Need';
  estimatedCost?: number;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cookingTime: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
}

// Insight Types
export interface InsightSolution {
    solution: string;
    successRate: number; // e.g., 0.75 for 75%
}

export interface Insight {
    id: string;
    userId: string;
    date: string; // ISO string
    keyObservation: string;
    patternAlert: string;
    smartTip: string;
    // Deep dive fields
    whatsReallyHappening: string;
    whyThisPatternExists: string;
    financialImpact: string;
    solutions: InsightSolution[];
    similarUserStory: string;
    // User interaction
    status: 'new' | 'acknowledged' | 'acted_on' | 'ignored';
}
