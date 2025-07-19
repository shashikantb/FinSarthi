
// src/ai/flows/generate-personalized-advice.ts
'use server';

/**
 * @fileOverview Generates personalized financial advice based on user inputs.
 *
 * - generatePersonalizedAdvice - A function that generates personalized financial advice.
 * - GeneratePersonalizedAdviceInput - The input type for the generatePersonalizedAdvice function.
 * - GeneratePersonalizedAdviceOutput - The return type for the generatePersonalizedAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { findFinancialProducts } from '../tools/financial-products-tool';

const GeneratePersonalizedAdviceInputSchema = z.object({
  income: z.coerce.number().positive({ message: "Income must be positive." }),
  expenses: z.coerce.number().positive({ message: "Expenses must be positive." }),
  financialGoals: z
    .string()
    .min(10, "Please describe your goals in more detail."),
  literacyLevel: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.enum(["en", "hi", "mr"]),
});

export type GeneratePersonalizedAdviceInput = z.infer<typeof GeneratePersonalizedAdviceInputSchema>;

const GeneratePersonalizedAdviceOutputSchema = z.object({
  advice: z.string().describe('Personalized financial advice based on the input.'),
});

export type GeneratePersonalizedAdviceOutput = z.infer<typeof GeneratePersonalizedAdviceOutputSchema>;

export async function generatePersonalizedAdvice(input: GeneratePersonalizedAdviceInput): Promise<GeneratePersonalizedAdviceOutput> {
  return generatePersonalizedAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedAdvicePrompt',
  input: {schema: GeneratePersonalizedAdviceInputSchema},
  output: {schema: GeneratePersonalizedAdviceOutputSchema},
  tools: [findFinancialProducts],
  prompt: `You are FinSarthi, a friendly and expert financial coach. Your goal is to provide clear, empathetic, and highly actionable financial advice. You MUST suggest suitable financial products using the provided tool.

  Analyze the user's financial situation based on the details below and generate a personalized plan. The language for the advice must be {{language}}.

  **User's Financial Profile:**
  - **Monthly Income:** {{income}}
  - **Monthly Expenses:** {{expenses}}
  - **Stated Financial Goals:** "{{financialGoals}}"
  - **Financial Literacy Level:** {{literacyLevel}}

  **Your Task:**
  1.  **Acknowledge and Empathize:** Start by acknowledging their goals in a positive and encouraging tone.
  2.  **Analyze Cash Flow:** Calculate their monthly savings (income - expenses). Comment on this briefly.
  3.  **Provide Actionable Steps:** Give 3-5 clear, simple, and prioritized steps the user can take to move toward their goals.
  4.  **Suggest Products using Tools:** For any step that involves a financial product (like a savings account, mutual fund, or loan), you MUST use the 'findFinancialProducts' tool to get a list of suitable product examples. You MUST integrate these product suggestions naturally into your advice. DO NOT invent or hallucinate product names.
      - **Example Integration:** "You could consider opening a high-yield savings account, such as '[Product Name from Tool 1]' or '[Product Name from Tool 2]'."
  5.  **Structure and Tone:** Use headings or bullet points. Be encouraging and supportive throughout. Your name is FinSarthi.
  6.  **Output Format**: Ensure your final output is a valid JSON object with an 'advice' field containing your full response.
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const generatePersonalizedAdviceFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedAdviceFlow',
    inputSchema: GeneratePersonalizedAdviceInputSchema,
    outputSchema: GeneratePersonalizedAdviceOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);

      if (output === null) {
        return {
          advice:
            "I'm sorry, I was unable to generate advice at this time. The model returned an empty response. Please try adjusting your input or try again later.",
        };
      }

      return output;
    } catch (error) {
      console.error("Error in generatePersonalizedAdviceFlow:", error);
      return {
        advice:
          "I'm sorry, I was unable to generate advice at this time. This could be due to a temporary issue or the content triggering safety settings. Please try adjusting your input or try again later.",
      };
    }
  }
);
