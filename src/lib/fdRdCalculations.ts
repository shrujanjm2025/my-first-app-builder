/**
 * Fixed Deposit (FD) & Recurring Deposit (RD) Calculator
 * Calculates maturity amounts, compound interest, and withdrawal alerts
 */

export type DepositType = 'FD' | 'RD' | 'SSY' | 'PPF';

export interface Deposit {
  id: string;
  name: string;
  bank: string;
  type: DepositType;
  principal: number;
  interestRate: number; // Annual percentage
  tenureMonths: number;
  monthlyAmount?: number; // For RD
  startDate: string;
  maturityDate: string;
  compoundingFrequency: 'monthly' | 'quarterly' | 'annually';
}

export interface DepositMaturityAnalysis {
  deposit: Deposit;
  maturityAmount: number;
  totalInterestEarned: number;
  monthlyInterest: number;
  monthsRemaining: number;
  daysRemaining: number;
  isMatured: boolean;
  maturitySoon: boolean; // Within 30 days
}

export interface DepositPortfolioSummary {
  deposits: Deposit[];
  totalPrincipal: number;
  totalMaturityAmount: number;
  totalInterestExpected: number;
  upcomingMaturities: DepositMaturityAnalysis[];
  averageInterestRate: number;
}

/**
 * Calculate FD maturity amount
 * Formula: A = P * (1 + R/100/n)^(n*t)
 * where P = Principal, R = Annual Rate, n = Compounding per year, t = Time in years
 */
export function calculateFDMaturity(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  compoundingFrequency: 'monthly' | 'quarterly' | 'annually' = 'quarterly'
): number {
  const years = tenureMonths / 12;
  const compoundingPerYear =
    compoundingFrequency === 'monthly' ? 12 : compoundingFrequency === 'quarterly' ? 4 : 1;

  const rate = annualRate / 100;
  const maturityAmount = principal * Math.pow(1 + rate / compoundingPerYear, compoundingPerYear * years);

  return maturityAmount;
}

/**
 * Calculate RD maturity amount
 * Formula: M = P * [((1 + r)^n - 1) / r] * (1 + r)
 * where P = Monthly Payment, r = Monthly Rate, n = Number of months
 */
export function calculateRDMaturity(
  monthlyAmount: number,
  annualRate: number,
  tenureMonths: number,
  compoundingFrequency: 'monthly' | 'quarterly' | 'annually' = 'monthly'
): number {
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return monthlyAmount * tenureMonths;
  }

  const maturityAmount =
    monthlyAmount * (((Math.pow(1 + monthlyRate, tenureMonths) - 1) / monthlyRate) * (1 + monthlyRate));

  return maturityAmount;
}

/**
 * Calculate total interest earned from FD
 */
export function calculateFDInterest(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  compoundingFrequency: 'monthly' | 'quarterly' | 'annually' = 'quarterly'
): number {
  const maturityAmount = calculateFDMaturity(principal, annualRate, tenureMonths, compoundingFrequency);
  return maturityAmount - principal;
}

/**
 * Calculate total interest earned from RD
 */
export function calculateRDInterest(
  monthlyAmount: number,
  annualRate: number,
  tenureMonths: number,
  compoundingFrequency: 'monthly' | 'quarterly' | 'annually' = 'monthly'
): number {
  const maturityAmount = calculateRDMaturity(monthlyAmount, annualRate, tenureMonths, compoundingFrequency);
  const totalPrincipal = monthlyAmount * tenureMonths;
  return maturityAmount - totalPrincipal;
}

/**
 * Calculate maturity amount based on deposit type
 */
export function calculateMaturityAmount(
  deposit: Deposit
): number {
  if (deposit.type === 'RD' || deposit.type === 'PPF') {
    return calculateRDMaturity(
      deposit.monthlyAmount || 0,
      deposit.interestRate,
      deposit.tenureMonths,
      deposit.compoundingFrequency
    );
  }

  // FD or SSY
  return calculateFDMaturity(
    deposit.principal,
    deposit.interestRate,
    deposit.tenureMonths,
    deposit.compoundingFrequency
  );
}

/**
 * Analyze a deposit's maturity status
 */
export function analyzeDepositMaturity(deposit: Deposit): DepositMaturityAnalysis {
  const maturityDate = new Date(deposit.maturityDate);
  const today = new Date();

  const timeDiff = maturityDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.ceil(daysRemaining / 30);
  const isMatured = daysRemaining < 0;
  const maturitySoon = daysRemaining <= 30 && daysRemaining > 0;

  const maturityAmount = calculateMaturityAmount(deposit);
  const principal = deposit.type === 'RD' || deposit.type === 'PPF' 
    ? (deposit.monthlyAmount || 0) * deposit.tenureMonths 
    : deposit.principal;
  const totalInterestEarned = maturityAmount - principal;
  const monthlyInterest = totalInterestEarned / deposit.tenureMonths;

  return {
    deposit,
    maturityAmount,
    totalInterestEarned,
    monthlyInterest,
    monthsRemaining: Math.max(0, monthsRemaining),
    daysRemaining: Math.max(0, daysRemaining),
    isMatured,
    maturitySoon,
  };
}

