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
  prompt: `You are an AI assistant that transcribes audio of a person listing their food waste. Your task is to intelligently extract only the food items and their quantities, filtering out all filler words, pauses, and irrelevant phrases.

Listen to the following audio. The user might speak naturally, with phrases like "uh...", "I think...", or "like...". Your job is to ignore these and provide a clean, structured list of the wasted items.

For example, if the user says "uh... I wasted one cup of rice and, like, two slices of pizza I think...", you should extract and output only:
- item: "rice", amount: "1 cup"
- item: "pizza", amount: "2 slices"

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
