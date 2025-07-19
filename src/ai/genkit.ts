import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openai} from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    googleAI({
      models: {
        'meta-llama/llama-4-scout-17b-16e-instruct': openai({
          apiKey: process.env.GROQ_API_KEY as string,
          baseURL: 'https://api.groq.com/openai/v1',
        }),
      },
    }),
  ],
  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
});
