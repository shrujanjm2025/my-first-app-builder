/**
 * Emergency Fund Calculator
 * Determines the recommended emergency fund target and progress
 */

export interface EmergencyFundAnalysis {
  monthlyNeeds: number;
  dependents: number;
  targetMonths: number;
  baseTarget: number;
  dependentBuffer: number;
  totalTarget: number;
  currentSavings: number;
  progress: number; // 0-100
  monthsCovered: number;
  isAdequate: boolean;
  shortfall: number;
  monthlyContributionNeeded: number;
}

/**
 * Calculate emergency fund target based on essential needs and dependents
 * Formula: Base = Monthly Needs × Months to Cover
 *          With Dependents = Base × (1 + 0.15 × Number of Dependents)
 */
export function calculateEmergencyFundTarget(
  monthlyNeeds: number,
  dependents: number = 0,
  targetMonths: number = 6
): { baseTarget: number; dependentBuffer: number; totalTarget: number } {
  const baseTarget = monthlyNeeds * targetMonths;
  const dependentBuffer = baseTarget * (dependents * 0.15); // 15% additional per dependent
  const totalTarget = baseTarget + dependentBuffer;

  return {
    baseTarget,
    dependentBuffer,
    totalTarget,
  };
}

/**
 * Analyze emergency fund status
 */
export function analyzeEmergencyFund(
  monthlyNeeds: number,
  currentSavings: number,
  dependents: number = 0,
  targetMonths: number = 6
): EmergencyFundAnalysis {
  const { baseTarget, dependentBuffer, totalTarget } = calculateEmergencyFundTarget(
    monthlyNeeds,
    dependents,
    targetMonths
  );

  const progress = Math.min((currentSavings / totalTarget) * 100, 100);
  const monthsCovered = totalTarget > 0 ? (currentSavings / monthlyNeeds) : 0;
  const isAdequate = monthsCovered >= targetMonths;
  const shortfall = Math.max(0, totalTarget - currentSavings);
  const monthlyContributionNeeded = shortfall > 0 ? Math.ceil(shortfall / (12 * 2)) : 0; // 2 years to reach goal

  return {
    monthlyNeeds,
    dependents,
    targetMonths,
    baseTarget,
    dependentBuffer,
    totalTarget,
    currentSavings,
    progress,
    monthsCovered,
    isAdequate,
    shortfall,
    monthlyContributionNeeded,
  };
}

/**
 * Get emergency fund adequacy status
 */
export function getEmergencyFundStatus(monthsCovered: number): {
  status: 'critical' | 'low' | 'moderate' | 'adequate' | 'excellent';
  description: string;
  color: string;
} {
  if (monthsCovered < 1) {
    return {
      status: 'critical',
      description: 'Less than 1 month covered',
      color: 'text-destructive',
    };
  }
  if (monthsCovered < 3) {
    return {
      status: 'low',
      description: 'Below recommended 6 months',
      color: 'text-yellow-500',
    };
  }
  if (monthsCovered < 6) {
    return {
      status: 'moderate',
      description: 'Below recommended 6 months',
      color: 'text-amber-500',
    };
  }
  if (monthsCovered < 12) {
    return {
      status: 'adequate',
      description: 'Meets recommended 6 months',
      color: 'text-primary',
    };
  }
  return {
    status: 'excellent',
    description: 'Exceeds recommended 6 months',
    color: 'text-green-500',
  };
}

/**
 * Calculate contribution schedule to reach emergency fund goal
 */
export function calculateContributionSchedule(
  currentSavings: number,
  targetAmount: number,
  months: number
): { monthlyContribution: number; acceleratedMonthly: number; timeToGoal: number } {
  const shortfall = Math.max(0, targetAmount - currentSavings);
  const monthlyContribution = months > 0 ? shortfall / months : shortfall;
  const acceleratedMonthly = months > 0 ? (shortfall / months) * 1.2 : shortfall; // 20% faster

  let balance = currentSavings;
  let timeToGoal = 0;
  while (balance < targetAmount && timeToGoal < 240) {
    balance += monthlyContribution;
    timeToGoal++;
  }

  return {
    monthlyContribution,
    acceleratedMonthly,
    timeToGoal,
  };
}

/**
 * Get emergency fund recommendations
 */
export function getEmergencyFundRecommendations(
  analysis: EmergencyFundAnalysis
): string[] {
  const recommendations: string[] = [];

  if (!analysis.isAdequate) {
    recommendations.push(
      `Build your emergency fund to ₹${analysis.totalTarget.toLocaleString()} (${analysis.targetMonths} months of expenses).`
    );
  }

  if (analysis.dependents > 0 && analysis.progress < 50) {
    recommendations.push(
      `With ${analysis.dependents} dependent(s), prioritize building your emergency fund to ${analysis.totalTarget} (includes ${analysis.dependentBuffer.toFixed(0)} dependent buffer).`
    );
  }

  if (analysis.progress < 25) {
    recommendations.push('Start with a target of 3 months of essential expenses, then expand to 6 months.');
  }

  if (analysis.monthsCovered < 3) {
    recommendations.push(
      `Current savings cover ${analysis.monthsCovered.toFixed(1)} months. Aim to save ₹${analysis.monthlyContributionNeeded.toLocaleString()} monthly to reach your goal.`
    );
  }

  if (analysis.isAdequate) {
    recommendations.push(
      `Great! Your emergency fund covers ${analysis.monthsCovered.toFixed(1)} months of expenses. Consider redirecting additional savings to other financial goals.`
    );
  }

  return recommendations;
}

/**
 * Calculate impact of emergency fund drawdown
 */
export function calculateEmergencyDrawdownImpact(
  analysis: EmergencyFundAnalysis,
  monthsOfExpensesToCover: number
): {
  fundsNeeded: number;
  remainingAfterDrawdown: number;
  remainingCoverage: number;
} {
  const fundsNeeded = analysis.monthlyNeeds * monthsOfExpensesToCover;
  const remainingAfterDrawdown = Math.max(0, analysis.currentSavings - fundsNeeded);
  const remainingCoverage = remainingAfterDrawdown / analysis.monthlyNeeds;

  return {
    fundsNeeded,
    remainingAfterDrawdown,
    remainingCoverage,
  };
}
