

/**
 * @fileOverview This file defines shared Zod schemas for Genkit flows.
 */

import { z } from 'genkit';

export const LogFoodWasteInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the wasted food, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type LogFoodWasteInput = z.infer<typeof LogFoodWasteInputSchema>;

export const LogFoodWasteFromAudioInputSchema = z.object({
    audioDataUri: z
      .string()
      .describe(
        'An audio recording of wasted food, as a data URI that must include a MIME type and use Base64 encoding.'
      ),
  });
export type LogFoodWasteFromAudioInput = z.infer<typeof LogFoodWasteFromAudioInputSchema>;

export const LogFoodWasteFromTextInputSchema = z.object({
  text: z.string().describe('A text list of wasted food items.'),
});
export type LogFoodWasteFromTextInput = z.infer<typeof LogFoodWasteFromTextInputSchema>;

export const LogFoodWasteOutputSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe('The name of the food item.'),
      estimatedAmount: z
        .string()
        .describe('The estimated amount of the food item (e.g., 1/2 cup, 1 slice, 2 pcs).'),
    })
  ).describe('A list of detected food items and their estimated amounts.'),
});
export type LogFoodWasteOutput = z.infer<typeof LogFoodWasteOutputSchema>;

// Pantry Schemas
export const LogPantryItemInputSchema = z.object({
    source: z.enum(['camera', 'voice', 'text']),
    data: z.string().describe("The data for logging. Can be a data URI for camera/voice, or a string of text."),
  });
export type LogPantryItemInput = z.infer<typeof LogPantryItemInputSchema>;
  
export const LogPantryItemOutputSchema = z.object({
    items: z.array(
      z.object({
        name: z.string().describe('The name of the food item.'),
        quantity: z.number().describe('The numeric quantity of the food item (e.g., for "2 apples", this is 2).'),
        unit: z.string().describe('The unit of measurement for the quantity (e.g., for "2 apples", this is "apples"; for "1kg rice", this is "kg").'),
        shelfLifeByStorage: z.object({
            counter: z.number().describe("Shelf life in days if stored on the counter."),
            pantry: z.number().describe("Shelf life in days if stored in a pantry/cabinet."),
            refrigerator: z.number().describe("Shelf life in days if stored in the refrigerator."),
            freezer: z.number().describe("Shelf life in days if stored in the freezer."),
        }).describe("The estimated shelf life of the item in days, broken down by storage method."),
        carbonFootprint: z.number().optional().describe("The estimated carbonFootPrint in kg CO2e."),
        estimatedCost: z.number().optional().describe("The estimated cost of the item in PHP."),
        purchaseSource: z.string().optional().describe("The source where the item was purchased (e.g., 'supermarket', 'wet_market', 'sari_sari_store', 'minimart', 'online', 'home_grown', 'gift_shared', 'other')."),
      })
    ).describe('A list of detected food items, their quantities, units, and estimated shelf life.'),
});
export type LogPantryItemOutput = z.infer<typeof LogPantryItemOutputSchema>;

// Recipe Schemas
export const SuggestRecipesInputSchema = z.object({
    pantryItems: z.array(z.string()).describe("A list of food items currently in the user's pantry."),
    preferences: z.object({
        quickMeals: z.boolean().optional().describe("Filter for meals that take 15 minutes or less to cook."),
        filipinoDishes: z.boolean().optional().describe("Filter for Filipino cuisine."),
        difficulty: z.string().optional().describe("The user's cooking skill level (e.g., 'Easy', 'Intermediate', 'Hard')."),
    }).optional(),
});
export type SuggestRecipesInput = z.infer<typeof SuggestRecipesInputSchema>;

export const SuggestRecipesOutputSchema = z.object({
    recipes: z.array(
        z.object({
            id: z.string().describe("A unique ID for the recipe, in slug format (e.g. 'chicken-adobo')."),
            name: z.string().describe("The name of the recipe."),
            cuisine: z.string().describe("The type of cuisine (e.g., Filipino, Italian, Mexican)."),
            difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The cooking difficulty of the recipe."),
            cookingTime: z.string().describe("The estimated cooking time (e.g., '30 min')."),
            servings: z.number().describe("The number of servings the recipe makes."),
            ingredients: z.array(
                z.object({
                    name: z.string().describe("The name of the ingredient."),
                    quantity: z.number().describe("The numeric quantity of the ingredient needed (e.g., for '2 cloves of garlic', this is 2)."),
                    unit: z.string().describe("The unit for the ingredient quantity (e.g., 'cloves', 'kg', 'cup')."),
                    status: z.enum(['Have', 'Basic', 'Need']).describe("The status of the ingredient: 'Have' (in pantry), 'Basic' (assumed available like oil/salt), or 'Need' (must be purchased)."),
                    estimatedCost: z.number().optional().describe("The estimated cost in PHP if the ingredient status is 'Need'."),
                })
            ),
            instructions: z.array(z.string()).describe("A list of step-by-step cooking instructions."),
            photoDataUri: z.string().optional().describe("A data URI of a generated image of the recipe."),
            tags: z.array(z.string()).optional().describe("Informative tags like 'Urgent' (if it uses expiring items), 'Quick', 'Healthy'."),
            benefit: z.string().describe("A short, compelling benefit of making this recipe, e.g., 'Saves P120 from waste' or '285 cal • 12g protein'."),
        })
    ).describe("A list of 3-5 recipe suggestions."),
});
export type SuggestRecipesOutput = z.infer<typeof SuggestRecipesOutputSchema>;

