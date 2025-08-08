


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
    quantity: number; 
    unit: string; 
    estimatedExpirationDate: string; // ISO String
    addedDate: string; // ISO string for when the item was added
    status: 'live' | 'used' | 'wasted';
    
    // AI-generated data
    shelfLifeByStorage: {
        counter: number;
        pantry: number;
        refrigerator: number;
        freezer: number;
    };
    carbonFootprint: number;
    estimatedCost?: number;
    
    // Optional user-provided details
    storageLocation?: 'counter' | 'pantry' | 'refrigerator' | 'freezer';
    useByTimeline?: string;
    purchaseSource?: string;

    // Fields for tracking usage
    usedDate?: string; // ISO string, set when item is used/wasted
    usageEfficiency?: number; // 0.0 to 1.0, set on consumption
    usageNotes?: string;
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
  quantity: number;
  unit: string;
  status: 'Have' | 'Basic' | 'Need';
  estimatedCost?: number;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cookingTime: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  photoDataUri?: string;
  tags?: string[];
  benefit: string;
}

// Insight Types
export interface InsightSolution {
    solution: string;
    successRate: number; // e.g., 0.75 for 75%
    estimatedSavings?: number;
}

export interface Insight {
    id: string;
    userId: string;
    date: string; // ISO string
    predictionAlertBody?: string;
    keyObservation: string;
    patternAlert: string;
    smartTip: string;
    smartShoppingPlan: string;
    // Deep dive fields
    whatsReallyHappening: string;
    whyThisPatternExists: string;
    financialImpact: string;
    solutions: InsightSolution[];
    similarUserStory: string;
    // User interaction
    status: 'new' | 'acknowledged' | 'acted_on' | 'ignored';
}

// Item-specific AI Insights
export interface ItemRecipeSuggestion {
    id: string;
    name: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    cookingTime: string;
    photoDataUri?: string;
}

export interface ItemInsights {
    storageTip: string;
    wastePreventionTip: string;
    recipes: ItemRecipeSuggestion[];
}

// --- Notification Types ---

export type NotificationCategory = 'critical' | 'important' | 'info' | 'success';

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  date: string; // ISO
  isRead: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}


// --- New Savings-Related Data Structures ---

export interface SavingsEvent {
    id: string;
    userId: string;
    date: string; // ISO string
    type: 'avoided_expiry' | 'recipe_followed' | 'smart_shopping' | 'waste_reduction' | 'solution_implemented';
    amount: number; // in PHP
    description: string;
    relatedPantryItemId?: string;
    relatedWasteLogId?: string;
    relatedSolutionId?: string;
    calculationMethod: string;
    transferredToBank: boolean;
    transferDate?: string; // ISO string
}

export interface SolutionSavings {
    id: string;
    userId: string;
    insightId: string;
    solutionDescription: string;
    projectedSavings: number;
    actualSavings: number;
    implementationDate: string; // ISO string
    status: 'tracking' | 'confirmed' | 'failed';
    userCompliance: number; // 0 to 1
}

export interface SavingsCalculation {
    id: string; // e.g., '2024-08'
    userId: string;
    month: string; // Format: 'YYYY-MM'
    totalSavings: number;
    breakdown: {
        avoided_expiry: number;
        recipe_followed: number;
        smart_shopping: number;
        waste_reduction: number;
        solution_implemented: number;
    };
    amountTransferred: number;
    amountAvailable: number;
    calculationDate: string; // ISO string
}

export interface BaselineBehavior {
    userId: string;
    averageMonthlyWaste: number; // in PHP
    spendingPerCategory: Record<string, number>;
    baselineDate: string; // ISO string
    isEstimated: boolean;
}
