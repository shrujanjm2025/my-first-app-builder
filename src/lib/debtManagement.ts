/**
 * Debt Management Engine
 * Handles loan tracking, EMI calculations, payoff strategies (Snowball & Avalanche)
 */

export interface Loan {
  id: string;
  name: string;
  type: string; // 'Home Loan', 'Personal Loan', etc.
  principal: number;
  outstandingBalance: number;
  interestRate: number; // Annual percentage rate (e.g., 8 for 8%)
  tenureMonths: number;
  emiAmount: number;
  startDate: string;
  nextDueDate: string;
  paidMonths?: number;
}

export interface LoanPaymentSchedule {
  month: number;
  principalPayment: number;
  interestPayment: number;
  emiAmount: number;
  outstandingBalance: number;
  dueDate: string;
}

export interface DebtPayoffStrategy {
  name: 'snowball' | 'avalanche';
  description: string;
  loans: Loan[];
  totalMonthlyPayment: number;
  payoffOrder: Loan[];
  totalInterestPaid: number;
  monthsToPayoff: number;
}

/**
 * Calculate EMI (Equated Monthly Installment)
 * Formula: EMI = P × [R × (1 + R)^N] / [(1 + R)^N - 1]
 * where P = Principal, R = Monthly Rate, N = Number of Months
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return principal / tenureMonths;
  }

  const numerator = monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
  const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;

  return (principal * numerator) / denominator;
}

/**
 * Calculate outstanding balance after N payments
 */
export function calculateOutstandingBalance(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  paidMonths: number
): number {
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return Math.max(0, principal - (principal / tenureMonths) * paidMonths);
  }

  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const remainingMonths = tenureMonths - paidMonths;

  if (remainingMonths <= 0) {
    return 0;
  }

  const outstandingBalance = (emi * (Math.pow(1 + monthlyRate, remainingMonths) - 1)) /
    (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths));

  return Math.max(0, outstandingBalance);
}

/**
 * Generate payment schedule for a loan
 */
export function generatePaymentSchedule(
  loan: Loan,
  startMonth: number = 0
): LoanPaymentSchedule[] {
  const schedule: LoanPaymentSchedule[] = [];
  const monthlyRate = loan.interestRate / 100 / 12;
  let outstandingBalance = loan.outstandingBalance || loan.principal;

  const startDate = new Date(loan.startDate);

  for (let month = 1; month <= (loan.tenureMonths - (loan.paidMonths || 0)); month++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (loan.paidMonths || 0) + month);

    const interestPayment = outstandingBalance * monthlyRate;
    const principalPayment = loan.emiAmount - interestPayment;
    outstandingBalance = Math.max(0, outstandingBalance - principalPayment);

    schedule.push({
      month: (loan.paidMonths || 0) + month,
      principalPayment,
      interestPayment,
      emiAmount: loan.emiAmount,
      outstandingBalance,
      dueDate: dueDate.toISOString().split('T')[0],
    });
  }

  return schedule;
}

/**
 * Calculate total interest paid for a loan's remaining tenure
 */
export function calculateTotalInterestPaid(
  outstandingBalance: number,
  annualRate: number,
  remainingMonths: number
): number {
  const emi = calculateEMI(outstandingBalance, annualRate, remainingMonths);
  return (emi * remainingMonths) - outstandingBalance;
}

/**
 * Debt Snowball Strategy
 * Pay debts in order of smallest to largest balance (psychological wins)
 */
export function debtSnowball(loans: Loan[]): DebtPayoffStrategy {
  const sortedLoans = [...loans].sort((a, b) => a.outstandingBalance - b.outstandingBalance);

  const totalMonthlyPayment = loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
  const totalInterestPaid = loans.reduce((sum, loan) => {
    const remainingMonths = loan.tenureMonths - (loan.paidMonths || 0);
    return sum + calculateTotalInterestPaid(loan.outstandingBalance, loan.interestRate, remainingMonths);
  }, 0);

  return {
    name: 'snowball',
    description: 'Pay smallest debt first. Motivating but may cost more interest.',
    loans,
    totalMonthlyPayment,
    payoffOrder: sortedLoans,
    totalInterestPaid,
    monthsToPayoff: Math.max(...loans.map(l => l.tenureMonths - (l.paidMonths || 0))),
  };
}

