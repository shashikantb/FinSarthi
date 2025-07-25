
'use server';

/**
 * @fileOverview A conversational financial coach AI agent using Groq.
 *
 * - financialCoach - A function that handles the financial coaching conversation.
 * - FinancialCoachInput - The input type for the financialCoach function.
 * - FinancialCoachOutput - The return type for the financialCoach function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';
import { getProducts } from '@/services/financial-product-service';

const FinancialCoachInputSchema = z.object({
  language: z
    .enum(['English', 'Hindi', 'Marathi', 'German'])
    .describe('The language for the conversation.'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The entire conversation history, including the latest user message.'),
  age: z.number().optional().describe("The user's age."),
  gender: z.string().optional().describe("The user's gender."),
  city: z.string().optional().describe("The user's city."),
  country: z.string().optional().describe("The user's country."),
});
export type FinancialCoachInput = z.infer<typeof FinancialCoachInputSchema>;

const FinancialCoachOutputSchema = z.object({
  response: z.string().describe('The coach\'s response to the user.'),
});
export type FinancialCoachOutput = z.infer<typeof FinancialCoachOutputSchema>;

export async function financialCoach(
  input: FinancialCoachInput
): Promise<FinancialCoachOutput> {
  return financialCoachFlow(input);
}

const financialCoachFlow = ai.defineFlow(
  {
    name: 'financialCoachFlow',
    inputSchema: FinancialCoachInputSchema,
    outputSchema: FinancialCoachOutputSchema,
  },
  async (input) => {
    console.log("Calling financialCoachFlow with input:", JSON.stringify(input, null, 2));
    if (!process.env.GROQ_API_KEY) {
      return { response: "I'm sorry, the AI service is not configured. The GROQ_API_KEY is missing." };
    }
    
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    try {
        const [savings, investments, loans] = await Promise.all([
            getProducts('savings'),
            getProducts('investment'),
            getProducts('loan'),
        ]);

        const productContext = `
        Here is a list of available financial products. When the user asks for recommendations, you should use these products.
        Savings Products: ${JSON.stringify(savings)}
        Investment Products: ${JSON.stringify(investments)}
        Loan Products: ${JSON.stringify(loans)}
        `;

        // Build the user context string conditionally.
        let userContext = "The user is talking to you.";
        if (input.age || input.gender || input.city || input.country) {
            userContext = `The user is a ${input.age || ''} year old ${input.gender || ''} from ${input.city || ''}, ${input.country || ''}.`.replace(/\s+/g, ' ').trim();
        }


        const systemPrompt = `You are FINmate, an expert financial coach. Your goal is to provide clear, simple, and personalized financial advice.
        **CRITICAL INSTRUCTION: Your responses MUST be concise and use bullet points or numbered lists for easy readability. Avoid long paragraphs.**
        You are an expert on topics like budgeting, saving, investing, and loans.
        The user is conversing with you in ${input.language}. Your response MUST be in the same language.

        ${productContext}

        Here is some information about the user you are talking to:
        ${userContext}
        Use this information to tailor your advice. For example, investment advice might differ for a 25-year-old versus a 55-year-old.

        Converse with the user based on the history of the conversation provided.
        Be friendly, empathetic, and encouraging. DO NOT make up product names; only use the ones provided above.`;
        
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...input.history,
        ];
        
        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama3-8b-8192',
            temperature: 0.7,
            max_tokens: 1024,
        });

        const responseText = completion.choices[0].message.content;

        if (!responseText) {
            return { response: "I'm sorry, I couldn't generate a response. Please try again." };
        }
        return { response: responseText };

    } catch (error) {
      console.error("Error in financialCoachFlow:", error);
      return { response: "I'm sorry, there was an error processing your request." };
    }
  }
);