// Chat Assistant Schemas
const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
});
export const ChatWithAssistantInputSchema = z.object({
    query: z.string().optional().describe("The user's most recent message to the assistant (if text)."),
    audioDataUri: z.string().optional().describe("The user's most recent message as an audio data URI (if voice)."),
    userName: z.string().describe("The user's first name."),
    history: z.array(ChatMessageSchema).describe("The conversation history."),
    pantryItems: z.array(
        z.object({
            name: z.string(),
            estimatedExpirationDate: z.string(),
            estimatedAmount: z.string(),
        })
    ).describe("A list of items currently in the user's pantry."),
    wasteLogs: z.array(z.any()).describe("A list of recent waste log objects."),
    totalPesoValueWasted: z.number().describe("Total peso value wasted in the last 30 days."),
    totalCarbonFootprintWasted: z.number().describe("Total carbon footprint wasted in the last 30 days."),
    topWastedItem: z.object({ name: z.string(), count: z.number() }).describe("The most frequently wasted item."),
    mostCommonWasteReason: z.string().describe("The most common reason for waste."),
    preferences: z.object({
        dietaryRestrictions: z.array(z.string()).optional(),
        favoriteCuisines: z.array(z.string()).optional(),
    }).optional().describe("User's food preferences."),
});
export type ChatWithAssistantInput = z.infer<typeof ChatWithAssistantInputSchema>;

export const ChatWithAssistantOutputSchema = z.object({
    response: z.string().describe("The AI assistant's text response to the user."),
    transcribedQuery: z.string().optional().describe("The transcribed text if the input was audio."),
});
export type ChatWithAssistantOutput = z.infer<typeof ChatWithAssistantOutputSchema>;

// Item-specific Insights Schemas
export const GetItemInsightsInputSchema = z.object({
    name: z.string().describe('The name of the food item.'),
    quantity: z.number().describe('The quantity of the food item.'),
    unit: z.string().describe('The unit for the quantity.'),
    estimatedExpirationDate: z.string().describe("The estimated expiration date in 'YYYY-MM-DD' format."),
    estimatedCost: z.number().optional().describe("The estimated cost of the item in PHP."),
  });
export type GetItemInsightsInput = z.infer<typeof GetItemInsightsInputSchema>;
  
export const GetItemInsightsOutputSchema = z.object({
    storageTip: z.string().describe("An actionable storage tip to maximize freshness."),
    wastePreventionTip: z.string().describe("A smart tip to prevent this item from being wasted."),
    recipes: z.array(
      z.object({
        id: z.string().describe("A unique ID for the recipe, in slug format (e.g. 'chicken-adobo')."),
        name: z.string().describe("The name of the recipe."),
        description: z.string().describe("A short, enticing description of the recipe."),
        difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The cooking difficulty."),
        cookingTime: z.string().describe("The estimated cooking time (e.g., '15 min')."),
        photoDataUri: z.string().optional().describe("A data URI of a generated image of the recipe."),
      })
    ).describe('A list of 2-3 simple recipe ideas.'),
  });
export type GetItemInsightsOutput = z.infer<typeof GetItemInsightsOutputSchema>;

// Shopping List Schemas
export const GenerateShoppingListInputSchema = z.object({
  pantryItems: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      estimatedExpirationDate: z.string(),
    })
  ).describe('A list of items currently in the user\'s pantry.'),
  wasteLogs: z.array(z.any()).describe('A list of recent waste log objects (last 60 days).'),
});
export type GenerateShoppingListInput = z.infer<typeof GenerateShoppingListInputSchema>;

export const GenerateShoppingListOutputSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().describe('A unique ID for the shopping list item.'),
      name: z.string().describe('The name of the item to buy.'),
      category: z
        .enum(['staple', 'data_driven', 'seasonal', 'complementary', 'low_stock'])
        .describe('The category explaining why this item is suggested.'),
      quantity: z.string().describe('The recommended quantity to buy (e.g., "500g", "1 liter", "3 pcs").'),
      estimatedCost: z.number().describe('The estimated cost of the item in PHP.'),
      priority: z.enum(['essential', 'recommended', 'optional']).describe('The priority of the item.'),
      reasoning: z.string().describe('A human-readable explanation for the suggestion.'),
      deal: z.object({
        dealType: z.enum(['cashback', 'bogo', 'points', 'green']).describe("The type of deal."),
        icon: z.enum(['bpi', 'vybe', 'green_partner']).describe("The icon to display for the deal."),
        title: z.string().describe("The main title of the deal alert (e.g., 'BPI Deal Alert!', 'BPI Rewards Boost!')."),
        merchant: z.string().describe("The merchant where the deal is available."),
        description: z.string().describe("A short description of the deal (e.g., '15% Cashback', 'Buy 1, Get 1 Free')."),
        terms: z.string().optional().describe("The terms and conditions of the deal (e.g., 'Valid until Aug 31. Min. spend ₱2,000')."),
        estimatedSavings: z.string().describe("The tangible value for the user (e.g., '~₱57.00', '~₱85.00', '~25 Bonus Points', 'Free Reusable Bag')."),
      }).optional().describe('An optional promotional deal associated with this item.'),
    })
  ),
  totalEstimatedCost: z.number().describe('The total estimated cost of the shopping list in PHP.'),
  generationSource: z.object({
    pantryItemsConsidered: z.number(),
    wasteLogsAnalyzed: z.number(),
    daysOfDataUsed: z.number(),
    stapleItemsIncluded: z.number(),
  }),
});
export type GenerateShoppingListOutput = z.infer<typeof GenerateShoppingListOutputSchema>;

// Kitchen Coach Schemas
export const KitchenCoachInputSchema = z.object({
  userName: z.string(),
  userStage: z.enum(['new_user', 'regular_user', 'advanced_user']),
  daysActive: z.number(),
  hasBpiData: z.boolean(),
  pantryItemsCount: z.number(),
  wasteLogsCount: z.number(),
  weather: z.object({
    temperature: z.number(),
    condition: z.string(),
    humidity: z.number(),
  }).optional(),
  wasteData: z.object({
    logs: z.array(z.object({
      date: z.string(),
      items: z.array(z.object({ name: z.string(), amount: z.string(), category: z.string() })),
      reason: z.string(),
      totalValue: z.number(),
      dayOfWeek: z.string(),
    })),
    patterns: z.object({
      topWastedCategory: z.string(),
      avgWeeklyWaste: z.number(),
      wasteFrequency: z.string(),
    }),
  }),
  pantryData: z.object({
    currentItems: z.array(z.object({
      name: z.string(),
      expiresIn: z.number(),
      category: z.string(),
    })),
    healthScore: z.number(),
  }),
  bpiData: z.object({
    grocerySpend: z.number(),
    spendTrend: z.string(),
    cashFlow: z.string(),
    alerts: z.array(z.string()),
  }).optional(),
});
export type KitchenCoachInput = z.infer<typeof KitchenCoachInputSchema>;

export const KitchenCoachOutputSchema = z.object({
  insightType: z.enum(['pattern_detected', 'getting_started', 'first_steps', 're_engagement', 'connect_the_dots']),
  confidence: z.enum(['high', 'medium', 'low']),
  title: z.string(),
  story: z.object({
    situation: z.array(z.string()),
    impact: z.string(),
    rootCause: z.array(z.string()),
  }),
  prediction: z.string(),
  solutions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    timeToSee: z.string(),
    estimatedSavings: z.number(),
    successRate: z.number(),
    filipinoContext: z.string(),
  })),
  quickWin: z.string(),
  encouragement: z.string(),
});
export type KitchenCoachOutput = z.infer<typeof KitchenCoachOutputSchema>;

// Consumption Analysis Schemas
export const AnalyzeConsumptionPatternsInputSchema = z.object({
  userName: z.string(),
  pantryItems: z.array(
    z.object({
      name: z.string(),
      estimatedExpirationDate: z.string(),
    })
  ),
  wasteLogs: z.array(
    z.object({
      date: z.string(),
      items: z.array(
        z.object({
          name: z.string(),
          estimatedAmount: z.string(),
        })
      ),
      sessionWasteReason: z.string(),
    })
  ),
  bpiTrackPlanData: z
    .object({
      spendingCategories: z.array(
        z.object({
          category: z.string(),
          amount: z.number(),
          trend: z.string(),
        })
      ),
      cashFlowAlert: z.string(),
      unusualTransactions: z.array(z.string()),
    })
    .optional(),
});
export type AnalyzeConsumptionPatternsInput = z.infer<typeof AnalyzeConsumptionPatternsInputSchema>;

export const AnalyzeConsumptionPatternsOutputSchema = z.object({
  keyObservation: z.string(),
  patternAlert: z.string(),
  smartTip: z.string(),
  smartShoppingPlan: z.string(),
  whatsReallyHappening: z.string(),
  whyThisPatternExists: z.string(),
  financialImpact: z.string(),
  solutions: z.array(
    z.object({
      solution: z.string(),
      successRate: z.number(),
      estimatedSavings: z.number().optional(),
    })
  ).describe("A list of 2 actionable, alternative solutions."),
  similarUserStory: z.string(),
});
export type AnalyzeConsumptionPatternsOutput = z.infer<typeof AnalyzeConsumptionPatternsOutputSchema>;
