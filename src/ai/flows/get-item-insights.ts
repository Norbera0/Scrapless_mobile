
'use server';

/**
 * @fileOverview This file defines a Genkit flow for getting specific insights for a single pantry item.
 *
 * - getItemInsights - The main function to get item-specific advice.
 * - GetItemInsightsInput - The input type.
 * - GetItemInsightsOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import {
    GetItemInsightsInputSchema,
    GetItemInsightsOutputSchema,
    type GetItemInsightsInput,
    type GetItemInsightsOutput,
} from '@/ai/schemas';

async function generateRecipeImage(recipeName: string): Promise<string | undefined> {
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: `A delicious-looking photo of ${recipeName}, professionally shot for a cookbook, vibrant and appetizing.`,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });
        return media?.url;
    } catch (error) {
        console.error(`Failed to generate image for ${recipeName}:`, error);
        return undefined;
    }
}

export async function getItemInsights(input: GetItemInsightsInput): Promise<GetItemInsightsOutput> {
  return getItemInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getItemInsightsPrompt',
  input: { schema: GetItemInsightsInputSchema },
  output: { schema: GetItemInsightsOutputSchema },
  prompt: `You are an AI assistant for "Scrapless", an app helping users in the Philippines reduce food waste.
For the following food item, provide practical advice tailored to a Filipino household.

**Food Item Details:**
- Name: {{name}}
- Amount: {{estimatedAmount}}
- Estimated Expiration: {{estimatedExpirationDate}}
- Estimated Cost: ₱{{estimatedCost}}

**Your Task:**
Generate a concise and helpful insight package for this single item.

1.  **Storage Optimization Tip (storageTip)**: Provide one clear, actionable tip on how to best store this specific item to maximize its freshness, considering a typical Filipino kitchen environment.
2.  **Waste Prevention Tip (wastePreventionTip)**: Give one smart, actionable tip on how to use this item up before it spoils. Be encouraging and focus on the positive outcome (e.g., saving money).
3.  **Recipe Ideas (recipes)**: Suggest 2-3 simple and practical recipes that prominently feature this item. The recipes should be easy to make and suitable for Filipino tastes. For each recipe, provide the name, a brief description, difficulty, and cooking time.
`,
});

const getItemInsightsFlow = ai.defineFlow(
  {
    name: 'getItemInsightsFlow',
    inputSchema: GetItemInsightsInputSchema,
    outputSchema: GetItemInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate insights for the item.");
    }

    if (output.recipes && output.recipes.length > 0) {
        // Generate images for each recipe in parallel
        const recipesWithImages = await Promise.all(
            output.recipes.map(async (recipe) => {
                const photoDataUri = await generateRecipeImage(recipe.name);
                return { ...recipe, photoDataUri };
            })
        );
        output.recipes = recipesWithImages;
    }

    return output;
  }
);
