

export interface User {
  uid: string;
  name?: string | null;
  email?: string | null;
}

export type HouseholdSize = '1' | '2' | '3-4' | '5+';
export type MonthlyBudget = 'under_3k' | '3k_6k' | '6k_10k' | 'over_10k';
export type DietaryRestriction = 'no_pork' | 'no_beef' | 'vegetarian' | 'diabetic_friendly' | 'allergies' | 'none';
export type CookingFrequency = 'daily' | '4_5_times' | '2_3_times' | 'rarely';
export type ShoppingLocation = 'wet_market' | 'supermarket' | 'online' | 'mixed';
export type UserGoal = 'save_money' | 'reduce_waste' | 'meal_planning' | 'stop_spoiling';

export interface UserSettings {
  language?: 'en' | 'fil';
  savingsGoal?: number;
  householdSize?: HouseholdSize;
  monthlyBudget?: MonthlyBudget;
  dietaryRestrictions?: DietaryRestriction[];
  foodAllergies?: string; // For specific allergy notes
  cookingFrequency?: CookingFrequency;
  shoppingLocations?: ShoppingLocation[];
  primaryGoal?: UserGoal;
  notes?: string;
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
    userId: string;
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
    type: 'avoided_expiry' | 'recipe_followed' | 'smart_shopping' | 'waste_reduction' | 'solution_implemented' | 'withdrawal';
    amount: number; // in PHP. Can be negative for withdrawals.
    description: string;
    relatedPantryItemId?: string;
    relatedWasteLogId?: string;
    relatedSolutionId?: string;
    calculationMethod: string;
    transferredToBank: boolean;
    transferDate?: string; // ISO string
}

export interface GreenPointsEvent {
    id: string;
    userId: string;
    date: string; // ISO string
    type: 'log_pantry_item' | 'use_pantry_item' | 'cook_recipe' | 'zero_waste_week' | 'acted_on_insight';
    points: number;
    description: string;
    relatedPantryItemId?: string;
    relatedRecipeId?: string;
    relatedInsightId?: string;
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

// --- Shopping List Data Structures ---

export interface ShoppingListItem {
  id: string;
  name: string;
  category: 'staple' | 'data_driven' | 'seasonal' | 'complementary' | 'low_stock';
  quantity: string;
  estimatedCost: number;
  priority: 'essential' | 'recommended' | 'optional';
  reasoning: string; // Human-readable explanation
  isChecked: boolean; // Shopping completion status
  isPurchased: boolean; // Final purchase confirmation
  purchasedDate?: string;
  wasPantryItem?: boolean; // If this replaces a depleted pantry item
  relatedPantryItemId?: string;
}

export interface ShoppingList {
  id: string;
  userId: string;
  generatedDate: string; // ISO 8601
  lastModifiedDate: string; // ISO 8601
  status: 'active' | 'completed' | 'archived';
  items: ShoppingListItem[];
  totalEstimatedCost: number;
  generationMethod: string;
  generationSource: {
    pantryItemsConsidered: number;
    wasteLogsAnalyzed: number;
    daysOfDataUsed: number;
    stapleItemsIncluded: number;
  };
}

export interface WeatherData {
    location: string;
    temperature: number; // in Celsius
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
    humidity: number; // percentage
}

// --- New Comprehensive Analytics Data Structure ---
export interface AnalyticsData {
    // Top-level KPIs
    pantryHealthScore: number;
    totalVirtualSavings: number;
    totalWasteValue: number;
    totalWasteCO2e: number;
    engagementScore: number; // 0-10 scale

    // Waste Analysis
    waste: {
        thisWeekValue: number;
        lastWeekValue: number;
        weekOverWeekChange: number | null;
        thisMonthValue: number;
        lastMonthValue: number;
        monthOverMonthChange: number | null;
        avgWeeklyValue: number;
        topWastedCategoryByValue: { name: string; value: number } | null;
        topWastedCategoryByFrequency: { name: string; count: number } | null;
        topWasteReason: { name: string; count: number } | null;
        wasteLogFrequency: number; // logs per week
        daysSinceLastLog: number;
        // Feature Engineering
        wasteRateByCategory: Record<string, number>; // waste % for each food category
        avgWasteLagTime: number; // avg days from pantry add to waste
    };

    // Pantry Analysis
    pantry: {
        totalValue: number;
        totalItems: number;
        freshItems: number;
        expiringSoonItems: number;
        expiredItems: number;
        avgItemDuration: number; // days
        turnoverRate: number; // percentage
        // Feature Engineering
        consumptionVelocity: Record<string, { avgDays: number; count: number }>;
    };

    // Savings Analysis
    savings: {
        thisWeekAmount: number;
        thisMonthAmount: number;
        avgAmountPerEvent: number;
        byType: Record<SavingsEvent['type'], number>;
    };

    // Combined & Ratio Metrics
    useRate: number; // percentage of items used vs wasted
    savingsPerWastePeso: number; // How many pesos saved for every peso wasted

    // Contextual Data
    weather: WeatherData | null;
}
