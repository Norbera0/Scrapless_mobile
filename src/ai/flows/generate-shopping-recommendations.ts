
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating smart shopping recommendations.
 *
 * - generateShoppingRecommendations - The main function to get shopping advice.
 * - GenerateShoppingRecommendationsInput - The input type.
 * - GenerateShoppingRecommendationsOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import {
    GenerateShoppingRecommendationsInputSchema,
    GenerateShoppingRecommendationsOutputSchema,
    type GenerateShoppingRecommendationsInput,
    type GenerateShoppingRecommendationsOutput,
} from '@/ai/schemas';

export async function generateShoppingRecommendations(input: GenerateShoppingRecommendationsInput): Promise<GenerateShoppingRecommendationsOutput> {
  return generateShoppingRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShoppingRecommendationsPrompt',
  input: { schema: GenerateShoppingRecommendationsInputSchema },
  output: { schema: GenerateShoppingRecommendationsOutputSchema },
  prompt: `You are a shopping optimization analyst for Scrapless, a food waste reduction app. Your task is to analyze a user's pantry, waste, and purchase history to provide smart shopping recommendations.

CONTEXT DATA:
- User Name: {{userName}}
- Pantry Items: {{pantryItems.length}} items
- Recent Waste Logs (last 30 days): {{wasteLogs.length}} logs
- Top Wasted Item Category: {{topWastedCategory}}

YOUR TASK:
Analyze the provided data to generate a "Shopping Intelligence" summary and a list of 3-5 "Active Recommendations".

**Shopping Intelligence Components:**
1.  **shoppingPattern**: A brief summary of the user's shopping behavior (e.g., "Weekly on Sundays, avg. spend ₱1200"). If not enough data, use a generic phrase like "Weekly shopping trips".
2.  **topOptimizationCategory**: The food category with the most potential for savings (e.g., "Vegetables", "Dairy").
3.  **estimatedMonthlySavings**: The total estimated monthly savings in PHP if the user follows all recommendations.

**Active Recommendations Components (3-5 items):**
For each recommendation, provide:
1.  **itemName**: The name of the food item or category (e.g., "Tomatoes", "Leafy Vegetables", "Shopping Frequency").
2.  **currentBehavior**: What the user is currently doing (e.g., "Buying 6 pieces weekly").
3.  **optimalBehavior**: What the user should do instead (e.g., "Buy 4 pieces weekly").
4.  **savingsOrResult**: The specific outcome, like "Saves ~₱80/month" or "50% less spoilage".

Example Recommendation:
- itemName: "Tomatoes"
- currentBehavior: "Buying 6 pieces weekly"
- optimalBehavior: "Buy 4 pieces weekly"
- savingsOrResult: "Saves ~₱80/month"

Focus on concrete, quantifiable advice. If there's not enough data, provide sensible, generic startup recommendations like buying versatile ingredients or checking the pantry before shopping.
`,
});


const generateShoppingRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateShoppingRecommendationsFlow',
    inputSchema: GenerateShoppingRecommendationsInputSchema,
    outputSchema: GenerateShoppingRecommendationsOutputSchema,
  },
  async (input) => {
    // Handle cases with insufficient data by providing generic advice
    if (input.wasteLogs.length === 0 && input.pantryItems.length === 0) {
      return {
        shoppingIntelligence: {
            shoppingPattern: "Just starting out!",
            topOptimizationCategory: "Fresh Produce",
            estimatedMonthlySavings: 0,
        },
        recommendations: [
            {
                itemName: "Pantry Check",
                currentBehavior: "Guessing what you need at the store.",
                optimalBehavior: "Check your pantry & fridge before you shop.",
                savingsOrResult: "Prevents buying duplicates."
            },
            {
                itemName: "Shopping List",
                currentBehavior: "Shopping without a plan.",
                optimalBehavior: "Make a list based on planned meals.",
                savingsOrResult: "Reduces impulse buys and potential waste."
            },
            {
                itemName: "Versatile Ingredients",
                currentBehavior: "Buying specialty items for one recipe.",
                optimalBehavior: "Start with ingredients you can use in many dishes.",
                savingsOrResult: "Ensures all your food gets used."
            }
        ]
      };
    }

    const { output } = await prompt(input);
    
    if (!output) {
      throw new Error("Failed to generate shopping recommendations.");
    }
    
    return output;
  }
);
