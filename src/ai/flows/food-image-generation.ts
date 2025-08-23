
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    storageBucket: 'scrapless-bzy61.appspot.com',
  });
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
    console.log(`[generateFoodImageFlow] Starting image generation for: ${recipeName}`);
    
    try {
        // 1. Generate the image using the AI model
        const { media } = await ai.generate({
          model: 'googleai/imagen-3.0-generate-001',
          prompt: `High-resolution, hyper-realistic food photograph of ${recipeName}. 
Styled as if for a modern professional cookbook series: consistent look across all dishes. 
Always presented on a simple round white ceramic plate, centered in the frame. 
Shot from a consistent 45-degree angle, medium distance, with the entire plate visible. 
Background is a clean light-gray tabletop with soft natural lighting, minimal shadows, and no clutter. 
No props, no utensils, no drinks — just the dish on the plate. 
Cookbook-quality with uniform angle, plate, background, lighting, and framing for every image.`,
          config: { responseModalities: ['TEXT', 'IMAGE'] },
        });

        console.log('[generateFoodImageFlow] AI response received.');

        if (!media?.url) {
          console.error('[generateFoodImageFlow] Error: AI response did not contain media URL.');
          throw new Error('Failed to generate image data.');
        }

        console.log('[generateFoodImageFlow] Media URL is present. Preparing for upload.');

        // 2. Upload the image to Firebase Cloud Storage
        const bucket = getStorage().bucket(); // Use the default bucket

        const dataUri = media.url;
        const match = dataUri.match(/^data:(image\/(\w+));base64,(.+)$/);
        
        if (!match) {
          console.error('[generateFoodImageFlow] Error: Invalid data URI format.');
          throw new Error('Invalid data URI format for the generated image.');
        }

        const contentType = match[1];
        const imageType = match[2];
        const base64Data = match[3];

        console.log(`[generateFoodImageFlow] Image details: contentType=${contentType}, imageType=${imageType}`);
        
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const fileName = `recipe-images/${uuidv4()}.${imageType}`;
        const file = bucket.file(fileName);

        console.log(`[generateFoodImageFlow] Uploading to Cloud Storage: ${fileName}`);

        await file.save(imageBuffer, {
          metadata: {
            contentType: contentType,
          },
        });

        console.log('[generateFoodImageFlow] Upload successful.');

        // 3. Get a long-lived signed URL for the file
        const [publicUrl] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
        });
        
        console.log(`[generateFoodImageFlow] Generated public URL: ${publicUrl}`);

        // 4. Return the public Cloud Storage URL
        return { imageUrl: publicUrl };

    } catch (error) {
        console.error('[generateFoodImageFlow] An error occurred during the flow:', error);
        throw error; // Re-throw the error to be caught by the caller
    }
  }
);
