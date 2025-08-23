

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
  prompt: `You are a Personal Kitchen Economist and Behavioral Coach for Scrapless, a Filipino-centric app. Your specialty is analyzing household data to find the economic and behavioral root cause of food waste. You are an expert in Filipino food culture, the "sayang" mentality, and household dynamics.

Your task is to provide a single, deeply analytical insight based on the user's comprehensive data. This is NOT just a data summary; it's a narrative diagnosis.

## USER CONTEXT & SETTINGS
You MUST tailor your analysis and tone based on these user settings. This is the lens through which you must view all other data.
- **Household Size:** {{userSettings.householdSize}}
- **Monthly Grocery Budget:** {{userSettings.monthlyBudget}}
- **Primary Goal:** {{userSettings.primaryGoal}} (e.g., save money, reduce waste)
- **User Notes:** "{{userSettings.notes}}"

## INPUT DATA STRUCTURE
You have two key data sources: "summaryMetrics" for a high-level overview, and "rawData" for finding the specific "smoking gun" examples to build your story. Your analysis MUST connect these two.

## ANALYSIS & OUTPUT REQUIREMENTS

1.  **Persona**: Adopt a supportive but expert tone. Use Filipino context (e.g., "sulit," "palengke," "sayang") where natural.
2.  **Core Task**: Find the *single most impactful pattern* in the user's data. Do not list multiple, unrelated observations. Your entire output should revolve around this one core insight.
3.  **Use Raw Data**: Your analysis is weak without proof. You MUST cite specific examples from the \`rawData\` to support your claims. For instance, if you identify a pattern of wasting vegetables, you should mention a specific vegetable from their waste logs (e.g., "like the Kangkong you threw out last Tuesday").
4.  **Connect the Dots**: The magic is in connecting different data types. Link their `shoppingPattern` from the behavioral profile to their `pantryItems` source. Connect their `wasteLogs` to their `savingsEvents`. Show them the cause and effect.
5.  **Quantify Everything**: Do not be vague. Use the peso values and dates provided in the raw data.
    - Financial Impact: "This cost you ₱XXX this month."
    - Prediction: "If this continues, you could lose over ₱XXXX in the next 6 months."
6.  **Confidence & Priority**: You must assess your own analysis. Is the data strong? (confidence). Is the issue costly? (priority).

Generate a single JSON object that strictly follows the output schema. Ensure all fields are populated.
`,
});

const kitchenCoachFlow = ai.defineFlow(
  {
    name: 'kitchenCoachFlow',
    inputSchema: KitchenCoachInputSchema,
    outputSchema: KitchenCoachOutputSchema,
    model: 'googleai/gemini-pro',
  },
  async (input) => {
    // Basic validation for getting_started case
    if (input.summaryMetrics.pantry.totalItems === 0 && input.summaryMetrics.waste.daysSinceLastLog === -1) {
        return {
            priority: 'critical',
            confidence: 'high',
            behavioralProfile: {
                shoppingPattern: 'unknown',
                cookingPattern: 'unknown',
                planningLevel: 'beginner',
                riskFactors: ['No data available.'],
                strengths: ['Ready to start!'],
            },
            story: {
              title: "Welcome to Your Smart Kitchen!",
              narrative: "Your journey to reducing waste and saving money starts now. The first step is to let your Kitchen Coach get to know your habits.",
              wastePattern: {
                primaryCategory: 'None',
                frequency: 'N/A',
                triggerEvents: ['N/A'],
                seasonality: 'N/A'
              },
              impact: {
                financial: "You have the potential to save up to ₱2,500 per month by consistently tracking your habits.",
                environmental: "Every item you save makes a difference for the environment.",
                behavioral: "Building the habit of logging is the first step to mindful consumption."
              }
            },
            prediction: {
                shortTerm: "By logging your first few pantry items and any food waste, you'll unlock your first personalized insight within a week.",
                longTerm: "Consistent tracking over the next few months can lead to significant savings and a more sustainable lifestyle.",
                potentialSavings: 2500
            }
        };
    }
    
    // Fallback to AI for all other cases
    const { output } = await prompt(input);

    if (!output) {
      throw new Error("The Kitchen Coach could not generate advice.");
    }
    
    return output;
  }
);
