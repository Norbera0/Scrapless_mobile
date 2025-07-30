
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
  prompt: `You are a data analyst for Scrapless, a food waste reduction app for users in the Philippines. Your task is to analyze a user's food consumption and waste data to provide one clear, actionable, and detailed insight package.

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
Analyze all the provided data. Based on the analysis, provide a single, impactful insight package.

**Insight Package Components:**
1.  **predictionAlertBody (Optional)**: If you detect a very strong, high-confidence pattern about likely imminent waste, formulate a predictive alert. For example: "Based on your pattern, you'll likely waste vegetables this weekend. You've done this 3 of the last 4 weekends." If no high-confidence prediction is possible, leave this field blank.
2.  **keyObservation**: A brief, one-sentence summary of the most significant pattern you found. (e.g., "You're on track to reduce waste this month!" or "Your biggest source of waste is vegetables that spoil.").
3.  **patternAlert**: A one-sentence description of a specific, recurring behavior that leads to waste. (e.g., "You frequently waste vegetables bought on weekends.").
4.  **smartTip**: A concrete, actionable tip to address the pattern. (e.g., "Try buying vegetables twice a week in smaller amounts instead of a large haul on Saturdays.").
5.  **whatsReallyHappening**: A detailed, 1-2 sentence explanation of the pattern, citing specific data. (e.g., "Over the last 4 weekends, your logs show you wasted kangkong, pechay, and tomatoes that were purchased on Friday or Saturday.").
6.  **whyThisPatternExists**: Your analysis of the likely root cause. (e.g., "This often happens because weekend meal plans change unexpectedly, causing fresh produce bought on Friday to sit unused until it's no longer fresh by Tuesday.").
7.  **financialImpact**: The estimated financial cost of this specific pattern. (e.g., "This pattern has led to an estimated ₱180 in vegetable waste over the past month.").
8.  **solutions**: A list of 3 actionable, alternative solutions. (e.g., [{solution: "Plan one specific weekend meal before shopping", successRate: 0.8}, {solution: "Store leafy greens in paper towels to extend freshness", successRate: 0.6}, {solution: "Buy pre-chopped veggies for one quick meal", successRate: 0.5}]).
9.  **similarUserStory**: An encouraging, relatable story. (e.g., "Many users who start planning just one weekend meal in advance cut their vegetable waste by 50% within a month!").

Keep the tone encouraging, positive, and helpful. Focus on the single most important pattern you can find. If there is not enough data, provide a generic welcome/encouragement message for all fields.
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
      const defaultMessage = "Welcome to Scrapless! Start logging your pantry and waste to get personalized insights.";
      return {
        keyObservation: defaultMessage,
        patternAlert: "The more you log, the smarter your insights will be.",
        smartTip: "Try logging your first item today to see how it works!",
        whatsReallyHappening: "Once you start logging, I can show you exactly what's happening in your kitchen.",
        whyThisPatternExists: "I'm ready to find the 'why' behind your food waste patterns.",
        financialImpact: "Unlock insights into how much money you can save.",
        solutions: [
            { solution: "Log your first grocery trip.", successRate: 0.9 },
            { solution: "Log any food you throw away this week.", successRate: 0.9 }
        ],
        similarUserStory: "Users who log consistently for two weeks are often surprised by what they discover!",
      };
    }

    const { output } = await prompt(input);
    
    if (!output) {
        const errorMessage = "Start logging to unlock powerful insights about your food habits.";
        return {
            keyObservation: errorMessage,
            patternAlert: "We need a bit more data to identify your unique patterns.",
            smartTip: "Log your next grocery trip or any food waste to begin your analysis.",
            whatsReallyHappening: "I'm standing by to analyze your data as soon as it comes in.",
            whyThisPatternExists: "Your food habits hold the key to reducing waste.",
            financialImpact: "Let's find out how much you can save together.",
            solutions: [
                { solution: "Add items to your virtual pantry.", successRate: 0.9 },
                { solution: "Use the camera or voice log to record waste.", successRate: 0.9 }
            ],
            similarUserStory: "The first step to reducing waste is knowing what you waste. You're on the right track!",
        };
    }
    
    return output;
  }
);