/**
 * Calculate portfolio summary
 */
export function calculatePortfolioSummary(deposits: Deposit[]): DepositPortfolioSummary {
  const analyses = deposits.map(dep => analyzeDepositMaturity(dep));

  const totalPrincipal = deposits.reduce((sum, dep) => {
    if (dep.type === 'RD' || dep.type === 'PPF') {
      return sum + (dep.monthlyAmount || 0) * dep.tenureMonths;
    }
    return sum + dep.principal;
  }, 0);

  const totalMaturityAmount = analyses.reduce((sum, a) => sum + a.maturityAmount, 0);
  const totalInterestExpected = analyses.reduce((sum, a) => sum + a.totalInterestEarned, 0);

  const upcomingMaturities = analyses
    .filter(a => a.maturitySoon && !a.isMatured)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const averageInterestRate = deposits.length > 0
    ? deposits.reduce((sum, dep) => sum + dep.interestRate, 0) / deposits.length
    : 0;

  return {
    deposits,
    totalPrincipal,
    totalMaturityAmount,
    totalInterestExpected,
    upcomingMaturities,
    averageInterestRate,
  };
}

/**
 * Get maturity alerts and recommendations
 */
export function getDepositAlerts(deposits: Deposit[]): Array<{
  deposit: Deposit;
  type: 'matured' | 'maturing-soon' | 'low-rate';
  message: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const alerts: Array<{
    deposit: Deposit;
    type: 'matured' | 'maturing-soon' | 'low-rate';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  deposits.forEach(deposit => {
    const analysis = analyzeDepositMaturity(deposit);

    if (analysis.isMatured) {
      alerts.push({
        deposit,
        type: 'matured',
        message: `${deposit.name} matured on ${new Date(deposit.maturityDate).toLocaleDateString()}. Plan reinvestment.`,
        priority: 'high',
      });
    } else if (analysis.maturitySoon) {
      alerts.push({
        deposit,
        type: 'maturing-soon',
        message: `${deposit.name} matures in ${analysis.daysRemaining} days. Plan reinvestment.`,
        priority: 'medium',
      });
    }

    if (deposit.interestRate < 6.5) {
      alerts.push({
        deposit,
        type: 'low-rate',
        message: `${deposit.name} has ${deposit.interestRate}% rate. Consider higher-yielding alternatives.`,
        priority: 'low',
      });
    }
  });

  return alerts;
}

/**
 * Calculate retirement corpus from RDs and FDs
 */
export function calculateRetirementCorpus(
  deposits: Deposit[],
  yearsToRetirement: number
): { totalCorpus: number; investmentRequired: number } {
  const maturedAmount = deposits.reduce((sum, dep) => sum + calculateMaturityAmount(dep), 0);

  // Simple calculation: assume deposits continue with same parameters
  const continuationAmount = deposits.reduce((sum, dep) => {
    const monthlyAmount = dep.type === 'RD' || dep.type === 'PPF'
      ? dep.monthlyAmount || 0
      : dep.principal / dep.tenureMonths;
    const futureAmount =
      monthlyAmount * yearsToRetirement * 12 * (1 + dep.interestRate / 100) ** yearsToRetirement;
    return sum + futureAmount;
  }, 0);

  return {
    totalCorpus: maturedAmount + continuationAmount,
    investmentRequired: deposits.reduce((sum, dep) => {
      if (dep.type === 'RD' || dep.type === 'PPF') {
        return sum + (dep.monthlyAmount || 0) * yearsToRetirement * 12;
      }
      return sum;
    }, 0),
  };
}

/**
 * Compare FD vs RD returns for same amount
 */
export function compareFDvsRD(
  amount: number,
  annualRate: number,
  tenureMonths: number
): { fdMaturity: number; rdMaturity: number; difference: number; better: string } {
  const fdMaturity = calculateFDMaturity(amount, annualRate, tenureMonths);
  const monthlyRDAmount = amount / tenureMonths;
  const rdMaturity = calculateRDMaturity(monthlyRDAmount, annualRate, tenureMonths);
  const difference = fdMaturity - rdMaturity;

  return {
    fdMaturity,
    rdMaturity,
    difference,
    better: difference > 0 ? 'FD provides higher returns' : 'RD provides higher returns',
  };
}
