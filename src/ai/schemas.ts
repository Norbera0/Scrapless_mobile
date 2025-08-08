
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
        carbonFootprint: z.number().optional().describe("The estimated carbon footprint in kg CO2e."),
        estimatedCost: z.number().optional().describe("The estimated cost of the item in PHP."),
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
    history: z.array(z.string()).optional().describe("A list of recipe names that have been suggested recently to avoid duplicates."),
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

// Consumption Analysis Schemas
export const AnalyzeConsumptionPatternsInputSchema = z.object({
    userName: z.string().describe("The user's first name."),
    pantryItems: z.array(
        z.object({
            name: z.string(),
            estimatedExpirationDate: z.string(),
            estimatedAmount: z.string(),
        })
    ).describe("A list of items currently in the user's pantry."),
    wasteLogs: z.array(z.any()).describe("A list of recent waste log objects (last 30 days)."),
});
export type AnalyzeConsumptionPatternsInput = z.infer<typeof AnalyzeConsumptionPatternsInputSchema>;

export const AnalyzeConsumptionPatternsOutputSchema = z.object({
    predictionAlertBody: z.string().optional().describe("A high-confidence prediction about likely future waste, if any is detected."),
    keyObservation: z.string().describe("A brief, one-sentence summary of the most significant pattern."),
    patternAlert: z.string().describe("A one-sentence description of a specific, recurring behavior."),
    smartTip: z.string().describe("A concrete, actionable tip to address the pattern."),
    smartShoppingPlan: z.string().describe("A concise, one-sentence shopping tip related to the analysis."),
    // Deep dive fields
    whatsReallyHappening: z.string().describe("A detailed explanation of what is happening, citing specific data from user logs."),
    whyThisPatternExists: z.string().describe("The AI's analysis of the root cause of this behavior pattern."),
    financialImpact: z.string().describe("The estimated financial cost of this pattern (e.g., '₱180 in vegetables wasted over 4 weekends')."),
    solutions: z.array(
        z.object({
            solution: z.string().describe("A specific, actionable solution to address the pattern."),
            successRate: z.number().min(0).max(1).describe("The estimated success rate of this solution (e.g., 0.75 for 75%)."),
            estimatedSavings: z.number().optional().describe("The estimated financial savings in PHP if the user follows this solution."),
        })
    ).describe("A list of 3-4 actionable alternative solutions."),
    similarUserStory: z.string().describe("An encouraging story about similar users (e.g., 'Users who fixed this pattern typically saved ₱200/month')."),
});
export type AnalyzeConsumptionPatternsOutput = z.infer<typeof AnalyzeConsumptionPatternsOutputSchema>;


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
