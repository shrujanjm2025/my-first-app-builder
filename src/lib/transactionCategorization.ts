/**
 * Transaction Categorization Engine
 * Automatically categorizes transactions based on keywords, merchant names, and rules
 */

export type TransactionType = 'expense' | 'income';
export type TransactionCategory =
  | 'Groceries'
  | 'Utilities'
  | 'Rent/Mortgage'
  | 'Transportation'
  | 'Insurance'
  | 'Healthcare'
  | 'Dining Out'
  | 'Entertainment'
  | 'Shopping'
  | 'Subscriptions'
  | 'Travel'
  | 'Hobbies'
  | 'Emergency Fund'
  | 'Debt Repayment'
  | 'Investments'
  | 'Retirement'
  | 'Salary'
  | 'Freelance'
  | 'Bonus'
  | 'Refund'
  | 'Other';

export interface CategoryRule {
  keywords: string[];
  category: TransactionCategory;
  type: TransactionType;
  confidence: number; // 0.5 to 1.0
}

// Categorization rules based on merchant names and keywords
export const CATEGORIZATION_RULES: CategoryRule[] = [
  // Groceries
  {
    keywords: [
      'grocery',
      'supermarket',
      'whole foods',
      'trader joe',
      'safeway',
      'kroger',
      'tesco',
      'walmart',
      'flipkart grocery',
      'blinkit',
      'instamart',
      'zepto',
    ],
    category: 'Groceries',
    type: 'expense',
    confidence: 0.95,
  },
  // Dining Out
  {
    keywords: [
      'restaurant',
      'cafe',
      'coffee',
      'pizza',
      'burger',
      'fastfood',
      'uber eats',
      'doordash',
      'zomato',
      'swiggy',
      'grubhub',
      'dunkin',
      'starbucks',
      'mcd',
      'kfc',
    ],
    category: 'Dining Out',
    type: 'expense',
    confidence: 0.9,
  },
  // Transportation
  {
    keywords: [
      'uber',
      'lyft',
      'taxi',
      'gas',
      'fuel',
      'parking',
      'toll',
      'metro',
      'transit',
      'railway',
      'airlines',
      'flight',
      'bus',
      'ola',
      'rapido',
    ],
    category: 'Transportation',
    type: 'expense',
    confidence: 0.9,
  },
  // Utilities
  {
    keywords: [
      'electricity',
      'water',
      'internet',
      'phone',
      'mobile',
      'broadband',
      'utility',
      'power company',
      'gas bill',
      'telephone',
      'wifi',
    ],
    category: 'Utilities',
    type: 'expense',
    confidence: 0.95,
  },
  // Rent/Mortgage
  {
    keywords: [
      'rent',
      'mortgage',
      'landlord',
      'property management',
      'lease',
      'housing',
    ],
    category: 'Rent/Mortgage',
    type: 'expense',
    confidence: 0.95,
  },
  // Insurance
  {
    keywords: [
      'insurance',
      'axa',
      'hdfc insurance',
      'icici insurance',
      'max insurance',
      'sbi insurance',
      'premium',
      'policy',
    ],
    category: 'Insurance',
    type: 'expense',
    confidence: 0.9,
  },
  // Healthcare
  {
    keywords: [
      'hospital',
      'pharmacy',
      'doctor',
      'clinic',
      'medical',
      'health',
      'prescription',
      'dental',
      'apollo',
      'fortis',
      'max healthcare',
      'cvs',
      'walgreens',
    ],
    category: 'Healthcare',
    type: 'expense',
    confidence: 0.9,
  },
  // Shopping
  {
    keywords: [
      'amazon',
      'ebay',
      'shop',
      'store',
      'mall',
      'fashion',
      'clothing',
      'apparel',
      'shoes',
      'myntra',
      'ajio',
      'uniqlo',
      'h&m',
      'zara',
      'urban outfitters',
    ],
    category: 'Shopping',
    type: 'expense',
    confidence: 0.85,
  },
  // Entertainment
  {
    keywords: [
      'movie',
      'cinema',
      'netflix',
      'spotify',
      'gaming',
      'playstation',
      'xbox',
      'steam',
      'hulu',
      'prime video',
      'disney',
      'theater',
      'concert',
      'event',
    ],
    category: 'Entertainment',
    type: 'expense',
    confidence: 0.9,
  },
  // Subscriptions
  {
    keywords: [
      'subscription',
      'monthly',
      'recurring',
      'spotify',
      'adobe',
      'microsoft',
      'apple one',
      'amazon prime',
      'gym',
      'membership',
      'app store',
    ],
    category: 'Subscriptions',
    type: 'expense',
    confidence: 0.85,
  },
  // Travel
  {
    keywords: [
      'hotel',
      'airbnb',
      'booking',
      'travel',
      'resort',
      'lodging',
      'vacation',
      'trip',
    ],
    category: 'Travel',
    type: 'expense',
    confidence: 0.9,
  },
  // Investments
  {
    keywords: [
      'brokerage',
      'etrade',
      'fidelity',
      'stock',
      'investment',
      'mutual fund',
      'zerodha',
      'upstox',
      'icici direct',
    ],
    category: 'Investments',
    type: 'expense',
    confidence: 0.9,
  },
  // Income - Salary
  {
    keywords: [
      'salary',
      'payroll',
      'employer',
      'deposit',
      'direct deposit',
    ],
    category: 'Salary',
    type: 'income',
    confidence: 0.95,
  },
  // Income - Freelance
  {
    keywords: [
      'freelance',
      'client payment',
      'project',
      'contract',
      'consulting',
      'upwork',
      'fiverr',
    ],
    category: 'Freelance',
    type: 'income',
    confidence: 0.85,
  },
  // Income - Bonus
  {
    keywords: [
      'bonus',
      'incentive',
      'reward',
      'cashback',
    ],
    category: 'Bonus',
    type: 'income',
    confidence: 0.85,
  },
  // Refunds
  {
    keywords: [
      'refund',
      'return',
      'credit',
      'adjustment',
    ],
    category: 'Refund',
    type: 'income',
    confidence: 0.9,
  },
];

