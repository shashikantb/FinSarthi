import {genkit} from 'genkit';

// This file is now primarily used for initializing Genkit itself
// and for defining tools. Model definitions are handled directly
// in the flows via the OpenAI SDK pointing to Groq.

export const ai = genkit({
  // Plugins can still be used for other purposes, e.g., logging.
  plugins: [],
});
