
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
  prompt: `You are an expert Filipino home cook and recipe creator for "Scrapless", an app that helps users in the Philippines reduce food waste. Your primary goal is to generate realistic, delicious, and authentic Filipino recipes based *strictly* on the ingredients provided.

**CRITICAL RULES:**
1.  **Use Pantry Items ONLY:** You MUST generate recipes using only the ingredients available in the user's pantry. Do NOT suggest recipes that require ingredients not listed in the pantry, unless they are "Basic Staples".
2.  **Respect Quantities:** The user's pantry items have specific quantities and units. You MUST NOT create a recipe that requires more of an ingredient than is available. For example, if the user has "2 eggs", you cannot suggest a recipe that needs "3 eggs".
3.  **Use Exact Units:** For all ingredients with status 'Have', you MUST use the exact 'unit' provided in the pantry list for that ingredient in your recipe output. For example, if the pantry has "1 dozen eggs", your recipe ingredient must also use the unit "dozen".
4.  **Authentic Filipino Recipes ONLY:** Generate well-known, traditional Filipino dishes (e.g., Adobo, Sinigang, Omelette, Fried Rice). Do NOT invent fusion dishes. If the ingredients don't fit a known Filipino recipe, state that you cannot find a suitable match.
5.  **Assume Basic Filipino Staples:** You can assume the user has salt, pepper, garlic (bawang), onion (sibuyas), soy sauce (toyo), vinegar (suka), and cooking oil. Mark these with status 'Basic'. You do not need to list these as 'Need'.
6.  **Prioritize Waste Reduction:** The user's pantry items are sorted by expiration. Prioritize using items near the top of the list.

**USER CONTEXT:**
-   **Pantry Items (Name, Quantity, Unit):** 
    {{#each pantryItems}}
        - {{this.name}} ({{this.quantity}} {{this.unit}})
    {{/each}}
-   **User Preferences:** {{#if preferences.filipinoDishes}}Filipino dishes preferred.{{/if}} {{#if preferences.quickMeals}}Quick meals (under 20 mins) preferred.{{/if}}

**YOUR TASK:**
Generate 2-3 diverse and practical Filipino recipe suggestions. For each recipe, provide all fields as specified in the output schema.
-   The 'benefit' should be compelling, like estimated cost savings (e.g., "Saves ~P130") or a simple nutritional fact (e.g., "285 cal • 12g protein").
-   For ingredients, correctly identify their status: 'Have' (from the user's pantry list), 'Basic' (from the assumed staples list), or 'Need' (must be purchased - AVOID THIS unless absolutely necessary for a core recipe).
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
