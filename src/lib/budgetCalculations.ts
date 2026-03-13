/**
 * Budget Calculation Engine for Fiscal
 * Implements the 50/30/20 rule with dynamic allocation
 * 50% = Needs (housing, food, transportation)
 * 30% = Wants (entertainment, dining out, subscriptions)
 * 20% = Savings & Debt Repayment
 */

export interface BudgetAllocation {
  needs: number;        // 50%
  wants: number;        // 30%
  savings: number;      // 20%
}

export interface BudgetCategory {
  name: string;
  type: 'needs' | 'wants' | 'savings';
  allocated: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
}

export interface BudgetSummary {
  monthlyIncome: number;
  allocations: BudgetAllocation;
  categories: BudgetCategory[];
  totalSpent: number;
  totalRemaining: number;
  overallPercentageUsed: number;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  category: string;
  type: 'warning' | 'danger';
  message: string;
  percentageUsed: number;
}

// Default 50/30/20 allocation
export const DEFAULT_ALLOCATION = {
  needs: 0.5,
  wants: 0.3,
  savings: 0.2,
};

/**
 * Calculate budget allocations based on monthly income
 */
export function calculateBudgetAllocations(
  monthlyIncome: number,
  customAllocation?: Partial<BudgetAllocation>
): BudgetAllocation {
  if (!customAllocation) {
    return {
      needs: monthlyIncome * DEFAULT_ALLOCATION.needs,
      wants: monthlyIncome * DEFAULT_ALLOCATION.wants,
      savings: monthlyIncome * DEFAULT_ALLOCATION.savings,
    };
  }

  // Validate custom allocation
  const total = (customAllocation.needs || 0) + (customAllocation.wants || 0) + (customAllocation.savings || 0);
  
  return {
    needs: customAllocation.needs ?? monthlyIncome * DEFAULT_ALLOCATION.needs,
    wants: customAllocation.wants ?? monthlyIncome * DEFAULT_ALLOCATION.wants,
    savings: customAllocation.savings ?? monthlyIncome * DEFAULT_ALLOCATION.savings,
  };
}

/**
 * Default budget categories with their types
 */
export const DEFAULT_BUDGET_CATEGORIES = [
  // Needs (50%)
  { name: 'Groceries', type: 'needs' as const },
  { name: 'Utilities', type: 'needs' as const },
  { name: 'Rent/Mortgage', type: 'needs' as const },
  { name: 'Transportation', type: 'needs' as const },
  { name: 'Insurance', type: 'needs' as const },
  { name: 'Healthcare', type: 'needs' as const },
  
  // Wants (30%)
  { name: 'Dining Out', type: 'wants' as const },
  { name: 'Entertainment', type: 'wants' as const },
  { name: 'Shopping', type: 'wants' as const },
  { name: 'Subscriptions', type: 'wants' as const },
  { name: 'Travel', type: 'wants' as const },
  { name: 'Hobbies', type: 'wants' as const },
  
  // Savings & Debt
  { name: 'Emergency Fund', type: 'savings' as const },
  { name: 'Debt Repayment', type: 'savings' as const },
  { name: 'Investments', type: 'savings' as const },
  { name: 'Retirement', type: 'savings' as const },
];

/**
 * Build budget categories with allocated amounts
 */
export function buildBudgetCategories(
  allocations: BudgetAllocation,
  spending: Record<string, number> = {}
): BudgetCategory[] {
  return DEFAULT_BUDGET_CATEGORIES.map(cat => {
    const budgetAmount = getCategoryBudget(allocations, cat.type);
    const spent = spending[cat.name] || 0;
    const remaining = Math.max(0, budgetAmount - spent);
    const percentageUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

    return {
      name: cat.name,
      type: cat.type,
      allocated: budgetAmount,
      spent,
      remaining,
      percentageUsed,
    };
  });
}

/**
 * Get the budget amount for a specific category type
 */
