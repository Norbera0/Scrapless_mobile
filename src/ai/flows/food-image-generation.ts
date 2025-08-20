'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

const GenerateFoodImageInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
});
const GenerateFoodImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('URL of a generated photo stored in Cloud Storage.'),
});

export type GenerateFoodImageInput = z.infer<typeof GenerateFoodImageInputSchema>;
export type GenerateFoodImageOutput = z.infer<
  typeof GenerateFoodImageOutputSchema
>;

export async function generateFoodImage(
  input: GenerateFoodImageInput
): Promise<GenerateFoodImageOutput> {
  return generateFoodImageFlow(input);
}

const generateFoodImageFlow = ai.defineFlow(
  {
    name: 'generateFoodImageFlow',
    inputSchema: GenerateFoodImageInputSchema,
    outputSchema: GenerateFoodImageOutputSchema,
  },
  async ({ recipeName }) => {
    // 1. Generate the image using the AI model
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A delicious-looking photo of ${recipeName}, professionally shot for a cookbook, vibrant and appetizing.`,
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    });

    if (!media?.url) {
      throw new Error('Failed to generate image data.');
    }

    // 2. Upload the image to Firebase Cloud Storage
    const bucket = getStorage().bucket(); // Use the default bucket

    // The media.url is a data URI like 'data:image/png;base64,iVBORw0KGgo...'
    const dataUri = media.url;

    // Extract the base64 data and content type
    const match = dataUri.match(/^data:(image\/(\w+));base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid data URI format for the generated image.');
    }
    const contentType = match[1]; // e.g., 'image/png'
    const imageType = match[2]; // e.g., 'png'
    const base64Data = match[3];

    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Create a unique filename
    const fileName = `recipe-images/${uuidv4()}.${imageType}`;
    const file = bucket.file(fileName);

    // Save the buffer to the bucket
    await file.save(imageBuffer, {
      metadata: {
        contentType: contentType,
      },
    });

    // 3. Get a long-lived signed URL for the file
    const [publicUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // Far-future expiration date
    });

    // 4. Return the public Cloud Storage URL
    return { imageUrl: publicUrl };
  }
);
