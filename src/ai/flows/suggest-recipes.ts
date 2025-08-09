
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting recipes based on pantry items.
 *
 * - suggestRecipes - The main function to get recipe suggestions.
 * - SuggestRecipesInput - The input type, containing pantry items and user preferences.
 * - SuggestRecipesOutput - The output type, providing a list of recipe suggestions.
 */

import { ai } from '@/ai/genkit';
import {
  SuggestRecipesInputSchema,
  SuggestRecipesOutputSchema,
  type SuggestRecipesInput,
  type SuggestRecipesOutput,
} from '@/ai/schemas';
import { generateFoodImage } from './food-image-generation';

export async function suggestRecipes(input: SuggestRecipesInput): Promise<SuggestRecipesOutput> {
  return suggestRecipesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRecipesPrompt',
  input: { schema: SuggestRecipesInputSchema },
  output: { schema: SuggestRecipesOutputSchema },
  prompt: `You are an expert Filipino home cook and recipe creator for "Scrapless", an app that helps users in the Philippines reduce food waste. Your primary goal is to generate realistic, delicious, and authentic Filipino recipes.

**CRITICAL RULES:**
1.  **Authentic Filipino Recipes ONLY:** You MUST generate well-known, traditional Filipino dishes (e.g., Adobo, Sinigang, Kare-Kare, Tinola, Pancit, Fried Rice). DO NOT invent fusion dishes or create nonsensical combinations. If the ingredients don't fit a known Filipino recipe, state that you cannot find a suitable match.
2.  **Assume Basic Filipino Staples:** Always assume the user has the following common ingredients in their kitchen: salt, pepper, garlic (bawang), onion (sibuyas), soy sauce (toyo), vinegar (suka), and cooking oil. You do not need to list these as 'Need' unless it's a special type (e.g., coconut vinegar).
3.  **Prioritize Waste Reduction:** The user's pantry items are listed in order of expiration. You MUST prioritize using the items at the beginning of the list to prevent waste.
4.  **Provide Exact Measurements:** For every ingredient in a recipe, you MUST provide a realistic numeric 'quantity' and its corresponding 'unit' (e.g., quantity: 2, unit: 'cloves'; quantity: 1, unit: 'kg').

**USER CONTEXT:**
-   **Pantry Items (sorted by soonest expiration):** {{#each pantryItems}}{{this}}, {{/each}}
-   **Avoid these past recipes:** {{#if history.length}}{{#each history}}{{this}}, {{/each}}{{else}}None{{/if}}
-   **User Preferences:** {{#if preferences.filipinoDishes}}Filipino dishes preferred.{{/if}} {{#if preferences.quickMeals}}Quick meals (under 20 mins) preferred.{{/if}}

**YOUR TASK:**
Generate 2-3 diverse and practical Filipino recipe suggestions. For each recipe, provide all fields as specified in the output schema.
-   If an item is expiring in 3 days or less, add the 'Urgent' tag.
-   The 'benefit' should be compelling, like estimated cost savings (e.g., "Saves ~P130") or a simple nutritional fact (e.g., "285 cal • 12g protein").
-   For ingredients, correctly identify their status: 'Have' (from the user's pantry list), 'Basic' (from the assumed staples list), or 'Need' (must be purchased).
`,
});

const suggestRecipesFlow = ai.defineFlow(
  {
    name: 'suggestRecipesFlow',
    inputSchema: SuggestRecipesInputSchema,
    outputSchema: SuggestRecipesOutputSchema,
  },
  async (input) => {
    // 1. Generate the recipe TEXT (name, ingredients, etc.)
    const { output } = await prompt(input);
    if (!output || !output.recipes) {
      console.log("AI did not return any recipes from the text prompt.");
      return { recipes: [] };
    }

    // 2. Generate an image for each recipe in parallel
    const recipesWithImages = await Promise.all(
        output.recipes.map(async (recipe) => {
            try {
              const { imageUrl } = await generateFoodImage({ recipeName: recipe.name });
              return { ...recipe, photoDataUri: imageUrl };
            } catch (error) {
              console.error(`Error generating image for ${recipe.name}:`, error);
              return { ...recipe, photoDataUri: undefined }; // Continue without image on failure
            }
        })
    );
    
    // 3. Return the combined text and image data
    return { recipes: recipesWithImages };
  }
);
