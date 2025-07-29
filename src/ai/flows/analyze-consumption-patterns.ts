
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
  prompt: `You are a data analyst for Scrapless, a food waste reduction app for users in the Philippines. Your task is to analyze a user's food consumption and waste data to provide one clear, actionable insight.

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

YOUR TASK:
Analyze all the provided data. Based on the analysis, provide a single, impactful insight package with the following three parts:
1.  **Key Observation**: A brief, one-sentence summary of the most significant pattern you found. (e.g., "You're on track to reduce waste this month!" or "Your biggest source of waste is vegetables that spoil.").
2.  **Pattern Alert**: A one-sentence description of a specific, recurring behavior that leads to waste. (e.g., "You frequently waste vegetables bought on weekends.").
3.  **Smart Tip**: A concrete, actionable tip to address the pattern. (e.g., "Try buying vegetables twice a week in smaller amounts instead of a large haul on Saturdays.").

Keep the tone encouraging, positive, and helpful. Focus on the single most important pattern you can find. If there is not enough data, provide a generic welcome/encouragement message.
`,
});


const analyzeConsumptionPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeConsumptionPatternsFlow',
    inputSchema: AnalyzeConsumptionPatternsInputSchema,
    outputSchema: AnalyzeConsumptionPatternsOutputSchema,
  },
  async (input) => {
    // If there's no data, return a default message
    if (input.wasteLogs.length === 0 && input.pantryItems.length === 0) {
      return {
        keyObservation: "Welcome to Scrapless! Start logging your pantry and waste to get personalized insights.",
        patternAlert: "The more you log, the smarter your insights will be.",
        smartTip: "Try logging your first item today to see how it works!",
      };
    }

    const { output } = await prompt(input);
    
    if (!output) {
        return {
            keyObservation: "Start logging to unlock powerful insights about your food habits.",
            patternAlert: "We need a bit more data to identify your unique patterns.",
            smartTip: "Log your next grocery trip or any food waste to begin your analysis.",
          };
    }
    
    return output;
  }
);
