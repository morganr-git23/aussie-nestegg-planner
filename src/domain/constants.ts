/**
 * Australian Property Planning Constants and Formulas
 * All monetary values are in cents to avoid floating point rounding issues
 */

// Australian Tax Brackets for 2024-25 (in cents)
export const AU_TAX_BRACKETS = [
  { min: 0, max: 1800000, rate: 0 }, // 0 - $18,200
  { min: 1800000, max: 4500000, rate: 0.19 }, // $18,201 - $45,000
  { min: 4500000, max: 12000000, rate: 0.325 }, // $45,001 - $120,000
  { min: 12000000, max: 18000000, rate: 0.37 }, // $120,001 - $180,000
  { min: 18000000, max: Infinity, rate: 0.45 }, // $180,001+
];

// Australian State Codes
export const AU_STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
];

// Default Investment Returns (annual percentage)
export const DEFAULT_RETURNS = {
  PROPERTY_GROWTH: 6.0,
  SUPER_RETURN: 7.0,
  PORTFOLIO_RETURN: 8.0,
  INFLATION_CPI: 2.5,
  WAGE_GROWTH: 3.0,
};

// Loan Constants
export const LOAN_CONSTANTS = {
  DEFAULT_TERM_YEARS: 30,
  DEFAULT_IO_YEARS: 0,
  MONTHS_PER_YEAR: 12,
};

// CGT Constants
export const CGT_CONSTANTS = {
  DISCOUNT_RATE: 0.5, // 50% discount after 12 months
  MINIMUM_HOLDING_MONTHS: 12,
};

// Main Residence Rules
export const PPOR_RULES = {
  ABSENCE_RULE_YEARS: 6, // Can treat as PPOR for 6 years after moving out
  OVERLAP_RULE_MONTHS: 6, // Can have 6 month overlap between properties
};

/**
 * Calculate after-tax income using Australian tax brackets
 * @param grossIncomeCents - Gross annual income in cents
 * @param medicareLevy - Medicare levy rate (default 2%)
 * @returns After-tax income in cents
 */
export function calculateAfterTaxIncome(
  grossIncomeCents: number,
  medicareLevy: number = 0.02
): number {
  let taxPayable = 0;
  let remainingIncome = grossIncomeCents;

  for (const bracket of AU_TAX_BRACKETS) {
    if (remainingIncome <= 0) break;
    
    const taxableInThisBracket = Math.min(
      remainingIncome,
      bracket.max - bracket.min
    );
    
    taxPayable += taxableInThisBracket * bracket.rate;
    remainingIncome -= taxableInThisBracket;
  }

  // Add Medicare Levy (2% of gross income)
  const medicareLevyTax = grossIncomeCents * medicareLevy;
  
  return Math.round(grossIncomeCents - taxPayable - medicareLevyTax);
}

/**
 * Calculate monthly loan payment (P&I)
 * @param principalCents - Loan principal in cents
 * @param annualRate - Annual interest rate (e.g., 0.06 for 6%)
 * @param termYears - Loan term in years
 * @returns Monthly payment in cents
 */
export function calculateMonthlyPayment(
  principalCents: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyRate = annualRate / LOAN_CONSTANTS.MONTHS_PER_YEAR;
  const totalPayments = termYears * LOAN_CONSTANTS.MONTHS_PER_YEAR;
  
  if (monthlyRate === 0) {
    return Math.round(principalCents / totalPayments);
  }
  
  const monthlyPayment = principalCents * 
    (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
  return Math.round(monthlyPayment);
}

/**
 * Calculate interest-only payment
 * @param principalCents - Loan principal in cents
 * @param annualRate - Annual interest rate
 * @returns Monthly interest-only payment in cents
 */
export function calculateInterestOnlyPayment(
  principalCents: number,
  annualRate: number
): number {
  const monthlyRate = annualRate / LOAN_CONSTANTS.MONTHS_PER_YEAR;
  return Math.round(principalCents * monthlyRate);
}

/**
 * Calculate present value using CPI deflation
 * @param nominalValueCents - Nominal value in cents
 * @param cpiRate - Annual CPI inflation rate
 * @param years - Number of years from now
 * @returns Present value in cents
 */
export function calculatePresentValue(
  nominalValueCents: number,
  cpiRate: number,
  years: number
): number {
  const presentValue = nominalValueCents / Math.pow(1 + cpiRate, years);
  return Math.round(presentValue);
}

/**
 * Calculate NSW stamp duty (example implementation)
 * @param purchasePriceCents - Property purchase price in cents
 * @returns Stamp duty in cents
 */
export function calculateNSWStampDuty(purchasePriceCents: number): number {
  const price = purchasePriceCents / 100; // Convert to dollars
  
  if (price <= 14000) return 0;
  if (price <= 32000) return Math.round((price - 14000) * 0.0125 * 100);
  if (price <= 85000) return Math.round((225 + (price - 32000) * 0.015) * 100);
  if (price <= 319000) return Math.round((1020 + (price - 85000) * 0.035) * 100);
  if (price <= 1064000) return Math.round((9210 + (price - 319000) * 0.045) * 100);
  
  return Math.round((42757.5 + (price - 1064000) * 0.055) * 100);
}

/**
 * Calculate capital gains tax
 * @param purchasePriceCents - Original purchase price in cents
 * @param salePriceCents - Sale price in cents
 * @param holdingMonths - Number of months held
 * @param marginalTaxRate - Marginal tax rate
 * @returns CGT payable in cents
 */
export function calculateCGT(
  purchasePriceCents: number,
  salePriceCents: number,
  holdingMonths: number,
  marginalTaxRate: number
): number {
  const capitalGain = salePriceCents - purchasePriceCents;
  if (capitalGain <= 0) return 0;
  
  const discountApplies = holdingMonths >= CGT_CONSTANTS.MINIMUM_HOLDING_MONTHS;
  const taxableGain = discountApplies 
    ? capitalGain * (1 - CGT_CONSTANTS.DISCOUNT_RATE)
    : capitalGain;
    
  return Math.round(taxableGain * marginalTaxRate);
}

/**
 * Convert cents to display dollars
 * @param cents - Amount in cents
 * @returns Formatted dollar string
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Convert dollars to cents for storage
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}