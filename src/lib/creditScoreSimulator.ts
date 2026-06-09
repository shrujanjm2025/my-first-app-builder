/**
 * Credit Score Simulator
 * Simulates credit score changes based on user financial actions
 * Covers key CIBIL/credit scoring factors
 */

export interface CreditScoreFactors {
  paymentHistory: number; // 35% weight
  creditUtilization: number; // 30% weight (0-100%)
  creditMix: number; // 15% weight (0-100%)
  creditAgeAverage: number; // 10% weight (in years)
  hardInquiries: number; // 10% weight (count of recent inquiries)
}

export interface CreditScoreSimulation {
  currentScore: number;
  factors: CreditScoreFactors;
  simulations: Array<{
    scenario: string;
    newScore: number;
    scoreChange: number;
    impact: string;
  }>;
}

export const CREDIT_SCORE_RANGES = {
  excellent: { min: 750, max: 900, label: 'Excellent', color: 'text-primary' },
  good: { min: 650, max: 749, label: 'Good', color: 'text-accent' },
  fair: { min: 550, max: 649, label: 'Fair', color: 'text-yellow-500' },
  poor: { min: 300, max: 549, label: 'Poor', color: 'text-destructive' },
};

/**
 * Get credit score range label
 */
export function getCreditScoreLabel(score: number): string {
  for (const range of Object.values(CREDIT_SCORE_RANGES)) {
    if (score >= range.min && score <= range.max) {
      return range.label;
    }
  }
  return 'Unknown';
}

/**
 * Calculate credit score based on factors (simplified CIBIL model)
 * Weights: Payment History (35%), Utilization (30%), Mix (15%), Age (10%), Hard Inquiries (10%)
 */
export function calculateCreditScore(factors: CreditScoreFactors): number {
  // Normalize each factor to 0-100 scale
  const paymentHistoryScore = Math.min(100, factors.paymentHistory * 2.86); // Assuming max 35 points
  const utilizationScore = Math.max(0, 100 - factors.creditUtilization); // Lower utilization is better
  const creditMixScore = factors.creditMix; // Already 0-100
  const creditAgeScore = Math.min(100, (factors.creditAgeAverage / 7) * 100); // 7 years = max points
  const hardInquiriesScore = Math.max(0, 100 - (factors.hardInquiries * 10)); // Each inquiry: -10 points

  // Calculate weighted score
  const baseScore = 300; // Minimum CIBIL score
  const maxScore = 900; // Maximum CIBIL score
  const scoreRange = maxScore - baseScore;

  const weightedScore =
    (paymentHistoryScore * 0.35 +
      utilizationScore * 0.3 +
      creditMixScore * 0.15 +
      creditAgeScore * 0.1 +
      hardInquiriesScore * 0.1) /
    100;

  return Math.round(baseScore + weightedScore * scoreRange);
}

/**
 * Simulate credit score impact of paying off debt
 */
export function simulatePayOffDebt(
  currentScore: number,
  creditUtilizationBefore: number,
  creditUtilizationAfter: number,
  factors: CreditScoreFactors
): { newScore: number; scoreChange: number; impact: string } {
  const updatedFactors = {
    ...factors,
    creditUtilization: creditUtilizationAfter,
  };

  const newScore = calculateCreditScore(updatedFactors);
  const scoreChange = newScore - currentScore;
  const utilizationReduction = creditUtilizationBefore - creditUtilizationAfter;

  let impact = '';
  if (scoreChange >= 50) {
    impact = 'Significant improvement - focus on maintaining low utilization';
  } else if (scoreChange >= 20) {
    impact = 'Good improvement - continue paying on time';
  } else if (scoreChange > 0) {
    impact = 'Modest improvement - every point matters';
  }

  return { newScore, scoreChange, impact };
}

/**
 * Simulate credit score impact of new credit inquiry
 */
export function simulateNewCreditInquiry(
  currentScore: number,
  factors: CreditScoreFactors
): { newScore: number; scoreChange: number; impact: string } {
  const updatedFactors = {
    ...factors,
    hardInquiries: factors.hardInquiries + 1,
  };

  const newScore = calculateCreditScore(updatedFactors);
  const scoreChange = newScore - currentScore;

  return {
    newScore,
    scoreChange,
    impact: 'Hard inquiries can temporarily lower your score. Multiple inquiries in 30 days may be treated as one.',
  };
}

/**
 * Simulate credit score impact of missing a payment
 */
