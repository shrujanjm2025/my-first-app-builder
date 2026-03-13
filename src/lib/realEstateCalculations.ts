/**
 * Real Estate Investment Tracking & Analysis
 * Calculates key metrics for rental properties and real estate investments
 */

export interface RealEstateProperty {
  id: string;
  name: string;
  propertyType: 'residential' | 'commercial' | 'land';
  purchasePrice: number;
  currentMarketValue: number;
  purchaseDate: string;
  rentalIncome: number; // Monthly
  vacancyRate: number; // 0-100, percentage
  operatingExpenses: number; // Monthly
  maintenanceFund: number; // Monthly allocation
}

export interface PropertyMetrics {
  property: RealEstateProperty;
  grossYield: number; // (Annual Gross Income / Property Value) * 100
  netYield: number; // (Annual Net Income / Property Value) * 100
  capRate: number; // (Net Operating Income / Current Market Value) * 100
  cashOnCashReturn: number;
  roi: number; // Return on Investment
  priceAppreciation: number; // Year-over-year or since purchase
  debtToEquityRatio: number;
}

export interface AnnualPropertyReport {
  property: RealEstateProperty;
  grossRentalIncome: number;
  vacancyLoss: number;
  actualRentalIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  propertyTaxes: number;
  insurance: number;
  maintenanceExpenses: number;
  capitalExpenditure: number;
  totalExpenses: number;
  netIncome: number;
  taxableIncome: number; // After deductions
}

/**
 * Calculate Gross Rental Yield
 * Formula: (Annual Gross Rental Income / Property Value) * 100
 */
export function calculateGrossYield(property: RealEstateProperty): number {
  const annualGrossIncome = property.rentalIncome * 12;
  return (annualGrossIncome / property.currentMarketValue) * 100;
}

/**
 * Calculate Net Rental Yield
 * Formula: (Annual Net Rental Income / Property Value) * 100
 * Net = Gross - Operating Expenses
 */
export function calculateNetYield(property: RealEstateProperty): number {
  const annualGrossIncome = property.rentalIncome * 12;
  const annualOperatingExpenses = property.operatingExpenses * 12;
  const annualNetIncome = annualGrossIncome - annualOperatingExpenses;
  return (annualNetIncome / property.currentMarketValue) * 100;
}

/**
 * Calculate Cap Rate (Capitalization Rate)
 * Formula: (Net Operating Income / Current Market Value) * 100
 * Cap Rate is used to compare property investments
 */
export function calculateCapRate(property: RealEstateProperty): number {
  const vacancyLoss = (property.rentalIncome * property.vacancyRate) / 100;
  const effectiveRentalIncome = property.rentalIncome - vacancyLoss;
  const annualEffectiveIncome = effectiveRentalIncome * 12;
  const annualOperatingExpenses = property.operatingExpenses * 12;
  const noi = annualEffectiveIncome - annualOperatingExpenses;

  return (noi / property.currentMarketValue) * 100;
}

/**
 * Calculate Return on Investment (ROI)
 * Formula: ((Current Value - Purchase Price) / Purchase Price) * 100
 */
export function calculateROI(property: RealEstateProperty): number {
  const appreciation = property.currentMarketValue - property.purchasePrice;
  return (appreciation / property.purchasePrice) * 100;
}

/**
 * Calculate Price Appreciation
 * Annual appreciation rate or cumulative since purchase
 */
