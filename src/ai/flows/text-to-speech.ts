// src/ai/flows/text-to-speech-flow.ts
'use server';
/**
 * @fileOverview A flow for converting text to speech.
 *
 * - textToSpeech - A function that converts text to an audio data URI.
 */
import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';
import {
  TextToSpeechInputSchema,
  TextToSpeechOutputSchema,
  type TextToSpeechInput,
} from './text-to-speech-schema';

// Define the function to convert PCM data to WAV format
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });
    const bufs: Buffer[] = [];
    writer.on('data', (chunk) => bufs.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.on('error', reject);
    writer.write(pcmData);
    writer.end();
  });
}

// Define the main Text-to-Speech flow
const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({text}) => {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: text,
    });

    if (!media?.url) {
      throw new Error('No audio data returned from the model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);

    return {
      audio: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);

export async function textToSpeech(
  input: TextToSpeechInput
) {
  return textToSpeechFlow(input);
}
