// src/services/financial-product-service.ts
/**
 * @fileOverview A service for fetching financial products.
 * In a real-world application, this service would interact with a database
 * or an external Financial API provider. For this prototype, it returns
 * hardcoded sample data and fetches real data from AMFI.
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
 * Parses and filters the raw text data from the AMFI NAV file to get a diverse sample.
 * @param textData The raw text data from the AMFI file.
 * @returns An array of financial products.
 */
function parseAmfiData(textData: string): Omit<Product, 'id' | 'category'>[] {
  const lines = textData.split('\n').filter(line => line.includes(';'));

  const fundCategories = {
    equityLargeCap: [] as any[],
    equityMidCap: [] as any[],
    equitySmallCap: [] as any[],
    debt: [] as any[],
    hybrid: [] as any[],
    index: [] as any[],
  };

  const seenNames = new Set();

  for (const line of lines) {
    const parts = line.split(';');
    // Scheme Code;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
    if (parts.length >= 6) {
      const schemeName = parts[3]?.trim();
      const nav = parts[4]?.trim();

      if (
        schemeName &&
        schemeName.toLowerCase().includes('growth') &&
        !schemeName.toLowerCase().includes('idcw') &&
        nav &&
        !isNaN(parseFloat(nav)) &&
        parseFloat(nav) > 0
      ) {
        const simplifiedName = schemeName
          .replace(/Regular Plan[ -]?Growth/i, '(Regular)')
          .replace(/Direct Plan[ -]?Growth/i, '(Direct)')
          .split(' - ')[0]
          .replace(/\s+/g, ' ')
          .trim();
        
        if (simplifiedName.length > 50 || seenNames.has(simplifiedName)) {
            continue;
        }

        const lowerCaseName = simplifiedName.toLowerCase();
        let fundType = 'Other';

        if (lowerCaseName.includes('large cap') && fundCategories.equityLargeCap.length < 2) {
            fundType = 'Equity - Large Cap';
            fundCategories.equityLargeCap.push({ name: simplifiedName, description: `A ${fundType} fund with NAV of ₹${nav}.` });
            seenNames.add(simplifiedName);
        } else if (lowerCaseName.includes('mid cap') && fundCategories.equityMidCap.length < 2) {
            fundType = 'Equity - Mid Cap';
            fundCategories.equityMidCap.push({ name: simplifiedName, description: `A ${fundType} fund with NAV of ₹${nav}.` });
            seenNames.add(simplifiedName);
        } else if (lowerCaseName.includes('small cap') && fundCategories.equitySmallCap.length < 1) {
            fundType = 'Equity - Small Cap';
            fundCategories.equitySmallCap.push({ name: simplifiedName, description: `A ${fundType} fund with NAV of ₹${nav}.` });
            seenNames.add(simplifiedName);
        } else if ((lowerCaseName.includes('debt') || lowerCaseName.includes('bond')) && fundCategories.debt.length < 2) {
            fundType = 'Debt Fund';
            fundCategories.debt.push({ name: simplifiedName, description: `A ${fundType} with NAV of ₹${nav}.` });
            seenNames.add(simplifiedName);
        } else if (lowerCaseName.includes('hybrid') && fundCategories.hybrid.length < 1) {
            fundType = 'Hybrid Fund';
            fundCategories.hybrid.push({ name: simplifiedName, description: `A ${fundType} with NAV of ₹${nav}.` });
            seenNames.add(simplifiedName);
        } else if ((lowerCaseName.includes('index') || lowerCaseName.includes('nifty') || lowerCaseName.includes('sensex')) && fundCategories.index.length < 1) {
            fundType = 'Index Fund';
            fundCategories.index.push({ name: simplifiedName, description: `An ${fundType} with NAV of ₹${nav}.` });
            seenNames.add(simplifiedName);
        }
      }
    }
  }

  const allFunds = [
      ...fundCategories.equityLargeCap,
      ...fundCategories.equityMidCap,
      ...fundCategories.equitySmallCap,
      ...fundCategories.debt,
      ...fundCategories.hybrid,
      ...fundCategories.index,
  ];
  
  // Fallback if parsing returns no data
  if (allFunds.length === 0) {
      return getMockProducts('investment');
  }
    
  return allFunds;
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
      // Using a proxy to bypass potential CORS issues in some environments
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
