
'use server';

/**
 * @fileOverview This file defines a Genkit flow for logging new pantry items from a photo, voice, or text.
 *
 * - logPantryItem - The main function to process the input and add to the pantry.
 * - LogPantryItemInput - The input type, containing the source and data.
 * - LogPantryItemOutput - The output type, providing a list of detected food items with expiration dates.
 */

import { ai } from '@/ai/genkit';
import {
  LogPantryItemInputSchema,
  LogPantryItemOutputSchema,
  type LogPantryItemInput,
  type LogPantryItemOutput,
} from '@/ai/schemas';

export async function logPantryItem(input: LogPantryItemInput): Promise<LogPantryItemOutput> {
  return logPantryItemFlow(input);
}

const cameraPrompt = ai.definePrompt({
    name: 'logPantryItemCameraPrompt',
    input: { schema: LogPantryItemInputSchema },
    output: { schema: LogPantryItemOutputSchema },
    prompt: `You are an AI assistant that analyzes images of groceries, receipts, or handwritten lists. Your task is to identify each food item, extract its quantity and unit, predict its shelf life in days for various storage methods based on common food data, estimate its carbon footprint in kg of CO2 equivalent, estimate its cost in PHP, and identify where the items were purchased if mentioned in the image.
  
    Analyze the following photo and provide a structured list.
  
    Photo: {{media url=data}}
    `,
  });

const voicePrompt = ai.definePrompt({
    name: 'logPantryItemVoicePrompt',
    input: { schema: LogPantryItemInputSchema },
    output: { schema: LogPantryItemOutputSchema },
    prompt: `You are an AI assistant that transcribes audio of a person listing their new groceries. Your task is to intelligently extract only the food items, their quantity, and their unit, filtering out all filler words. Then, predict a shelf life in days for each item for various storage methods, estimate its carbon footprint, estimate its cost in PHP, and identify the purchase source.

The user might specify a purchase source for all items (e.g., "I bought these from the supermarket:") or for individual items (e.g., "one dozen eggs from the palengke"). If a global source is mentioned, apply it to all items unless a specific item has its own source mentioned.

Listen to the following audio and provide a structured list.
    
    Audio: {{media url=data}}
      `,
});

const textPrompt = ai.definePrompt({
    name: 'logPantryItemTextPrompt',
    input: { schema: LogPantryItemInputSchema },
    output: { schema: LogPantryItemOutputSchema },
    prompt: `You are an AI assistant that processes a text list of new groceries. Your task is to identify each food item, extract its quantity and unit, predict its shelf life, estimate its carbon footprint, estimate its cost in PHP, and determine the purchase source.

The user might specify a purchase source for all items (e.g., "Bought in market:") or for individual items (e.g., "Chicken breast - bought in groceries"). If a global source is mentioned, apply it to all items unless a specific item has its own source mentioned. Map common terms like "market" to "wet_market", "groceries" to "supermarket".

Analyze the following text and provide a structured list.

Text: {{{data}}}
    `,
});

const logPantryItemFlow = ai.defineFlow(
  {
    name: 'logPantryItemFlow',
    inputSchema: LogPantryItemInputSchema,
    outputSchema: LogPantryItemOutputSchema,
  },
  async (input) => {
    let prompt;
    switch (input.source) {
      case 'camera':
        prompt = cameraPrompt;
        break;
      case 'voice':
        prompt = voicePrompt;
        break;
      case 'text':
        prompt = textPrompt;
        break;
    }

    const { output } = await prompt(input);
    
    if (!output || !output.items) {
        return { items: [] };
    }

    return output;
  }
);
