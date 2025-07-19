
'use server';

/**
 * @fileOverview Generates personalized financial advice based on user inputs using Groq.
 *
 * - generatePersonalizedAdvice - A function that generates personalized financial advice.
 * - GeneratePersonalizedAdviceInput - The input type for the generatePersonalizedAdvice function.
 * - GeneratePersonalizedAdviceOutput - The return type for the generatePersonalizedAdvice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import OpenAI from 'openai';
import { findFinancialProducts } from '../tools/financial-products-tool';
import { GeneratePersonalizedAdviceOutputSchema } from './generate-personalized-advice-schema';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

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
      const prompt = `You are FinSarthi, a friendly and expert financial coach. Your goal is to provide clear, empathetic, and highly actionable financial advice. You MUST suggest suitable financial products using the provided tool.

      Analyze the user's financial situation based on the details below and generate a personalized plan. The language for the advice must be ${input.language}.

      **User's Financial Profile:**
      - **Monthly Income:** ${input.income}
      - **Monthly Expenses:** ${input.expenses}
      - **Stated Financial Goals:** "${input.financialGoals}"
      - **Financial Literacy Level:** ${input.literacyLevel}

      **Your Task:**
      1.  **Acknowledge and Empathize:** Start by acknowledging their goals in a positive and encouraging tone.
      2.  **Analyze Cash Flow:** Calculate their monthly savings (income - expenses). Comment on this briefly.
      3.  **Provide Actionable Steps:** Give 3-5 clear, simple, and prioritized steps the user can take to move toward their goals.
      4.  **Suggest Products using Tools:** For any step that involves a financial product (like a savings account, mutual fund, or loan), you MUST use the 'findFinancialProducts' tool to get a list of suitable product examples. You MUST integrate these product suggestions naturally into your advice. DO NOT invent or hallucinate product names.
          - **Example Integration:** "You could consider opening a high-yield savings account, such as '[Product Name from Tool 1]' or '[Product Name from Tool 2]'."
      5.  **Structure and Tone:** Use headings or bullet points. Be encouraging and supportive throughout. Your name is FinSarthi.
      6.  **Output Format**: Your response MUST be a valid JSON object with a single 'advice' field containing your full response as a string. Example: { "advice": "Here is your advice..." }
      `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
        // @ts-ignore - Genkit tools are compatible with the OpenAI tool format
        tools: [{ type: 'function', function: findFinancialProducts.definition }],
        tool_choice: 'auto',
      });

      const message = completion.choices[0].message;

      // Handle tool calls if the model requests them
      if (message.tool_calls) {
        const toolCall = message.tool_calls[0];
        const toolName = toolCall.function.name;

        if (toolName === 'findFinancialProducts') {
          const toolInput = JSON.parse(toolCall.function.arguments);
          const toolResult = await findFinancialProducts(toolInput);

          // Send the tool result back to the model
          const secondCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'user', content: prompt },
                message,
                {
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: toolName,
                    content: JSON.stringify(toolResult),
                },
            ],
            model: 'llama3-8b-8192',
            response_format: { type: 'json_object' },
          });

          const finalContent = secondCompletion.choices[0].message.content;
          if (!finalContent) throw new Error("The AI model returned an empty response after the tool call.");
          const output = GeneratePersonalizedAdviceOutputSchema.parse(JSON.parse(finalContent));
          return output;
        }
      }

      const content = message.content;
      if (!content) throw new Error("The AI model returned an empty response.");
      
      const output = GeneratePersonalizedAdviceOutputSchema.parse(JSON.parse(content));
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
