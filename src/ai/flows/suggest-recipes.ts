
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

export async function suggestRecipes(input: SuggestRecipesInput): Promise<SuggestRecipesOutput> {
  return suggestRecipesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRecipesPrompt',
  input: { schema: SuggestRecipesInputSchema },
  output: { schema: SuggestRecipesOutputSchema },
  prompt: `You are an AI recipe assistant for "Scrapless", an app that helps users in the Philippines reduce food waste. Your goal is to suggest delicious and practical recipes based on the user's pantry items.

**Analysis Criteria:**
1.  **Pantry Items:** The user has the following items in their pantry:
    {{#each pantryItems}}
    - {{{this}}}
    {{/each}}

2.  **Assumed Basic Ingredients:** Assume the user always has the following basic household items: salt, pepper, cooking oil, garlic, and onion. Mark these as 'Basic'.
3.  **Needed Ingredients:** You can include a few extra common ingredients that are easily available in a typical Filipino grocery store. Keep the cost of these 'Need' ingredients low (ideally under 50 PHP total per recipe).
4.  **Recipe Constraints:**
    - Each recipe must use at least ONE of the provided pantry items.
    - Prioritize recipes with 5-8 total ingredients.
    - Focus on recipes with a 15-45 minute cooking time.
    - Avoid suggesting recipes from the user's history: {{#if history}}{{#each history}}{{{this}}}{{/each}}{{else}}None{{/if}}

**User Preferences (Optional):**
- Quick Meals (15 mins or less): {{#if preferences.quickMeals}}Yes{{else}}No{{/if}}
- Filipino Dishes: {{#if preferences.filipinoDishes}}Yes{{else}}No{{/if}}
- Cooking Difficulty: {{preferences.difficulty}}

**Your Task:**
Generate 3 to 5 diverse recipe suggestions that fit these criteria. For each recipe, provide the name, cuisine, difficulty, cooking time, a list of ingredients with their status ('Have', 'Basic', 'Need'), and step-by-step instructions.`,
});

const suggestRecipesFlow = ai.defineFlow(
  {
    name: 'suggestRecipesFlow',
    inputSchema: SuggestRecipesInputSchema,
    outputSchema: SuggestRecipesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !output.recipes) {
      return { recipes: [] };
    }

    // Generate images for each recipe in parallel
    const recipesWithImages = await Promise.all(
        output.recipes.map(async (recipe) => {
            const photoDataUri = await generateRecipeImage(recipe.name);
            return { ...recipe, photoDataUri };
        })
    );

    return { recipes: recipesWithImages };
  }
);
