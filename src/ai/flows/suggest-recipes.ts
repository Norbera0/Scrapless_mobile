
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
        console.log(`🖼️ Generating image for: ${recipeName}`);
        const result = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: `A delicious-looking photo of ${recipeName}, professionally shot for a cookbook, vibrant and appetizing.`,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });
        
        console.log('🖼️ Full result:', result);
        console.log('🖼️ Result keys:', Object.keys(result));
        console.log('🖼️ Media:', result.media);
        
        // Try different possible structures
        const possibleUrls = [
            result.media?.url,
            result.media?.[0]?.uri,
            result.media?.[0]?.url,
            result.output?.media?.url,
            result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
        ];
        
        console.log('🖼️ Possible URLs:', possibleUrls);
        
        // Return the first non-undefined URL
        return possibleUrls.find(url => url !== undefined);
        
    } catch (error) {
        console.error(`❌ Failed to generate image for ${recipeName}:`, error);
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
1.  **Pantry Items & Expiration:** The user has the following items in their pantry (item name, estimated days until expiration):
    {{#each pantryItems}}
    - {{{this}}}
    {{/each}}

2.  **Assumed Basic Ingredients:** Assume the user always has: salt, pepper, cooking oil, garlic, and onion. Mark these as 'Basic'.
3.  **Recipe Logic:**
    - Each recipe must use at least ONE of the provided pantry items.
    - **Prioritize recipes that use items expiring soon.**
    - Focus on recipes with 5-8 total ingredients and a 15-45 minute cooking time.
    - Avoid suggesting recipes from the user's history: {{#if history}}{{#each history}}{{{this}}}{{/each}}{{else}}None{{/if}}

**User Preferences (Optional):**
- Quick Meals (15 mins or less): {{#if preferences.quickMeals}}Yes{{else}}No{{/if}}
- Filipino Dishes: {{#if preferences.filipinoDishes}}Yes{{else}}No{{/if}}
- Cooking Difficulty: {{preferences.difficulty}}

**Your Task:**
Generate 3 to 5 diverse recipe suggestions. For each recipe, provide all fields as specified in the output schema.

- **tags**: If the recipe uses an item expiring in 3 days or less, add the tag 'Urgent'. Add other relevant tags like 'Quick', 'Healthy', 'Filipino'.
- **benefit**: Provide a compelling benefit. This can be the estimated cost saved by using expiring items (e.g., "Saves ~P130 from waste") OR nutritional information (e.g., "285 cal • 12g protein"). Be creative and relevant.
- **servings**: Estimate the number of servings the recipe makes.
`,
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