function getCategoryBudget(allocations: BudgetAllocation, type: 'needs' | 'wants' | 'savings'): number {
  // Distribute budget within each type equally among categories
  const categoryCountByType = {
    needs: DEFAULT_BUDGET_CATEGORIES.filter(c => c.type === 'needs').length,
    wants: DEFAULT_BUDGET_CATEGORIES.filter(c => c.type === 'wants').length,
    savings: DEFAULT_BUDGET_CATEGORIES.filter(c => c.type === 'savings').length,
  };

  const allocationForType = allocations[type];
  return allocationForType / categoryCountByType[type];
}

/**
 * Generate budget alerts for overspending
 */
export function generateBudgetAlerts(categories: BudgetCategory[]): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  categories.forEach(category => {
    if (category.percentageUsed >= 100) {
      alerts.push({
        category: category.name,
        type: 'danger',
        message: `You've exceeded your ${category.name} budget! ${category.spent.toFixed(0)} of ${category.allocated.toFixed(0)} spent.`,
        percentageUsed: category.percentageUsed,
      });
    } else if (category.percentageUsed >= 80) {
      alerts.push({
        category: category.name,
        type: 'warning',
        message: `You're at ${category.percentageUsed.toFixed(0)}% of your ${category.name} budget.`,
        percentageUsed: category.percentageUsed,
      });
    }
  });

  return alerts;
}

/**
 * Calculate summary statistics for the budget
 */
export function calculateBudgetSummary(
  monthlyIncome: number,
  spending: Record<string, number> = {},
  customAllocation?: Partial<BudgetAllocation>
): BudgetSummary {
  const allocations = calculateBudgetAllocations(monthlyIncome, customAllocation);
  const categories = buildBudgetCategories(allocations, spending);
  
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalAllocated = monthlyIncome;
  const totalRemaining = Math.max(0, totalAllocated - totalSpent);
  const overallPercentageUsed = (totalSpent / totalAllocated) * 100;
  
  const alerts = generateBudgetAlerts(categories);

  return {
    monthlyIncome,
    allocations,
    categories,
    totalSpent,
    totalRemaining,
    overallPercentageUsed,
    alerts,
  };
}

/**
 * Calculate emergency fund target (6 months of essential expenses)
 */
export function calculateEmergencyFundTarget(
  monthlyNeeds: number,
  dependents: number = 0
): number {
  // Base emergency fund: 6 months of needs
  const baseEmergencyFund = monthlyNeeds * 6;
  
  // Additional buffer for dependents (15% per dependent)
  const dependentBuffer = baseEmergencyFund * (dependents * 0.15);
  
  return baseEmergencyFund + dependentBuffer;
}

/**
 * Calculate overspending impact and recommendations
 */
export function getOverspendingRecommendations(
  categories: BudgetCategory[]
): { category: string; recommendation: string; savingsPotential: number }[] {
  const recommendations: { category: string; recommendation: string; savingsPotential: number }[] = [];

  categories
    .filter(cat => cat.percentageUsed > 100)
    .forEach(category => {
      const overspent = category.spent - category.allocated;
      recommendations.push({
        category: category.name,
        recommendation: `Reduce ${category.name} spending by ${overspent.toFixed(0)} to stay within budget.`,
        savingsPotential: overspent,
      });
    });

  return recommendations;
}

/**
 * Calculate spending trend (month-over-month)
 */
export function calculateSpendingTrend(
  currentMonthSpending: number,
  previousMonthSpending: number
): { trend: 'up' | 'down' | 'stable'; percentageChange: number } {
  if (previousMonthSpending === 0) {
    return { trend: 'stable', percentageChange: 0 };
  }

  const change = currentMonthSpending - previousMonthSpending;
  const percentageChange = (change / previousMonthSpending) * 100;

  return {
    trend: percentageChange > 5 ? 'up' : percentageChange < -5 ? 'down' : 'stable',
    percentageChange,
  };
}
