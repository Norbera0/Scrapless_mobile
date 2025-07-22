'use server';

/**
 * @fileOverview This file defines a Genkit flow for logging food waste from an audio recording.
 *
 * - logFoodWasteFromAudio - The main function to process the audio log.
 * - LogFoodWasteFromAudioInput - The input type, containing the audio data URI.
 * - LogFoodWasteOutput - The output type, providing a list of detected food items.
 */

import { ai } from '@/ai/genkit';
import { LogFoodWasteFromAudioInputSchema, LogFoodWasteOutputSchema, type LogFoodWasteFromAudioInput, type LogFoodWasteOutput } from '@/ai/schemas';

export async function logFoodWasteFromAudio(input: LogFoodWasteFromAudioInput): Promise<LogFoodWasteOutput> {
  return logFoodWasteFromAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'logFoodWasteFromAudioPrompt',
  input: { schema: LogFoodWasteFromAudioInputSchema },
  output: { schema: LogFoodWasteOutputSchema },
  prompt: `You are an AI assistant that transcribes audio of a person listing their food waste and extracts the items and quantities.

  Listen to the following audio and convert it to a structured list of food items and their estimated amounts. For example, if the user says "I wasted one cup of rice and two pieces of chicken", you should output:
  - item: "rice", amount: "1 cup"
  - item: "chicken", amount: "2 pieces"

  Audio: {{media url=audioDataUri}}
  `,
});

const logFoodWasteFromAudioFlow = ai.defineFlow(
  {
    name: 'logFoodWasteFromAudioFlow',
    inputSchema: LogFoodWasteFromAudioInputSchema,
    outputSchema: LogFoodWasteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
