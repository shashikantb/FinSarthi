
'use server';

/**
 * @fileOverview Generates personalized financial advice based on dynamic user inputs using Groq.
 *
 * - generatePersonalizedAdvice - A function that generates personalized financial advice.
 * - GeneratePersonalizedAdviceInput - The input type for the generatePersonalizedAdvice function.
 * - GeneratePersonalizedAdviceOutput - The return type for the generatePersonalizedAdvice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import OpenAI from 'openai';
import { getProducts } from '@/services/financial-product-service';
import { GeneratePersonalizedAdviceOutputSchema } from './generate-personalized-advice-schema';
import advicePrompts from '@/lib/advice-prompts.json';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// This schema is now dynamic, accepting any key-value pair of strings.
const GeneratePersonalizedAdviceInputSchema = z.object({
  promptKey: z.string().describe("The key of the selected prompt from the JSON config."),
  formData: z.record(z.string()).describe("The user's answers to the dynamic questions."),
  language: z.enum(["en", "hi", "mr"]),
});

export type GeneratePersonalizedAdviceInput = z.infer<typeof GeneratePersonalizedAdviceInputSchema>;
export type GeneratePersonalizedAdviceOutput = z.infer<typeof GeneratePersonalizedAdviceOutputSchema>;

export async function generatePersonalizedAdvice(input: GeneratePersonalizedAdviceInput): Promise<GeneratePersonalizedAdviceOutput> {
  return generatePersonalizedAdviceFlow(input);
}

const generatePersonalizedAdviceFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedAdviceFlow',
    inputSchema: GeneratePersonalizedAdviceInputSchema,
    outputSchema: GeneratePersonalizedAdviceOutputSchema,
  },
  async (input) => {
    try {
        const { promptKey, formData, language } = input;
        
        // Find the selected prompt configuration from the JSON file
        const promptConfig = advicePrompts.find(p => p.key === promptKey);

        if (!promptConfig) {
            throw new Error(`Prompt with key "${promptKey}" not found.`);
        }

        // Dynamically build a string of the user's answers, adding currency context for numeric types.
        const userAnswers = Object.entries(formData)
            .map(([key, value]) => {
                const questionConfig = promptConfig.questions.find(q => q.key === key);
                if (!questionConfig) return ''; // Skip if question config not found

                const questionLabel = questionConfig.label[language as keyof typeof questionConfig.label] || key;
                
                // Add currency symbol for numeric inputs to give AI better context
                const displayValue = questionConfig.type === 'number' ? `₹${value}` : value;
                
                return `- ${questionLabel}: ${displayValue}`;
            })
            .filter(line => line) // Remove any empty lines
            .join('\n');

      const [savings, investments, loans] = await Promise.all([
        getProducts('savings'),
        getProducts('investment'),
        getProducts('loan'),
      ]);

      const productContext = `
      Here is a list of available financial products. When you suggest a product type (like a savings account, mutual fund, or loan), you MUST use appropriate examples from this list.
      - Savings Products: ${JSON.stringify(savings)}
      - Investment Products: ${JSON.stringify(investments)}
      - Loan Products: ${JSON.stringify(loans)}
      `;

      // Use the system prompt from the JSON config
      const systemPrompt = promptConfig.systemPrompt[language as keyof typeof promptConfig.systemPrompt];

      const finalPrompt = `
      ${systemPrompt}

      The user has provided the following information:
      ${userAnswers}
      
      Available Financial Products for Recommendation:
      ${productContext}

      Your Task:
      1.  **Analyze the user's situation** based on the information they provided.
      2.  **Provide Actionable Steps:** Give 3-5 clear, simple, and prioritized steps.
      3.  **Suggest Products:** When relevant, suggest suitable products from the list provided. Do not invent products.
      4.  **Language and Tone:** Your response MUST be in ${language}. Be encouraging, empathetic, and supportive. Your name is FinSarthi.
      5.  **Output Format**: Your response MUST be ONLY the advice text. Do not include any other text, greetings, explanations, or markdown formatting.
      `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: finalPrompt }],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 2048,
      });

      const adviceText = completion.choices[0].message.content;
      if (!adviceText) {
        throw new Error("The AI model returned an empty response.");
      }

      console.log("AI Response for Personalized Advice:", adviceText);
      return { advice: adviceText };

    } catch (error) {
      console.error("Error in generatePersonalizedAdviceFlow:", error);
      return {
        advice:
          "I'm sorry, I was unable to generate advice at this time. This could be due to a temporary issue. Please try adjusting your input or try again later.",
      };
    }
  }
);
