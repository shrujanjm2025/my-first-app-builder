/**
 * Retirement Planning Engine
 * Calculates retirement corpus, Monte Carlo simulations, and withdrawal strategies
 */

export interface RetirementPlan {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentSavings: number;
  monthlyContribution: number;
  expectedAnnualReturn: number; // Percentage
  expectedInflationRate: number; // Percentage
  desiredAnnualIncome: number; // In today's rupees
  dependents: number;
}

export interface RetirementProjection {
  plan: RetirementPlan;
  yearsToRetirement: number;
  yearsInRetirement: number;
  requiredCorpus: number; // In future value
  projectedCorpusAt Retirement: number;
  shortfall: number;
  isOnTrack: boolean;
  successProbability: number; // From Monte Carlo
  requiredMonthlyContribution: number;
}

export interface MonteCarloResult {
  successRate: number; // Percentage of simulations that succeeded
  medianCorpus: number;
  worstCaseCorpus: number;
  bestCaseCorpus: number;
  percentile10: number;
  percentile25: number;
  percentile75: number;
  percentile90: number;
}

/**
 * Calculate future value of retirement corpus
 * FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
 */
export function calculateRetirementCorpus(
  currentSavings: number,
  monthlyContribution: number,
  annualReturn: number,
  yearsToRetirement: number
): number {
  const monthlyReturn = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
  const months = yearsToRetirement * 12;

  // Future value of current savings
  const pvFuture = currentSavings * Math.pow(1 + monthlyReturn, months);

  // Future value of monthly contributions (annuity)
  const pmtFuture = monthlyContribution * (((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn));

  return pvFuture + pmtFuture;
}

/**
 * Calculate required corpus for retirement
 * Using 4% rule: Annual spending = Corpus * 4%
 * OR Corpus = Annual Spending / 4%
 */
export function calculateRequiredCorpus(
  desiredAnnualIncome: number,
  yearsInRetirement: number,
  inflationRate: number
): number {
  // Adjust desired income for inflation during retirement
  const inflationFactor = Math.pow(1 + inflationRate / 100, yearsInRetirement / 2);
  const inflationAdjustedIncome = desiredAnnualIncome * inflationFactor;

  // Using 4% rule
  const requiredCorpus = inflationAdjustedIncome / 0.04;

  return requiredCorpus;
}

/**
 * Calculate required monthly contribution to reach retirement goal
 */
export function calculateRequiredMonthlyContribution(
  desiredCorpus: number,
  currentSavings: number,
  annualReturn: number,
  yearsToRetirement: number
): number {
  const monthlyReturn = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
  const months = yearsToRetirement * 12;

  // FV of current savings
  const pvFuture = currentSavings * Math.pow(1 + monthlyReturn, months);

  // Amount still needed from contributions
  const amountNeeded = Math.max(0, desiredCorpus - pvFuture);

  // Calculate PMT
  if (monthlyReturn === 0) {
    return amountNeeded / months;
  }

  return (amountNeeded * monthlyReturn) / (Math.pow(1 + monthlyReturn, months) - 1);
}

/**
 * Generate retirement projection
 */
export function generateRetirementProjection(plan: RetirementPlan): RetirementProjection {
  const yearsToRetirement = plan.retirementAge - plan.currentAge;
  const yearsInRetirement = plan.lifeExpectancy - plan.retirementAge;

  const requiredCorpus = calculateRequiredCorpus(
    plan.desiredAnnualIncome,
    yearsInRetirement,
    plan.expectedInflationRate
  );

  const projectedCorpusAtRetirement = calculateRetirementCorpus(
    plan.currentSavings,
    plan.monthlyContribution,
    plan.expectedAnnualReturn,
    yearsToRetirement
  );

  const shortfall = Math.max(0, requiredCorpus - projectedCorpusAtRetirement);
  const isOnTrack = shortfall === 0;

  const requiredMonthlyContribution = calculateRequiredMonthlyContribution(
    requiredCorpus,
    plan.currentSavings,
    plan.expectedAnnualReturn,
    yearsToRetirement
  );

  // Simple success probability (more accurate with Monte Carlo)
  const successProbability = isOnTrack ? 95 : Math.max(20, 95 - (shortfall / requiredCorpus) * 100);

  return {
    plan,
    yearsToRetirement,
    yearsInRetirement,
    requiredCorpus,
    projectedCorpusAtRetirement,
    shortfall,
    isOnTrack,
    successProbability,
    requiredMonthlyContribution,
  };
}

/**
 * Monte Carlo Simulation for retirement planning
 * Runs multiple scenarios with random market returns
 */
export function monteCarloSimulation(
  plan: RetirementPlan,
  simulations: number = 1000
): MonteCarloResult {
  const yearsToRetirement = plan.retirementAge - plan.currentAge;
  const results: number[] = [];

  for (let sim = 0; sim < simulations; sim++) {
    let corpus = plan.currentSavings;
    const monthlyContribution = plan.monthlyContribution;

    // Simulate each year with random returns (normal distribution)
    for (let year = 0; year < yearsToRetirement; year++) {
      // Normal distribution random return (mean = expected return, std dev = 15%)
      const randomReturn = normalRandomVariable(plan.expectedAnnualReturn, 15) / 100;
      const monthlyReturn = Math.pow(1 + randomReturn, 1 / 12) - 1;

      // Apply returns and contributions for each month
      for (let month = 0; month < 12; month++) {
        corpus = corpus * (1 + monthlyReturn) + monthlyContribution;
      }
    }

    results.push(corpus);
  }

  // Calculate statistics
  results.sort((a, b) => a - b);
  const successCount = results.filter(r => r > 0).length;
  const successRate = (successCount / simulations) * 100;

  return {
    successRate,
    medianCorpus: results[Math.floor(results.length / 2)],
    worstCaseCorpus: results[0],
    bestCaseCorpus: results[results.length - 1],
    percentile10: results[Math.floor(results.length * 0.1)],
    percentile25: results[Math.floor(results.length * 0.25)],
    percentile75: results[Math.floor(results.length * 0.75)],
    percentile90: results[Math.floor(results.length * 0.9)],
  };
}

/**
 * Generate normal distribution random variable
 */
function normalRandomVariable(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

/**
 * Calculate 4% safe withdrawal rate
 */
export function calculateSafeWithdrawal(corpus: number): number {
  return corpus * 0.04; // 4% rule
}

/**
 * Calculate retirement readiness score (0-100)
 */
export function calculateRetirementReadiness(projection: RetirementProjection): {
  score: number;
  status: 'on-track' | 'at-risk' | 'critical';
  recommendations: string[];
} {
  const projection Ratio = projection.projectedCorpusAtRetirement / projection.requiredCorpus;
  let score = 0;
  let recommendations: string[] = [];

  if (projectionRatio >= 1.2) {
    score = 95;
    recommendations.push('Excellent! You are on track for a comfortable retirement.');
  } else if (projectionRatio >= 1.0) {
    score = 85;
    recommendations.push('Good progress. Maintain current savings rate.');
  } else if (projectionRatio >= 0.8) {
    score = 60;
    recommendations.push('You need to increase monthly contributions by 25%.');
  } else if (projectionRatio >= 0.6) {
    score = 40;
    recommendations.push('Significantly increase contributions or delay retirement.');
  } else {
    score = 20;
    recommendations.push('Critical: Increase contributions by 50% or reassess retirement plans.');
  }

  if (projection.yearsToRetirement < 5) {
    recommendations.push('With less than 5 years to retirement, reduce investment risk.');
  }

  return {
    score,
    status: score >= 80 ? 'on-track' : score >= 50 ? 'at-risk' : 'critical',
    recommendations,
  };
}

/**
 * Generate retirement action plan
 */
export function generateRetirementActionPlan(
  projection: RetirementProjection,
  readiness: ReturnType<typeof calculateRetirementReadiness>
): string[] {
  const actions: string[] = [];

  if (projection.shortfall > 0) {
    actions.push(
      `Increase monthly contributions to ₹${projection.requiredMonthlyContribution.toLocaleString()} to stay on track.`
    );
  }

  if (projection.plan.monthlyContribution < projection.requiredMonthlyContribution) {
    const increase = projection.requiredMonthlyContribution - projection.plan.monthlyContribution;
    actions.push(`Increase monthly savings by ₹${increase.toLocaleString()}`);
  }

  if (projection.plan.desiredAnnualIncome > projection.plan.currentSavings * 0.04) {
    actions.push('Consider reducing retirement spending expectations or extending working years.');
  }

  actions.push(`Target retirement age: ${projection.plan.retirementAge} (in ${projection.yearsToRetirement} years)`);
  actions.push(`Current projected corpus: ₹${projection.projectedCorpusAtRetirement.toLocaleString()}`);
  actions.push(`Target corpus: ₹${projection.requiredCorpus.toLocaleString()}`);

  return actions;
}