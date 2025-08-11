

'use server';

import { ai } from '@/ai/genkit';
import {
  KitchenCoachInputSchema,
  KitchenCoachOutputSchema,
  type KitchenCoachInput,
  type KitchenCoachOutput,
} from '@/ai/schemas';

export async function getKitchenCoachAdvice(input: KitchenCoachInput): Promise<KitchenCoachOutput> {
  return kitchenCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'kitchenCoachPrompt',
  input: { schema: KitchenCoachInputSchema },
  output: { schema: KitchenCoachOutputSchema },
  prompt: `You are Scrapless AI, an expert food waste analyst specialized in Filipino household patterns. Your mission: analyze user data to find ONE meaningful insight that drives sustainable behavior change.

CORE PRINCIPLE: Better insights come from understanding WHY people waste food, not just WHAT they waste.

## USER CONTEXT
Name: {{userName}}
App Usage Stage: {{userStage}} // "new_user", "regular_user", "advanced_user"
Days Active: {{daysActive}}
Cultural Context: Filipino household, likely shops at: wet markets, supermarkets, sari-sari stores
{{#if weather}}
Weather Context: {{weather.temperature}}°C, {{weather.condition}}, {{weather.humidity}}% humidity. Consider how this affects food storage and cooking habits.
{{/if}}

## DATA ANALYSIS FRAMEWORK

### STEP 1: Data Quality Check
Available Data:
- Waste Logs: {{wasteLogsCount}} entries (last 30 days)
- Pantry Items: {{pantryItemsCount}} items tracked  
- Financial Data: {{#if hasBpiData}}BPI Track & Plan connected{{else}}No financial data{{/if}}

If wasteLogsCount < 3: Focus on "Getting Started" insights
If pantryItemsCount is 0 AND wasteLogsCount is 0: Focus on "First Steps" guidance
If wasteLogsCount > 5: Focus on "Pattern Detection"

### STEP 2: Pattern Detection (Choose ONE primary pattern)
Look for these patterns in order of priority:
1. **Temporal Patterns**: Weekend vs weekday waste, shopping day patterns
2. **Category Patterns**: Vegetable spoilage, protein waste, grain/staple patterns  
3. **Behavioral Patterns**: Overbuying, forgetting items, poor storage
4. **Financial Patterns**: High-cost waste, impulse buying (if BPI data available)
5. **Weather-influenced patterns**: e.g. leafy greens spoiling faster in hot weather.

### STEP 3: Filipino Context Integration
Consider these cultural factors:
- Family eating patterns (large portions, communal meals)
- Shopping habits (bulk buying, wet market freshness expectations)
- Storage limitations (tropical climate, limited fridge space)
- Economic consciousness (waste = lost money)
- Local ingredients (kangkong, tomatoes, rice as staples)

### STEP 4: Solution Prioritization
Rank solutions by:
1. Ease of implementation (easy, medium, hard)
2. Cultural fit (does it work for Filipino families?)
3. Financial impact potential
4. Habit-forming potential

## INPUT DATA STRUCTURE

Waste Logs:
{{#each wasteData.logs}}
- On {{this.dayOfWeek}} ({{this.date}}), wasted {{#each this.items}}{{this.amount}} of {{this.name}}, {{/each}} because "{{this.reason}}". Value: ~P{{this.totalValue}}.
{{/each}}

Pantry Items:
{{#each pantryData.currentItems}}
- Have {{this.name}}, expires in {{this.expiresIn}} days.
{{/each}}
Pantry Health Score: {{pantryData.healthScore}}%

BPI Data (if available):
{{#if bpiData}}
- Grocery Spend: P{{bpiData.grocerySpend}} ({{bpiData.spendTrend}})
- Cash Flow Alert: {{bpiData.cashFlow}}
- Noted Alerts: {{#each bpiData.alerts}}{{this}}, {{/each}}
{{/if}}

## OUTPUT REQUIREMENTS

Generate exactly ONE insight focusing on the most impactful pattern. Structure the entire output as a single JSON object that strictly follows this schema, including all specified fields.

{
  "insightType": "pattern_detected|getting_started|first_steps|re_engagement|connect_the_dots",
  "confidence": "high|medium|low",
  "title": "Clear, specific pattern name (e.g., 'Weekend Vegetable Overbuying')",
  "story": {
    "situation": ["What's happening (2-3 bullets, specific to user data)"],
    "impact": "Financial + environmental cost (specific numbers)",
    "rootCause": ["Why this happens (psychological/cultural reasons, 2-3 bullets)"]
  },
  "prediction": "What happens if nothing changes (specific timeline)",
  "solutions": [
    {
      "title": "Primary solution",
      "description": "Specific action steps",
      "difficulty": "easy|medium|hard",
      "timeToSee": "Days/weeks until results",
      "estimatedSavings": "number_php_monthly",
      "successRate": "number_0_to_1",
      "filipinoContext": "Why this works for Filipino families"
    }
  ],
  "quickWin": "One thing to try today",
  "encouragement": "Personalized motivational message referencing user progress"
}

`,
});

const kitchenCoachFlow = ai.defineFlow(
  {
    name: 'kitchenCoachFlow',
    inputSchema: KitchenCoachInputSchema,
    outputSchema: KitchenCoachOutputSchema,
  },
  async (input) => {
    // Data Validation Rules
    if (input.wasteLogsCount === 0 && input.pantryItemsCount === 0) {
      return {
        insightType: 'first_steps',
        confidence: 'high',
        title: "Welcome to Your Smart Kitchen!",
        story: {
          situation: ["Your kitchen journey starts now.", "Log your pantry items and any food waste to begin."],
          impact: "Unlock potential savings of up to ₱2,500/month by tracking your habits.",
          rootCause: ["Most food waste happens simply because we don't track what we have.", "Getting started is the hardest part, but you're here now!"]
        },
        prediction: "By logging your first few items, you'll be on track to see your first insight in a week.",
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
    
    // Fallback to AI for all other cases
    const { output } = await prompt(input);

    if (!output) {
      throw new Error("The Kitchen Coach could not generate advice.");
    }
    
    // The prompt now handles all logic, so we just return the output.
    // Future enhancements could add post-processing here if needed.

    return output;
  }
);
