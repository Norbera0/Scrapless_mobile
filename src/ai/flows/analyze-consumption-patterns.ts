
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing user consumption patterns.
 *
 * - analyzeConsumptionPatterns - The main function to get user insights.
 * - AnalyzeConsumptionPatternsInput - The input type.
 * - AnalyzeConsumptionPatternsOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeConsumptionPatternsInputSchema,
  AnalyzeConsumptionPatternsOutputSchema,
  type AnalyzeConsumptionPatternsInput,
  type AnalyzeConsumptionPatternsOutput,
} from '@/ai/schemas';

export async function analyzeConsumptionPatterns(input: AnalyzeConsumptionPatternsInput): Promise<AnalyzeConsumptionPatternsOutput> {
  return analyzeConsumptionPatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeConsumptionPatternsPrompt',
  input: { schema: AnalyzeConsumptionPatternsInputSchema },
  output: { schema: AnalyzeConsumptionPatternsOutputSchema },
  prompt: `You are a data analyst for Scrapless, a food waste reduction app for users in the Philippines. Your task is to analyze a user's food consumption, waste, and financial data to provide one clear, actionable, and detailed insight package.

CONTEXT DATA:
- User Name: {{userName}}
- Pantry Items:
{{#if pantryItems.length}}
  {{#each pantryItems}}
  - {{this.name}} (expires ~{{this.estimatedExpirationDate}})
  {{/each}}
{{else}}
  - The pantry is empty.
{{/if}}
- Recent Waste Logs (last 30 days):
{{#if wasteLogs.length}}
  {{#each wasteLogs}}
  - Wasted {{#each this.items}}{{this.estimatedAmount}} of {{this.name}}, {{/each}} because "{{this.sessionWasteReason}}" on {{this.date}}
  {{/each}}
{{else}}
  - No waste logged.
{{/if}}
{{#if bpiTrackPlanData}}
- BPI Track & Plan Data (Financial Context):
  {{#if bpiTrackPlanData.spendingCategories}}
    - Grocery Spending: ~₱{{#each bpiTrackPlanData.spendingCategories}}{{#if (eq this.category "Groceries")}}{{this.amount}}{{/if}}{{/each}} ({{#each bpiTrackPlanData.spendingCategories}}{{#if (eq this.category "Groceries")}}{{this.trend}}{{/if}}{{/each}})
  {{/if}}
  {{#if bpiTrackPlanData.cashFlowAlert}}
    - Cash Flow Alert: "{{bpiTrackPlanData.cashFlowAlert}}"
  {{/if}}
  {{#if bpiTrackPlanData.unusualTransactions}}
    - Unusual Transactions Noted: {{#each bpiTrackPlanData.unusualTransactions}}"{{this}}", {{/each}}
  {{/if}}
{{/if}}

YOUR TASK:
Analyze all the provided data. If BPI data is present, you MUST integrate it into your analysis to provide richer, more contextual insights. Based on the analysis, provide a single, impactful insight package.

**Insight Package Components:**
1.  **predictionAlertBody (Optional)**: If you detect a strong pattern (e.g., high grocery spend + high waste), formulate a predictive alert. Example: "BPI data shows high grocery spending on Fridays, and your logs show you often waste vegetables bought then. You might waste ₱150-₱200 this weekend."
2.  **keyObservation**: A brief, one-sentence summary of the most significant pattern. (e.g., "Your grocery spending trend on BPI matches your vegetable waste pattern.").
3.  **patternAlert**: A one-sentence description of a specific, recurring behavior. (e.g., "You frequently waste vegetables bought during periods of high grocery spending.").
4.  **smartTip**: A concrete, actionable tip to address the pattern. If BPI data is available, make the tip financially oriented. (e.g., "Try setting a grocery budget alert in your BPI app before your weekend shop.").
5.  **smartShoppingPlan**: A concise, one-sentence shopping tip. (e.g., "Your BPI data suggests a ₱1500 grocery budget. Stick to it by buying just enough for 2-3 meals.").
6.  **whatsReallyHappening**: A detailed, 1-2 sentence explanation of the pattern, citing specific data from user logs and BPI data if available. (e.g., "BPI shows your grocery spending jumped 15% this month, and your waste logs show a corresponding increase in spoiled kangkong and tomatoes.").
7.  **whyThisPatternExists**: Your analysis of the likely root cause. (e.g., "This often happens when high 'impulse' spending at the grocery store isn't backed by a solid meal plan, leading to unused items.").
8.  **financialImpact**: The estimated financial cost of this specific pattern. (e.g., "This pattern has led to an estimated ₱180 in vegetable waste over the past month.").
9.  **solutions**: A list of 3 actionable, alternative solutions. If BPI data is present, include a BPI-related solution. For each, provide a description, success rate, and estimated savings. (e.g., [{solution: "Set a BPI spending alert for 'Groceries' category", successRate: 0.8, estimatedSavings: 100}]).
10. **similarUserStory**: An encouraging, relatable story.

Keep the tone encouraging, positive, and helpful. Focus on the single most important pattern you can find. If there is not enough data, provide a generic welcome/encouragement message for all fields.
`,
});

const generateDefaultInsight = (): AnalyzeConsumptionPatternsOutput => {
    const errorMessage = "Start logging to unlock powerful insights about your food habits.";
    return {
        keyObservation: errorMessage,
        patternAlert: "We need a bit more data to identify your unique patterns.",
        smartTip: "Log your next grocery trip or any food waste to begin your analysis.",
        smartShoppingPlan: "Add items to your virtual pantry to get shopping recommendations.",
        whatsReallyHappening: "I'm standing by to analyze your data as soon as it comes in.",
        whyThisPatternExists: "Your food habits hold the key to reducing waste.",
        financialImpact: "Let's find out how much you can save together.",
        solutions: [
            { solution: "Add items to your virtual pantry.", successRate: 0.9 },
            { solution: "Use the camera or voice log to record waste.", successRate: 0.9 }
        ],
        similarUserStory: "The first step to reducing waste is knowing what you waste. You're on the right track!",
    };
};

const analyzeConsumptionPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeConsumptionPatternsFlow',
    inputSchema: AnalyzeConsumptionPatternsInputSchema,
    outputSchema: AnalyzeConsumptionPatternsOutputSchema,
  },
  async (input) => {
    // This check is the primary gate. If no items are in pantry AND no waste logs exist, return default.
    const hasData = (input.pantryItems && input.pantryItems.length > 0) || (input.wasteLogs && input.wasteLogs.length > 0);
    if (!hasData) {
        console.log("No data provided to analyze. Returning default insight.");
        return generateDefaultInsight();
    }
    
    try {
        const { output } = await prompt(input);
        
        // This is a secondary check. If the AI returns a null/empty output despite having data, fall back.
        if (!output || !output.keyObservation) {
            console.log("AI did not return a valid output despite having data. Returning default insight.");
            return generateDefaultInsight();
        }
        
        // If BPI data was used, enhance the solutions with a BPI-specific one if AI didn't add it.
        if (input.bpiTrackPlanData && output.solutions && !output.solutions.some(s => s.solution.toLowerCase().includes('bpi'))) {
            output.solutions.unshift({
                solution: "Set a budget alert for 'Groceries' in your BPI app.",
                successRate: 0.75,
                estimatedSavings: 150
            });
        }

        return output;

    } catch (error) {
        console.error("Error during AI prompt execution in analyzeConsumptionPatternsFlow:", error);
        // If any error occurs during the AI call itself, return the default insight.
        return generateDefaultInsight();
    }
  }
);