export function simulateMissedPayment(
  currentScore: number,
  factors: CreditScoreFactors,
  daysLate: number = 30
): { newScore: number; scoreChange: number; impact: string } {
  // Severe impact on payment history
  const paymentHistoryPenalty = daysLate <= 30 ? 5 : daysLate <= 60 ? 15 : 30;
  const updatedPaymentHistory = Math.max(0, factors.paymentHistory - paymentHistoryPenalty);

  const updatedFactors = {
    ...factors,
    paymentHistory: updatedPaymentHistory,
  };

  const newScore = calculateCreditScore(updatedFactors);
  const scoreChange = newScore - currentScore;

  return {
    newScore,
    scoreChange,
    impact: `Late payment of ${daysLate} days significantly impacts your score. Focus on paying on time to recover.`,
  };
}

/**
 * Simulate credit score improvement with perfect payment history
 */
export function simulatePerfectPayments(
  currentScore: number,
  factors: CreditScoreFactors,
  months: number = 6
): { newScore: number; scoreChange: number; impact: string } {
  // Gradual improvement with perfect payments
  const improvementRate = 1 + (months / 100); // ~1 point per month typically
  const updatedFactors = {
    ...factors,
    paymentHistory: Math.min(35, factors.paymentHistory + months * 0.5),
  };

  const newScore = calculateCreditScore(updatedFactors);
  const scoreChange = newScore - currentScore;

  return {
    newScore,
    scoreChange,
    impact: `Maintaining perfect payments for ${months} months helps rebuild your credit steadily.`,
  };
}

/**
 * Get credit limit recommendation based on credit score
 */
export function getCreditLimitRecommendation(
  creditScore: number
): { maxLimit: number; recommendedUtilization: number; description: string } {
  if (creditScore >= 750) {
    return {
      maxLimit: 500000,
      recommendedUtilization: 30,
      description: 'Excellent credit - you qualify for premium credit products',
    };
  }
  if (creditScore >= 650) {
    return {
      maxLimit: 300000,
      recommendedUtilization: 30,
      description: 'Good credit - maintain low utilization to improve further',
    };
  }
  if (creditScore >= 550) {
    return {
      maxLimit: 150000,
      recommendedUtilization: 20,
      description: 'Fair credit - focus on paying on time to improve',
    };
  }
  return {
    maxLimit: 50000,
    recommendedUtilization: 10,
    description: 'Building credit - keep utilization very low and pay on time',
  };
}

/**
 * Generate all simulation scenarios
 */
export function generateCreditScoreSimulations(
  currentScore: number,
  factors: CreditScoreFactors
): CreditScoreSimulation {
  const simulations = [
    {
      scenario: 'Pay off 50% of credit card debt',
      ...simulatePayOffDebt(currentScore, factors.creditUtilization, factors.creditUtilization * 0.5, factors),
    },
    {
      scenario: 'Pay off all credit card debt',
      ...simulatePayOffDebt(currentScore, factors.creditUtilization, 10, factors),
    },
    {
      scenario: 'New credit card inquiry',
      ...simulateNewCreditInquiry(currentScore, factors),
    },
    {
      scenario: 'Miss a payment (30 days late)',
      ...simulateMissedPayment(currentScore, factors, 30),
    },
    {
      scenario: '6 months of perfect payments',
      ...simulatePerfectPayments(currentScore, factors, 6),
    },
    {
      scenario: '12 months of perfect payments',
      ...simulatePerfectPayments(currentScore, factors, 12),
    },
  ];

  return {
    currentScore,
    factors,
    simulations,
  };
}

/**
 * Get actionable recommendations to improve credit score
 */
export function getCreditImprovementTips(factors: CreditScoreFactors): string[] {
  const tips: string[] = [];

  if (factors.paymentHistory < 32) {
    tips.push('Pay all bills on time. Payment history is the most important factor.');
  }

  if (factors.creditUtilization > 30) {
    tips.push(`Reduce credit card usage to below 30%. Currently at ${factors.creditUtilization}%.`);
  }

  if (factors.creditMix < 50) {
    tips.push('Build credit mix by having different types of credit (cards, loans, etc.).');
  }

  if (factors.creditAgeAverage < 3) {
    tips.push('Build credit history. Keep old credit accounts open even if unused.');
  }

  if (factors.hardInquiries > 2) {
    tips.push('Avoid multiple credit applications in short period. Space inquiries apart.');
  }

  if (tips.length === 0) {
    tips.push('You\'re doing great! Maintain your good financial habits.');
  }

  return tips;
}
