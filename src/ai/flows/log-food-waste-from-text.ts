
'use server';

/**
 * @fileOverview This file defines a Genkit flow for logging food waste from text input.
 *
 * - logFoodWasteFromText - The main function to process the text log.
 * - LogFoodWasteFromTextInput - The input type, containing the text.
 * - LogFoodWasteOutput - The output type, providing a list of detected food items.
 */

import { ai } from '@/ai/genkit';
import { LogFoodWasteFromTextInputSchema, LogFoodWasteOutputSchema, type LogFoodWasteFromTextInput, type LogFoodWasteOutput } from '@/ai/schemas';

export async function logFoodWasteFromText(input: LogFoodWasteFromTextInput): Promise<LogFoodWasteOutput> {
  return logFoodWasteFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'logFoodWasteFromTextPrompt',
  input: { schema: LogFoodWasteFromTextInputSchema },
  output: { schema: LogFoodWasteOutputSchema },
  prompt: `You are an AI assistant that processes a user's text describing their food waste. Your task is to intelligently extract only the food items and their quantities from the text.

The user might list items on separate lines, in a sentence, or in a less structured way. Your job is to parse this text and provide a clean, structured list of the wasted items.

For example, if the user types:
"I threw out:
- 1/2 cup of old rice
- two slices of pizza
- about 3 spoiled tomatoes"

You should extract and output only:
- item: "rice", amount: "1/2 cup"
- item: "pizza", amount: "2 slices"
- item: "tomatoes", amount: "3"

Text input from user:
{{{text}}}
  `,
});

const logFoodWasteFromTextFlow = ai.defineFlow(
  {
    name: 'logFoodWasteFromTextFlow',
    inputSchema: LogFoodWasteFromTextInputSchema,
    outputSchema: LogFoodWasteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
