/**
 * Goal Calculations Engine
 * Implements inflation-adjusted SMART goal tracking and projections
 * Formula: FV = PV * (1 + i)^n
 * PMT = FV / [((1 + r)^m - 1) / r]
 */

export interface SMARTGoal {
  id: string;
  name: string;
  currentCost: number; // Present Value (PV)
  targetYear: number; // Years from now
  expectedInflationRate: number; // Annual inflation rate (e.g., 0.04 for 4%)
  expectedReturnRate: number; // Annual investment return (e.g., 0.08 for 8%)
  currentSavings: number;
  created_at?: string;
  updated_at?: string;
}

export interface GoalProjection {
  goal: SMARTGoal;
  futureValue: number;
  requiredMonthlySavings: number;
  totalMonthsNeeded: number;
  savingsProgress: number; // Percentage: 0-100
  isAchievable: boolean; // Whether goal can be achieved with calculated monthly savings
  projectedCompletionDate: Date;
  inflationAdjustmentFactor: number;
}

export interface GoalComparison {
  currentValue: number;
  futureValueWithoutInflation: number;
  futureValueWithInflation: number;
  inflationImpact: number;
  percentageIncrease: number;
}

/**
 * Calculate future value of a goal considering inflation
 * FV = PV * (1 + inflation_rate)^years
 */
export function calculateFutureValueWithInflation(
  presentValue: number,
  inflationRate: number,
  years: number
): number {
  return presentValue * Math.pow(1 + inflationRate, years);
}

/**
 * Calculate monthly savings required to reach a goal
 * PMT = FV / [((1 + r)^m - 1) / r]
 * where m = total months, r = monthly return rate
 */
export function calculateRequiredMonthlySavings(
  futureValue: number,
  monthlyReturnRate: number,
  totalMonths: number
): number {
  if (totalMonths <= 0) return 0;
  if (monthlyReturnRate === 0) return futureValue / totalMonths;

  const denominator = (Math.pow(1 + monthlyReturnRate, totalMonths) - 1) / monthlyReturnRate;
  return futureValue / denominator;
}

/**
 * Convert annual return rate to monthly rate
 */
export function annualToMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Calculate goal projection with all metrics
 */
export function calculateGoalProjection(goal: SMARTGoal): GoalProjection {
  const years = goal.targetYear;
  const months = years * 12;
  
  // Future value considering inflation
  const futureValue = calculateFutureValueWithInflation(
    goal.currentCost,
    goal.expectedInflationRate,
    years
  );
  
  // Monthly return rate
  const monthlyReturnRate = annualToMonthlyRate(goal.expectedReturnRate);
  
  // Required monthly savings
  const totalAmountNeeded = Math.max(0, futureValue - goal.currentSavings);
  const requiredMonthlySavings = calculateRequiredMonthlySavings(
    totalAmountNeeded,
    monthlyReturnRate,
    months
  );
  
  // Savings progress
  const savingsProgress = goal.currentSavings > 0
    ? Math.min((goal.currentSavings / totalAmountNeeded) * 100, 100)
    : 0;
  
  // Projected completion date
  const projectedCompletionDate = new Date();
  projectedCompletionDate.setFullYear(projectedCompletionDate.getFullYear() + years);
  
  // Check if achievable (simplified: if monthly savings is reasonable)
  const isAchievable = requiredMonthlySavings > 0 && requiredMonthlySavings < futureValue / 12;
  
  return {
    goal,
    futureValue,
    requiredMonthlySavings,
    totalMonthsNeeded: months,
    savingsProgress,
    isAchievable,
    projectedCompletionDate,
    inflationAdjustmentFactor: futureValue / goal.currentCost,
  };
}

/**
 * Compare goal values with and without inflation
 */
export function compareGoalWithInflation(
  presentValue: number,
  inflationRate: number,
  years: number
): GoalComparison {
  const futureValueWithoutInflation = presentValue;
  const futureValueWithInflation = calculateFutureValueWithInflation(
    presentValue,
    inflationRate,
    years
  );
  const inflationImpact = futureValueWithInflation - futureValueWithoutInflation;
  const percentageIncrease = ((futureValueWithInflation / presentValue) - 1) * 100;

  return {
    currentValue: presentValue,
    futureValueWithoutInflation,
    futureValueWithInflation,
    inflationImpact,
    percentageIncrease,
  };
}

/**
 * Calculate multiple goals' combined savings requirement
 */
export function calculateCombinedSavingsRequirement(
  goals: SMARTGoal[]
): { totalMonthlySavings: number; achievable: boolean; goals: GoalProjection[] } {
  const projections = goals.map(goal => calculateGoalProjection(goal));
  const totalMonthlySavings = projections.reduce((sum, p) => sum + p.requiredMonthlySavings, 0);
  const achievable = projections.every(p => p.isAchievable);

  return {
    totalMonthlySavings,
    achievable,
    goals: projections,
  };
}

/**
 * Get default inflation and return rates by country
 */
export function getDefaultRatesForCountry(
  countryCode: string
): { inflation: number; returnRate: number } {
  const rates: Record<string, { inflation: number; returnRate: number }> = {
    IN: { inflation: 0.045, returnRate: 0.08 }, // India: 4.5% inflation, 8% return
    US: { inflation: 0.03, returnRate: 0.07 }, // USA: 3% inflation, 7% return
    GB: { inflation: 0.025, returnRate: 0.06 }, // UK: 2.5% inflation, 6% return
    AU: { inflation: 0.03, returnRate: 0.07 }, // Australia: 3% inflation, 7% return
    CA: { inflation: 0.025, returnRate: 0.06 }, // Canada: 2.5% inflation, 6% return
    SG: { inflation: 0.02, returnRate: 0.06 }, // Singapore: 2% inflation, 6% return
  };

  return rates[countryCode] || { inflation: 0.04, returnRate: 0.07 }; // Default
}

/**
 * Calculate time to achieve goal
 */
export function calculateTimeToAchieveGoal(
  futureValue: number,
  currentSavings: number,
  monthlySavings: number,
  monthlyReturnRate: number
): number {
  if (monthlySavings <= 0) return Infinity;
  if (currentSavings >= futureValue) return 0;

  const remainingAmount = futureValue - currentSavings;
  
  // With compound interest: FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
  // Solving for n (months) requires numerical methods
  // Simplified linear approximation:
  
  if (monthlyReturnRate === 0) {
    return Math.ceil(remainingAmount / monthlySavings);
  }
  
  // Newton's method or binary search would be more accurate
  // For now, using iterative calculation
  let balance = currentSavings;
  let months = 0;
  
  while (balance < futureValue && months < 1200) { // Max 100 years
    balance = balance * (1 + monthlyReturnRate) + monthlySavings;
    months++;
  }
  
  return months >= 1200 ? Infinity : months;
}

/**
 * Format goal summary
 */
export function formatGoalSummary(projection: GoalProjection): string {
  const { goal, futureValue, requiredMonthlySavings, isAchievable, projectedCompletionDate } = projection;

  return `
Goal: ${goal.name}
Current Cost: ₹${goal.currentCost.toLocaleString()}
Future Value (with ${(goal.expectedInflationRate * 100).toFixed(1)}% inflation): ₹${futureValue.toLocaleString()}
Required Monthly Savings: ₹${requiredMonthlySavings.toLocaleString()}
Projected Completion: ${projectedCompletionDate.toLocaleDateString()}
Achievable: ${isAchievable ? 'Yes ✓' : 'No ✗'}
  `.trim();
}
