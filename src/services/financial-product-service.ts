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

// In-memory cache for AMFI data
let amfiCache: Omit<Product, 'id' | 'category'>[] | null = null;
let lastFetchTimestamp = 0;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const mockProducts: Product[] = [
  // Savings
  { id: 'hys-1', name: 'SecureBank High-Yield Savings', category: 'savings', description: 'A high-interest savings account with no monthly fees.' },
  { id: 'hys-2', name: 'FinFuture Online Savings', category: 'savings', description: 'Easy-to-use online savings with competitive interest rates.' },
  { id: 'cd-1', name: 'CapitalGrowth 12-Month CD', category: 'savings', description: 'A fixed-rate certificate of deposit for guaranteed returns.' },

  // Investments (These are used as a fallback if the live API fails)
  { id: 'mf-1', name: 'Global Tech Leaders Mutual Fund', category: 'investment', description: 'Invests in a diversified portfolio of leading technology companies.' },
  { id: 'etf-1', name: 'All-World Index ETF', category: 'investment', description: 'A low-cost ETF that tracks the global stock market.' },
  { id: 'bond-1', name: 'Govt. Infrastructure Bond', category: 'investment', description: 'A government-backed bond with stable, long-term returns.' },

  // Loans
  { id: 'pl-1', name: 'SwiftCash Personal Loan', category: 'loan', description: 'Flexible personal loans for various needs with quick approval.' },
  { id: 'hl-1', name: 'HomeFirst Mortgage Plan', category: 'loan', description: 'Affordable home loans with multiple repayment options.' },
  { id: 'cl-1', name: 'AutoDrive Car Loan', category: 'loan', description: 'Competitive interest rates for new and used car purchases.' },
];

/**
 * Parses the raw text data from the AMFI NAV file.
 * @param textData The raw text data from the AMFI file.
 * @returns An array of financial products.
 */
function parseAmfiData(textData: string): Omit<Product, 'id' | 'category'>[] {
    const lines = textData.split('\n').filter(line => line.includes(';')); // Ensure line has data
  
    const products = lines
      .map(line => {
        const parts = line.split(';');
        // Scheme Code;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
        if (parts.length >= 6) {
          const schemeName = parts[3]?.trim();
          const nav = parts[4]?.trim();
  
          // Filter for more relevant "Growth" funds and ensure it's not an "IDCW" plan.
          // Also, ensure NAV is a valid, positive number.
          if (
            schemeName &&
            schemeName.toLowerCase().includes('growth') &&
            !schemeName.toLowerCase().includes('idcw') &&
            nav &&
            !isNaN(parseFloat(nav)) &&
            parseFloat(nav) > 0
          ) {
            // Simplify the name for better processing by the LLM
            const simplifiedName = schemeName
              .replace(/Regular Plan[ -]?Growth/i, '(Regular Growth)')
              .replace(/Direct Plan[ -]?Growth/i, '(Direct Growth)')
              .split(' - ')[0]; // Take the part before the first hyphen
  
            return {
              name: simplifiedName,
              description: `A mutual fund with a Net Asset Value (NAV) of ₹${nav}.`,
            };
          }
        }
        return null;
      })
      .filter((p): p is { name: string; description: string } => p !== null && p.name.length < 50) // Filter out very long names
      .slice(0, 3); // Return a smaller subset to avoid overwhelming the user
  
    return products;
  }

/**
 * Fetches investment products from AMFI, using a cache to avoid repeated downloads.
 */
async function getInvestmentProducts(): Promise<Omit<Product, 'id' | 'category'>[]> {
    const now = Date.now();
    // Check if cache is valid (not empty and not older than 24 hours)
    if (amfiCache && now - lastFetchTimestamp < CACHE_DURATION_MS) {
      console.log('Serving investment products from cache.');
      return amfiCache;
    }

    console.log('Fetching fresh investment products from AMFI.');
    try {
      const response = await fetch('https://www.amfiindia.com/spages/NAVAll.txt');
      if (!response.ok) {
        console.error('Failed to fetch AMFI data, falling back to mock data.');
        return getMockProducts('investment');
      }
      const textData = await response.text();
      const parsedData = parseAmfiData(textData);

      if (parsedData.length > 0) {
        // Update cache
        amfiCache = parsedData;
        lastFetchTimestamp = now;
        return parsedData;
      } else {
        // Fallback if parsing returns no data
        return getMockProducts('investment');
      }
    } catch (error) {
      console.error('Error fetching or parsing AMFI data:', error);
      // Fallback to mock data in case of any network or parsing error
      return getMockProducts('investment');
    }
}


/**
 * Fetches a list of financial products based on a category.
 * @param category The category of products to fetch.
 * @returns A promise that resolves to an array of products.
 */
export async function getProducts(category: ProductCategory): Promise<Omit<Product, 'id' | 'category'>[]> {
  if (category === 'investment') {
    return getInvestmentProducts();
  }

  // For other categories, use the mock service.
  return getMockProducts(category);
}

/**
 * Returns mock product data after a simulated delay.
 * @param category The category of products to fetch.
 */
function getMockProducts(category: ProductCategory): Promise<Omit<Product, 'id' | 'category'>[]> {
    console.log(`Serving mock products for category: ${category}`);
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