/**
 * Debt Avalanche Strategy
 * Pay debts in order of highest to lowest interest rate (mathematically optimal)
 */
export function debtAvalanche(loans: Loan[]): DebtPayoffStrategy {
  const sortedLoans = [...loans].sort((a, b) => b.interestRate - a.interestRate);

  const totalMonthlyPayment = loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
  const totalInterestPaid = loans.reduce((sum, loan) => {
    const remainingMonths = loan.tenureMonth - (loan.paidMonths || 0);
    return sum + calculateTotalInterestPaid(loan.outstandingBalance, loan.interestRate, remainingMonths);
  }, 0);

  return {
    name: 'avalanche',
    description: 'Pay highest interest rate first. Saves the most interest overall.',
    loans,
    totalMonthlyPayment,
    payoffOrder: sortedLoans,
    totalInterestPaid,
    monthsToPayoff: Math.max(...loans.map(l => l.tenureMonths - (l.paidMonths || 0))),
  };
}

/**
 * Calculate impact of extra payments on loan payoff
 */
export function calculateExtraPaymentImpact(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  extraMonthlyPayment: number
): {
  originalEMI: number;
  totalEMI: number;
  newEMI: number;
  monthsSaved: number;
  interestSaved: number;
} {
  const originalEMI = calculateEMI(principal, annualRate, tenureMonths);
  const totalEMI = originalEMI + extraMonthlyPayment;
  const newTenureMonths = Math.ceil(principal / ((totalEMI) - principal / tenureMonths));
  const monthsSaved = Math.max(0, tenureMonths - newTenureMonths);

  const originalTotalInterest = (originalEMI * tenureMonths) - principal;
  const newTotalInterest = calculateTotalInterestPaid(principal, annualRate, newTenureMonths);
  const interestSaved = originalTotalInterest - newTotalInterest;

  return {
    originalEMI,
    totalEMI,
    newEMI: totalEMI,
    monthsSaved,
    interestSaved,
  };
}

/**
 * Calculate offset account benefit for home loans
 * Offset account reduces the effective principal for interest calculation
 */
export function calculateOffsetAccountBenefit(
  loanPrincipal: number,
  interestRate: number,
  tenureMonths: number,
  offsetBalance: number
): {
  monthlyInterestWithoutOffset: number;
  monthlyInterestWithOffset: number;
  monthlySavings: number;
  yearlySavings: number;
  totalSavingsOverTenure: number;
  newPayoffTime: number;
} {
  const monthlyRate = interestRate / 100 / 12;
  
  const monthlyInterestWithoutOffset = loanPrincipal * monthlyRate;
  const effectivePrincipal = Math.max(0, loanPrincipal - offsetBalance);
  const monthlyInterestWithOffset = effectivePrincipal * monthlyRate;
  const monthlySavings = monthlyInterestWithoutOffset - monthlyInterestWithOffset;
  const yearlySavings = monthlySavings * 12;
  
  // Simplified calculation: with same EMI, how much faster can we pay off?
  const originalEMI = calculateEMI(loanPrincipal, interestRate, tenureMonths);
  const newTenure = effectivePrincipal > 0
    ? Math.ceil(effectivePrincipal / ((originalEMI) - effectivePrincipal / tenureMonths))
    : 0;
  const newPayoffTime = Math.max(0, tenureMonths - (tenureMonths - newTenure));

  return {
    monthlyInterestWithoutOffset,
    monthlyInterestWithOffset,
    monthlySavings,
    yearlySavings,
    totalSavingsOverTenure: yearlySavings * (tenureMonths / 12),
    newPayoffTime,
  };
}

/**
 * Get loan status summary
 */
export function getLoanStatus(loan: Loan): string {
  const paidMonths = loan.paidMonths || 0;
  const totalMonths = loan.tenureMonths;
  const progress = (paidMonths / totalMonths) * 100;
  const remaining = totalMonths - paidMonths;

  if (remaining <= 0) return 'Paid Off';
  if (progress === 0) return 'Not Started';
  if (progress >= 75) return 'Almost Paid';
  return `${remaining} months remaining`;
}
