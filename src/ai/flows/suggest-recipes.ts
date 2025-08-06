
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
  prompt: `You are an AI recipe assistant for "Scrapless", an app that helps users in the Philippines reduce food waste. Your goal is to suggest delicious and practical recipes based on the user's pantry items.

**CONTEXT:**
- Pantry Items: {{#each pantryItems}}{{this}}, {{/each}}
- Assume user has basics: salt, pepper, oil, garlic, onion.
- Avoid these past recipes: {{#if history}}{{#each history}}{{this}}, {{/each}}{{else}}None{{/if}}
- User Preferences: {{#if preferences.filipinoDishes}}Filipino dishes preferred.{{/if}} {{#if preferences.quickMeals}}Quick meals (under 20 mins) preferred.{{/if}}

**TASK:**
Generate 3 to 5 diverse recipe suggestions. For each recipe, provide all fields as specified in the output schema.
- **Prioritize recipes using items expiring soonest.** The 'pantryItems' list is pre-sorted by expiration.
- If an item is expiring in 3 days or less, add the 'Urgent' tag.
- The 'benefit' can be estimated cost savings (e.g., "Saves ~P130") OR nutritional info (e.g., "285 cal • 12g protein").
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
