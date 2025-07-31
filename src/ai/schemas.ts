
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
        estimatedAmount: z.string().describe('The estimated amount of the food item (e.g., 1 kg, 2 pcs, 1 box).'),
        estimatedExpirationDate: z.string().describe("The estimated expiration date in ISO 8601 format (YYYY-MM-DD)."),
        carbonFootprint: z.number().optional().describe("The estimated carbon footprint in kg CO2e."),
        estimatedCost: z.number().optional().describe("The estimated cost of the item in PHP."),
      })
    ).describe('A list of detected food items, their amounts, and estimated expiration dates.'),
});
export type LogPantryItemOutput = z.infer<typeof LogPantryItemOutputSchema>;

// Recipe Schemas
export const SuggestRecipesInputSchema = z.object({
    pantryItems: z.array(z.string()).describe("A list of food items currently in the user's pantry."),
    preferences: z.object({
        quickMeals: z.boolean().optional().describe("Filter for meals that take 15 minutes or less to cook."),
        filipinoDishes: z.boolean().optional().describe("Filter for Filipino cuisine."),
        difficulty: z.enum(['beginner', 'intermediate', 'experienced']).optional().describe("The user's cooking skill level."),
    }).optional(),
    history: z.array(z.string()).optional().describe("A list of recipe names that have been suggested recently to avoid duplicates."),
});
export type SuggestRecipesInput = z.infer<typeof SuggestRecipesInputSchema>;

export const SuggestRecipesOutputSchema = z.object({
    recipes: z.array(
        z.object({
            name: z.string().describe("The name of the recipe."),
            cuisine: z.string().describe("The type of cuisine (e.g., Filipino, Italian, Mexican)."),
            difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The cooking difficulty of the recipe."),
            cookingTime: z.string().describe("The estimated cooking time (e.g., '30 min')."),
            ingredients: z.array(
                z.object({
                    name: z.string().describe("The name of the ingredient."),
                    status: z.enum(['Have', 'Basic', 'Need']).describe("The status of the ingredient: 'Have' (in pantry), 'Basic' (assumed available like oil/salt), or 'Need' (must be purchased)."),
                    estimatedCost: z.number().optional().describe("The estimated cost in PHP if the ingredient status is 'Need'."),
                })
            ),
            instructions: z.array(z.string()).describe("A list of step-by-step cooking instructions."),
            photoDataUri: z.string().optional().describe("A data URI of a generated image of the recipe."),
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
        })
    ).describe("A list of 3-4 actionable alternative solutions."),
    similarUserStory: z.string().describe("An encouraging story about similar users (e.g., 'Users who fixed this pattern typically saved ₱200/month')."),
});
export type AnalyzeConsumptionPatternsOutput = z.infer<typeof AnalyzeConsumptionPatternsOutputSchema>;


// Shopping Recommendations Schemas
export const GenerateShoppingRecommendationsInputSchema = z.object({
    userName: z.string(),
    pantryItems: z.array(z.any()),
    wasteLogs: z.array(z.any()),
    topWastedCategory: z.string(),
});
export type GenerateShoppingRecommendationsInput = z.infer<typeof GenerateShoppingRecommendationsInputSchema>;

export const GenerateShoppingRecommendationsOutputSchema = z.object({
    shoppingIntelligence: z.object({
        shoppingPattern: z.string(),
        topOptimizationCategory: z.string(),
        estimatedMonthlySavings: z.number(),
    }),
    recommendations: z.array(
        z.object({
            itemName: z.string(),
            currentBehavior: z.string(),
            optimalBehavior: z.string(),
            savingsOrResult: z.string(),
        })
    ),
});
export type GenerateShoppingRecommendationsOutput = z.infer<typeof GenerateShoppingRecommendationsOutputSchema>;
