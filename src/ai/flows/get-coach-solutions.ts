
'use server';

import { ai } from '@/ai/genkit';
import {
  GetCoachSolutionsInputSchema,
  GetCoachSolutionsOutputSchema,
  type GetCoachSolutionsInput,
  type GetCoachSolutionsOutput,
} from '@/ai/schemas';

export async function getCoachSolutions(input: GetCoachSolutionsInput): Promise<GetCoachSolutionsOutput> {
  return getCoachSolutionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCoachSolutionsPrompt',
  input: { schema: GetCoachSolutionsInputSchema },
  output: { schema: GetCoachSolutionsOutputSchema },
  prompt: `You are the solutions-focused part of a "Personal Kitchen Economist and Behavioral Coach". Your only job is to generate creative, actionable solutions based on a pre-existing analysis.

## ANALYSIS CONTEXT
You have been given the following analysis about a user's food waste pattern:
- **Insight Title:** {{analysis.title}}
- **The Story:**
  - **Situation:** {{#each analysis.story.situation}} - {{this}} {{/each}}
  - **Impact:** {{analysis.story.impact}}
  - **Root Cause:** {{#each analysis.story.rootCause}} - {{this}} {{/each}}
- **Prediction:** {{analysis.prediction}}

## USER CONTEXT
- **User Stage:** {{userContext.userStage}} // 'new_user', 'regular_user', or 'advanced_user'
- **Previously Attempted Solutions:** {{#if userContext.previouslyAttemptedSolutions}}{{#each userContext.previouslyAttemptedSolutions}}'{{this}}', {{/each}}{{else}}None{{/if}}

## ANALYSIS SUMMARY REQUIREMENT
Before generating solutions, you must also provide a brief, engaging summary of the analysis that will be displayed prominently. This should be 2-3 sentences that capture the essence of the user's pattern in plain language.

**Summary Guidelines:**
- Start with the user's behavior pattern in relatable terms.
- Mention the financial impact briefly.
- End with a forward-looking statement about potential improvement.
- Use Filipino context when relevant.
- Keep it encouraging but realistic.

**Example formats:**
- "You're caught in a classic 'weekend warrior' shopping pattern where fresh ingredients get forgotten in the weekday rush..."
- "Your household shows a common Filipino pattern of buying fresh vegetables with good intentions, but busy schedules are getting in the way..."

## YOUR TASK
Based *only* on the provided analysis and user context, generate a complete solutions package.

**OUTPUT REQUIREMENTS**
1.  **Analysis Summary**: Create a compelling 2-3 sentence summary that explains the user's pattern in relatable terms, mentions the impact, and sets up the solutions positively.
2.  **Generate Solutions**: Create a list of 2-3 tailored solutions. For the titles, use creative and engaging names like "Plan your meals", "FIFO Fridge Organization", or "The Kangkong Challenge" where appropriate for the context.
3.  **Dynamic Difficulty**: The solutions MUST be tailored based on \`userContext.userStage\` and \`userContext.previouslyAttemptedSolutions\`.
    -   If a solution has been previously attempted, DO NOT suggest it again.
    -   For 'advanced_user', provide "Level Up" challenges instead of basic tips.
    -   For 'new_user', provide simple, foundational habits.
4.  **Filipino Context**: Ensure solutions are practical and relatable for a Filipino household.
5.  **One-Time Savings**: For the 'estimatedSavings' field, provide a single, one-time estimated savings value in PHP, NOT a monthly recurring value. For example, if a solution helps save a specific item worth ₱100, the value should be 100.
6.  **Quick Win & Encouragement**: Provide one quick win for today and a motivational message.

Generate the output as a single JSON object that strictly follows the output schema.
`,
});

const getCoachSolutionsFlow = ai.defineFlow(
  {
    name: 'getCoachSolutionsFlow',
    inputSchema: GetCoachSolutionsInputSchema,
    outputSchema: GetCoachSolutionsOutputSchema,
  },
  async (input) => {
    // If the insight is about getting started, provide a default set of solutions.
    if (input.analysis.insightType === 'first_steps') {
      return {
        analysisSummary: "Welcome to your smart kitchen! Let's get you set up to start saving money and reducing waste.",
        solutions: [{
          title: "Log Your First Pantry Item",
          description: "Go to the 'Add to Pantry' section and use your camera to quickly log what's in your fridge or shelves.",
          difficulty: 'easy',
          timeToSee: '1 day',
          estimatedSavings: 50,
          successRate: 0.95,
          filipinoContext: "Knowing what's in the pantry is the first step to any Filipino meal plan."
        }],
        quickWin: "Add just 5 items to your pantry right now. It takes less than 2 minutes!",
        encouragement: "You've taken the most important step! We're excited to help you save money and reduce waste."
      };
    }

    const { output } = await prompt(input);

    if (!output) {
      throw new Error("The Coach could not generate any solutions.");
    }
    
    return output;
  }
);
