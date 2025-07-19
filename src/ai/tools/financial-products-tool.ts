// src/ai/tools/financial-products-tool.ts
'use server';
/**
 * @fileOverview A Genkit tool for finding financial products.
 * This file defines a tool that the AI can use to look up financial products
 * from a simulated service.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getProducts } from '@/services/financial-product-service';

export const findFinancialProducts = ai.defineTool(
  {
    name: 'findFinancialProducts',
    description: 'Finds financial products based on a specified category (e.g., savings, investment, loan). Use this tool to recommend specific product examples to the user.',
    inputSchema: z.object({
      category: z.enum(['savings', 'investment', 'loan']).describe('The category of the financial product to search for.'),
    }),
    outputSchema: z.array(z.object({
        name: z.string().describe('The name of the financial product.'),
        description: z.string().describe('A brief description of the product.'),
    })),
  },
  async (input) => {
    // In a real application, this would call an external API or database.
    // For this prototype, it calls a mocked service.
    const products = await getProducts(input.category);
    return products;
  }
);