export function calculatePriceAppreciation(property: RealEstateProperty): number {
  const yearsSincePurchase =
    (new Date().getTime() - new Date(property.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  if (yearsSincePurchase === 0) return 0;

  const totalAppreciation = property.currentMarketValue - property.purchasePrice;
  const cagr = Math.pow(property.currentMarketValue / property.purchasePrice, 1 / yearsSincePurchase) - 1;

  return cagr * 100;
}

/**
 * Generate comprehensive property metrics
 */
export function calculatePropertyMetrics(property: RealEstateProperty): PropertyMetrics {
  return {
    property,
    grossYield: calculateGrossYield(property),
    netYield: calculateNetYield(property),
    capRate: calculateCapRate(property),
    cashOnCashReturn: calculateNetYield(property), // Simplified
    roi: calculateROI(property),
    priceAppreciation: calculatePriceAppreciation(property),
    debtToEquityRatio: 0, // Would need loan data
  };
}

/**
 * Generate annual property report (useful for tax filing)
 */
export function generateAnnualPropertyReport(property: RealEstateProperty): AnnualPropertyReport {
  const grossRentalIncome = property.rentalIncome * 12;
  const vacancyLoss = (grossRentalIncome * property.vacancyRate) / 100;
  const actualRentalIncome = grossRentalIncome - vacancyLoss;

  const operatingExpenses = property.operatingExpenses * 12;
  const maintenanceExpenses = property.maintenanceFund * 12;

  // Standard property expenses (can be customized)
  const propertyTaxes = actualRentalIncome * 0.05; // 5% estimate
  const insurance = property.currentMarketValue * 0.005; // 0.5% annual estimate
  const capitalExpenditure = property.currentMarketValue * 0.01; // 1% annual estimate

  const totalExpenses = operatingExpenses + maintenanceExpenses + propertyTaxes + insurance + capitalExpenditure;
  const netIncome = actualRentalIncome - totalExpenses;

  // Tax deductions (India specific: can be customized)
  const taxDeductibleExpenses = operatingExpenses + maintenanceExpenses + propertyTaxes + insurance;
  const interestOnLoan = 0; // Would need loan details
  const depreciation = property.currentMarketValue * 0.05; // 5% annual depreciation
  const taxableIncome = Math.max(0, netIncome - depreciation + interestOnLoan);

  return {
    property,
    grossRentalIncome,
    vacancyLoss,
    actualRentalIncome,
    operatingExpenses,
    netOperatingIncome: actualRentalIncome - operatingExpenses,
    propertyTaxes,
    insurance,
    maintenanceExpenses,
    capitalExpenditure,
    totalExpenses,
    netIncome,
    taxableIncome,
  };
}

/**
 * Compare multiple properties
 */
export function compareProperties(properties: RealEstateProperty[]): PropertyMetrics[] {
  return properties.map(prop => calculatePropertyMetrics(prop));
}

/**
 * Get investment recommendation based on cap rate
 */
export function getInvestmentRecommendation(
  capRate: number
): { recommendation: string; color: string } {
  if (capRate >= 8) {
    return {
      recommendation: 'Excellent cap rate - strong investment potential',
      color: 'text-primary',
    };
  }
  if (capRate >= 6) {
    return {
      recommendation: 'Good cap rate - viable investment',
      color: 'text-accent',
    };
  }
  if (capRate >= 4) {
    return {
      recommendation: 'Moderate cap rate - limited cash flow',
      color: 'text-yellow-500',
    };
  }
  return {
    recommendation: 'Low cap rate - focus on appreciation',
    color: 'text-destructive',
  };
}

/**
 * Calculate property portfolio statistics
 */
export function calculatePortfolioStats(properties: RealEstateProperty[]): {
  totalPortfolioValue: number;
  totalAnnualIncome: number;
  totalAnnualExpenses: number;
  portfolioNetIncome: number;
  averageCapRate: number;
  weightedCapRate: number;
} {
  const metrics = properties.map(prop => calculatePropertyMetrics(prop));

  const totalPortfolioValue = properties.reduce((sum, p) => sum + p.currentMarketValue, 0);
  const totalAnnualIncome = properties.reduce((sum, p) => sum + p.rentalIncome * 12, 0);
  const totalAnnualExpenses = properties.reduce((sum, p) => sum + p.operatingExpenses * 12, 0);
  const portfolioNetIncome = totalAnnualIncome - totalAnnualExpenses;

  const averageCapRate = metrics.reduce((sum, m) => sum + m.capRate, 0) / properties.length;
  const weightedCapRate = metrics.reduce((sum, m) => sum + m.capRate * (m.property.currentMarketValue / totalPortfolioValue), 0);

  return {
    totalPortfolioValue,
    totalAnnualIncome,
    totalAnnualExpenses,
    portfolioNetIncome,
    averageCapRate,
    weightedCapRate,
  };
}

/**
 * Calculate break-even occupancy rate
 */
export function calculateBreakEvenOccupancy(property: RealEstateProperty): number {
  const monthlyExpenses = property.operatingExpenses + property.maintenanceFund;
  const breakEvenMonthlyIncome = monthlyExpenses;
  const breakEvenOccupancy = (breakEvenMonthlyIncome / property.rentalIncome) * 100;

  return Math.min(100, breakEvenOccupancy);
}