/**
 * Categorize a transaction based on its description
 */
export function categorizeTransaction(
  description: string,
  merchantName?: string
): { category: TransactionCategory; confidence: number } {
  const searchText = `${description} ${merchantName || ''}`.toLowerCase();

  let bestMatch: CategoryRule | null = null;
  let highestConfidence = 0;

  for (const rule of CATEGORIZATION_RULES) {
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        if (rule.confidence > highestConfidence) {
          bestMatch = rule;
          highestConfidence = rule.confidence;
        }
        break; // Found a match for this rule
      }
    }
  }

  return {
    category: bestMatch?.category || 'Other',
    confidence: highestConfidence,
  };
}

/**
 * Get category type (expense or income)
 */
export function getCategoryType(category: TransactionCategory): TransactionType {
  const rule = CATEGORIZATION_RULES.find(r => r.category === category);
  return rule?.type || 'expense';
}

/**
 * Get all categories grouped by type
 */
export function getCategoriesGroupedByType(): Record<TransactionType, TransactionCategory[]> {
  const grouped: Record<TransactionType, TransactionCategory[]> = {
    expense: [],
    income: [],
  };

  CATEGORIZATION_RULES.forEach(rule => {
    if (!grouped[rule.type].includes(rule.category)) {
      grouped[rule.type].push(rule.category);
    }
  });

  return grouped;
}

/**
 * Get suggested categories based on confidence
 */
export function getSuggestedCategories(
  description: string,
  merchantName?: string,
  topN: number = 3
): Array<{ category: TransactionCategory; confidence: number }> {
  const searchText = `${description} ${merchantName || ''}`.toLowerCase();
  const suggestions: Array<{ category: TransactionCategory; confidence: number }> = [];

  const ruleMatches = CATEGORIZATION_RULES.map(rule => {
    let matchScore = 0;
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        matchScore = Math.max(matchScore, rule.confidence);
      }
    }
    return { rule, matchScore };
  }).filter(m => m.matchScore > 0);

  // Sort by match score and get top N
  const topSuggestions = ruleMatches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN)
    .map(m => ({
      category: m.rule.category,
      confidence: m.matchScore,
    }));

  return topSuggestions.length > 0
    ? topSuggestions
    : [{ category: 'Other', confidence: 0.5 }];
}

/**
 * Update transaction categorization confidence based on user feedback
 * (Used to improve automatic categorization over time)
 */
export function updateCategorizationRule(
  description: string,
  selectedCategory: TransactionCategory,
  confidence: number = 0.8
): void {
  // This would typically be saved to a user-specific rules database
  // and used to train a personalized categorization model
  console.log(`User selected: "${description}" -> ${selectedCategory} (confidence: ${confidence})`);
}
