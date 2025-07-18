// src/ai/flows/text-to-speech-schema.ts
import {z} from 'zod';

export const TextToSpeechInputSchema = z.object({
  text: z.string(),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

export const TextToSpeechOutputSchema = z.object({
  audio: z.string().describe('The base64 encoded audio data URI.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;
