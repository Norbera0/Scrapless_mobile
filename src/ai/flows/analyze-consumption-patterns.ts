
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

const generateDefaultInsight = (): AnalyzeConsumptionPatternsOutput => {
    return {
        keyObservation: "Welcome to Scrapless Insights!",
        patternAlert: "Start by logging your food waste and pantry items.",
        smartTip: "The more you log, the smarter your insights will become. Try logging for a week to see your first patterns emerge.",
        smartShoppingPlan: "Let's build a shopping plan together once we have more data.",
        whatsReallyHappening: "Your personalized analysis will appear here once you've logged enough data.",
        whyThisPatternExists: "Discover the 'why' behind your food habits.",
        financialImpact: "Unlock insights into how much you can save.",
        solutions: [
            { solution: "Use the camera to log your next food waste.", successRate: 0.9 },
            { solution: "Add items to your virtual pantry.", successRate: 0.9 }
        ],
        similarUserStory: "Users who log consistently for a week often find their first 'aha!' moment. You're on the right track!",
    };
};


const prompt = ai.definePrompt({
  name: 'analyzeConsumptionPatternsPrompt',
  input: { schema: AnalyzeConsumptionPatternsInputSchema },
  output: { schema: AnalyzeConsumptionPatternsOutputSchema },
  prompt: `You are a data analyst for Scrapless, a food waste reduction app. Your task is to analyze a user's food consumption and waste data to provide one clear, actionable insight.

CONTEXT DATA:
- User Name: {{userName}}
- Recent Waste Logs (last 30 days):
{{#if wasteLogs.length}}
  {{#each wasteLogs}}
  - Wasted items on {{this.date}} because "{{this.sessionWasteReason}}"
  {{/each}}
{{else}}
  - No waste logged.
{{/if}}

YOUR TASK:
Analyze the provided data. Based on the analysis, provide a single, impactful insight package. Keep the tone encouraging, positive, and helpful.

**Insight Package Components:**
1.  **keyObservation**: A brief, one-sentence summary of the most significant pattern. (e.g., "You tend to waste vegetables bought on weekends.").
2.  **smartTip**: A concrete, actionable tip to address the pattern. (e.g., "Try buying vegetables twice a week instead of in one large batch.").
3.  **financialImpact**: The estimated financial cost of this specific pattern. (e.g., "This pattern may be costing you around ₱150 per month.").
4.  **solutions**: A list of 2 actionable, alternative solutions.
5.  **patternAlert**: A one-sentence description of a specific, recurring behavior.
6.  **smartShoppingPlan**: A concise, one-sentence shopping tip.
7.  **whatsReallyHappening**: A detailed, 1-2 sentence explanation of the pattern.
8.  **whyThisPatternExists**: Your analysis of the likely root cause.
9.  **similarUserStory**: An encouraging, relatable story.

If there is not enough data to identify a clear pattern, provide a welcoming message and tips on how to get started.
`,
});


const analyzeConsumptionPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeConsumptionPatternsFlow',
    inputSchema: AnalyzeConsumptionPatternsInputSchema,
    outputSchema: AnalyzeConsumptionPatternsOutputSchema,
  },
  async (input) => {
    // If there is no data at all, return the default insight immediately.
    if (!input.wasteLogs || input.wasteLogs.length === 0) {
        return generateDefaultInsight();
    }
    
    try {
        const { output } = await prompt(input);
        
        // If the AI returns a null or empty output for any reason, fall back to the default.
        if (!output || !output.keyObservation) {
            console.log("AI did not return a valid output despite having data. Returning default insight.");
            return generateDefaultInsight();
        }
        
        return output;

    } catch (error) {
        console.error("Error during AI prompt execution in analyzeConsumptionPatternsFlow:", error);
        // If any error occurs during the AI call itself, return the default insight.
        return generateDefaultInsight();
    }
  }
);
