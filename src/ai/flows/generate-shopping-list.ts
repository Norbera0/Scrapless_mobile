
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a smart shopping list.
 *
 * - generateShoppingList - The main function to create a shopping list.
 * - GenerateShoppingListInput - The input type.
 * - GenerateShoppingListOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateShoppingListInputSchema,
  GenerateShoppingListOutputSchema,
  type GenerateShoppingListInput,
  type GenerateShoppingListOutput,
} from '@/ai/schemas';

export async function generateShoppingList(input: GenerateShoppingListInput): Promise<GenerateShoppingListOutput> {
  return generateShoppingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShoppingListPrompt',
  input: { schema: GenerateShoppingListInputSchema },
  output: { schema: GenerateShoppingListOutputSchema },
  prompt: `You are a Filipino household shopping expert and a BPI deal-finder for "Scrapless," a food waste reduction app. Your task is to generate a smart, data-driven shopping list for a user, embedding relevant BPI deals.

**CONTEXTUAL DATA:**
- **Pantry Items (Name, Quantity, Expiry):** {{#each pantryItems}}{{this.name}} ({{this.quantity}} {{this.unit}}, expires {{this.estimatedExpirationDate}}), {{/each}}
- **Waste Logs (last 60 days):** {{#each wasteLogs}}{{#each this.items}}{{this.name}} ({{this.estimatedAmount}}), {{/each}}{{/each}}

**PART 1: SHOPPING LIST GENERATION RULES:**
1.  **ESSENTIAL STAPLES ('staple' category, 'essential' priority):**
    -   Always include if not in pantry or running low: Rice, eggs, cooking oil, onions, garlic, salt.
    -   Reasoning: "A Filipino kitchen essential."

2.  **DATA-DRIVEN ITEMS ('data_driven' category, 'recommended' priority):**
    -   Add items the user has consumed in the past but hasn't wasted.
    -   Reasoning: "Based on your history, you use this item effectively."

3.  **LOW STOCK REPLENISHMENT ('low_stock' category, 'recommended' priority):**
    -   Add items from the pantry that are running low and have a low waste history.
    -   Reasoning: "You're running low on this item which you use frequently."

4.  **COMPLEMENTARY SUGGESTIONS ('complementary' category, 'recommended' priority):**
    -   Suggest items that go well with the user's existing pantry and habits.
    -   Example: If they have pasta, suggest tomato sauce. If they buy chicken, suggest marinade ingredients.
    -   Reasoning: e.g., "Goes well with the pasta in your pantry."

5.  **NEVER SUGGEST:**
    -   Items with a high waste rate (>50% of the time it's logged, it's wasted).
    -   Items wasted multiple times recently.
    -   Expensive, highly perishable items unless the user has a history of successfully consuming them.

**PART 2: "OH MY DEALS!" BPI DEAL INTEGRATION:**
For some of the generated items, find and embed a relevant BPI deal. Make the deals realistic for a Filipino context.

-   **DEAL CHANCE:** Do not add a deal to every item. Apply deals to 2-3 items in the list where it makes the most sense.
-   **DEAL STRUCTURE:** If you add a deal, you **MUST** populate all fields in the optional 'deal' object:
    -   `dealType`: 'cashback', 'bogo' (Buy One Get One), 'points', or 'green'.
    -   `icon`: 'bpi' for credit card, 'vybe' for QR payment, 'green_partner' for ESG deals.
    -   `title`: A catchy title like "BPI Deal Alert!" or "BPI Rewards Boost!".
    -   `merchant`: A realistic PH merchant (e.g., Robinsons Supermarket, Landmark, S&R).
    -   `description`: The core offer (e.g., "15% Cashback", "Buy 1, Get 1 Free").
    -   `terms`: (Optional) Concise terms (e.g., "Valid until Aug 31. Min. spend ₱2,000").
    -   `estimatedSavings`: The tangible value to the user (e.g., "~₱57.00", "~25 Bonus Points", "Free Reusable Bag").

-   **EXAMPLE DEAL (for Chicken Breast):**
    -   `dealType`: 'cashback'
    -   `icon`: 'bpi'
    -   `title`: "BPI Deal Alert!"
    -   `merchant`: "Robinsons Supermarket"
    -   `description`: "15% Cashback"
    -   `terms`: "when you pay with your BPI Credit Card. (Valid until Aug 31. Min. spend ₱2,000)"
    -   `estimatedSavings`: "~₱57.00"

**OUTPUT FORMATTING:**
-   For each item, provide a unique ID, name, category, quantity, estimated cost in PHP, priority, and clear reasoning.
-   If applicable, add a complete 'deal' object to the item.
-   Calculate the total estimated cost of the entire list.
-   Provide a summary of the data used for generation.
`,
});

const generateShoppingListFlow = ai.defineFlow(
  {
    name: 'generateShoppingListFlow',
    inputSchema: GenerateShoppingListInputSchema,
    outputSchema: GenerateShoppingListOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate shopping list.');
    }
    // Set default isChecked/isPurchased values
    const itemsWithDefaults = output.items.map(item => ({
        ...item,
        isChecked: false,
        isPurchased: false
    }));
    
    return { ...output, items: itemsWithDefaults };
  }
);
