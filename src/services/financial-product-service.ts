// src/services/financial-product-service.ts
/**
 * @fileOverview A service for fetching financial products.
 * In a real-world application, this service would interact with a database
 * or an external Financial API provider. For this prototype, it returns
 * hardcoded sample data.
 */

type ProductCategory = 'savings' | 'investment' | 'loan';

interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
}

const mockProducts: Product[] = [
  // Savings
  { id: 'hys-1', name: 'SecureBank High-Yield Savings', category: 'savings', description: 'A high-interest savings account with no monthly fees.' },
  { id: 'hys-2', name: 'FinFuture Online Savings', category: 'savings', description: 'Easy-to-use online savings with competitive interest rates.' },
  { id: 'cd-1', name: 'CapitalGrowth 12-Month CD', category: 'savings', description: 'A fixed-rate certificate of deposit for guaranteed returns.' },

  // Investments
  { id: 'mf-1', name: 'Global Tech Leaders Mutual Fund', category: 'investment', description: 'Invests in a diversified portfolio of leading technology companies.' },
  { id: 'etf-1', name: 'All-World Index ETF', category: 'investment', description: 'A low-cost ETF that tracks the global stock market.' },
  { id: 'bond-1', name: 'Govt. Infrastructure Bond', category: 'investment', description: 'A government-backed bond with stable, long-term returns.' },

  // Loans
  { id: 'pl-1', name: 'SwiftCash Personal Loan', category: 'loan', description: 'Flexible personal loans for various needs with quick approval.' },
  { id: 'hl-1', name: 'HomeFirst Mortgage Plan', category: 'loan', description: 'Affordable home loans with multiple repayment options.' },
  { id: 'cl-1', name: 'AutoDrive Car Loan', category: 'loan', description: 'Competitive interest rates for new and used car purchases.' },
];

/**
 * Fetches a list of financial products based on a category.
 * @param category The category of products to fetch.
 * @returns A promise that resolves to an array of products.
 */
export async function getProducts(category: ProductCategory): Promise<Omit<Product, 'id' | 'category'>[]> {
  // --- REAL API INTEGRATION POINT ---
  // To use a real API, you would replace the mock implementation below
  // with a fetch call to your chosen financial data provider.

  // Example of how a real API call might look:
  /*
  const API_KEY = process.env.FINANCIAL_API_KEY;
  const API_ENDPOINT = `https://api.yourprovider.com/products?category=${category}`;

  try {
    const response = await fetch(API_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch financial products');
    }

    const data = await response.json();
    
    // You might need to transform the data from the API to match the 
    // expected return format: { name: string, description: string }[]
    return data.products.map(product => ({
        name: product.productName,
        description: product.summary
    }));

  } catch (error) {
    console.error("Error fetching real financial products:", error);
    // Fallback to mock data or return an empty array if the API fails
    return getMockProducts(category);
  }
  */

  // For this prototype, we will continue to use the mock service.
  return getMockProducts(category);
}


/**
 * Returns mock product data after a simulated delay.
 * @param category The category of products to fetch.
 */
function getMockProducts(category: ProductCategory): Promise<Omit<Product, 'id' | 'category'>[]> {
    // Simulate an async API call
    return new Promise((resolve) => {
        setTimeout(() => {
        const filteredProducts = mockProducts
            .filter((p) => p.category === category)
            .map(({ id, category, ...rest }) => rest); // Exclude id and category
        resolve(filteredProducts);
        }, 500); // Simulate network delay
    });
}
