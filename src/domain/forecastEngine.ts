/**
 * Forecast Engine - Handles 30-year property and financial forecasting
 */

import { calculateAfterTaxIncome, calculatePresentValue, formatCurrency } from './constants';
import { calculateLoanSchedule, LoanDetails } from './loanEngine';

export interface UserProfile {
  id: string;
  name: string;
  dateOfBirth: Date;
  retirementAge: number;
  inflationCpiPa: number;
  wageGrowthPa: number;
  returnSuperPa: number;
  returnPortfolioPa: number;
  taxMarginalRate: number;
  medicareLevy: number;
  stateCode: string;
}

export interface Property {
  id: string;
  name: string;
  purchasePriceCents: number;
  purchaseDate: Date;
  valueNowCents: number;
  valueGrowthPa: number;
  costsFixedPaCents: number;
  maintenancePctOfValue: number;
  strataPaCents: number;
  ratesPaCents: number;
  insurancePaCents: number;
  landTaxPaCents: number;
  rentPwCents: number;
  vacancyWeeksPa: number;
  depreciationCapitalPaCents: number;
  depreciationPlantPaCents: number;
  becomesIpOn?: Date;
  becomesPporOn?: Date;
  soldOn?: Date;
}

export interface ForecastMonth {
  month: number;
  date: Date;
  
  // Income
  salaryAfterTax: number;
  rentalIncome: number;
  totalIncome: number;
  
  // Expenses
  livingExpenses: number;
  propertyExpenses: number;
  loanPayments: number;
  totalExpenses: number;
  
  // Net Position
  netCashflow: number;
  cashBuffer: number;
  
  // Assets
  propertyValues: number;
  superBalance: number;
  portfolioBalance: number;
  totalAssets: number;
  
  // Liabilities
  totalDebt: number;
  
  // Net Worth
  netWorth: number;
  netWorthPresentValue: number;
  
  // 4% Rule
  passiveIncomeCapacity: number;
}

export interface ForecastSummary {
  now: ForecastMonth;
  year10: ForecastMonth;
  year20: ForecastMonth;
  retirement: ForecastMonth;
  year30: ForecastMonth;
}

export interface Scenario {
  id: string;
  userId: string;
  name: string;
  startDate: Date;
  horizonYears: number;
  profile: UserProfile;
  properties: Property[];
  loans: LoanDetails[];
  
  // Stress test parameters
  stressRateBumpPct: number;
  stressGrowthHaircutPct: number;
  stressVacancyWeeks: number;
  stressBorrowCapDownPct: number;
}

/**
 * Run a complete financial forecast for a scenario
 * @param scenario - The scenario to forecast
 * @returns Complete monthly forecast
 */
export function runForecast(scenario: Scenario): ForecastMonth[] {
  const forecast: ForecastMonth[] = [];
  const totalMonths = scenario.horizonYears * 12;
  
  // Initialize starting balances
  let cashBuffer = 1000000; // $10,000 starting cash buffer
  let superBalance = 50000000; // $500,000 starting super
  let portfolioBalance = 0;
  
  // Calculate annual salary (for demo, using fixed amount)
  const annualSalaryCents = 12000000; // $120,000
  const monthlySalaryAfterTax = calculateAfterTaxIncome(
    annualSalaryCents,
    scenario.profile.medicareLevy
  ) / 12;
  
  // Calculate monthly living expenses (estimated)
  const monthlyLivingExpenses = 500000; // $5,000 per month
  
  for (let month = 1; month <= totalMonths; month++) {
    const currentDate = new Date(scenario.startDate);
    currentDate.setMonth(currentDate.getMonth() + month - 1);
    
    const yearsFromStart = (month - 1) / 12;
    
    // Calculate income with wage growth
    const adjustedSalary = monthlySalaryAfterTax * 
      Math.pow(1 + scenario.profile.wageGrowthPa, yearsFromStart);
    
    // Calculate rental income
    let totalRentalIncome = 0;
    for (const property of scenario.properties) {
      const weeksPerYear = 52 - property.vacancyWeeksPa;
      const annualRent = property.rentPwCents * weeksPerYear;
      totalRentalIncome += annualRent / 12;
    }
    
    const totalIncome = adjustedSalary + totalRentalIncome;
    
    // Calculate property expenses
    let totalPropertyExpenses = 0;
    for (const property of scenario.properties) {
      const annualExpenses = property.costsFixedPaCents + 
        property.strataPaCents +
        property.ratesPaCents +
        property.insurancePaCents +
        property.landTaxPaCents;
      
      const maintenanceExpenses = property.valueNowCents * 
        Math.pow(1 + property.valueGrowthPa, yearsFromStart) *
        property.maintenancePctOfValue;
        
      totalPropertyExpenses += (annualExpenses + maintenanceExpenses) / 12;
    }
    
    // Calculate loan payments (simplified)
    let totalLoanPayments = 0;
    for (const loan of scenario.loans) {
      const schedule = calculateLoanSchedule(loan, Math.min(month, loan.termYears * 12));
      if (schedule.months[month - 1]) {
        totalLoanPayments += schedule.months[month - 1].totalPayment;
      }
    }
    
    // Adjust living expenses for inflation
    const adjustedLivingExpenses = monthlyLivingExpenses * 
      Math.pow(1 + scenario.profile.inflationCpiPa, yearsFromStart);
    
    const totalExpenses = adjustedLivingExpenses + totalPropertyExpenses + totalLoanPayments;
    const netCashflow = totalIncome - totalExpenses;
    
    // Update cash buffer
    cashBuffer += netCashflow;
    
    // Update super balance
    superBalance *= (1 + scenario.profile.returnSuperPa / 12);
    
    // Calculate total property values
    let totalPropertyValues = 0;
    for (const property of scenario.properties) {
      totalPropertyValues += property.valueNowCents * 
        Math.pow(1 + property.valueGrowthPa, yearsFromStart);
    }
    
    // Calculate total debt
    let totalDebt = 0;
    for (const loan of scenario.loans) {
      const schedule = calculateLoanSchedule(loan, Math.min(month, loan.termYears * 12));
      if (schedule.months[month - 1]) {
        totalDebt += schedule.months[month - 1].endingBalance;
      }
    }
    
    const totalAssets = totalPropertyValues + superBalance + portfolioBalance + cashBuffer;
    const netWorth = totalAssets - totalDebt;
    const netWorthPresentValue = calculatePresentValue(
      netWorth,
      scenario.profile.inflationCpiPa,
      yearsFromStart
    );
    
    // 4% rule for passive income
    const passiveIncomeCapacity = netWorthPresentValue * 0.04 / 12;
    
    forecast.push({
      month,
      date: currentDate,
      salaryAfterTax: adjustedSalary,
      rentalIncome: totalRentalIncome,
      totalIncome,
      livingExpenses: adjustedLivingExpenses,
      propertyExpenses: totalPropertyExpenses,
      loanPayments: totalLoanPayments,
      totalExpenses,
      netCashflow,
      cashBuffer,
      propertyValues: totalPropertyValues,
      superBalance,
      portfolioBalance,
      totalAssets,
      totalDebt,
      netWorth,
      netWorthPresentValue,
      passiveIncomeCapacity,
    });
  }
  
  return forecast;
}

/**
 * Generate forecast summary at key milestones
 * @param forecast - Complete monthly forecast
 * @param retirementAge - User's retirement age
 * @param dateOfBirth - User's date of birth
 * @returns Summary at key dates
 */
export function generateSummary(
  forecast: ForecastMonth[],
  retirementAge: number,
  dateOfBirth: Date
): ForecastSummary {
  const now = forecast[0];
  const year10 = forecast[119] || forecast[forecast.length - 1]; // Month 120
  const year20 = forecast[239] || forecast[forecast.length - 1]; // Month 240
  const year30 = forecast[359] || forecast[forecast.length - 1]; // Month 360
  
  // Calculate retirement month based on age
  const currentAge = (Date.now() - dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const monthsToRetirement = Math.max(0, (retirementAge - currentAge) * 12);
  const retirement = forecast[Math.floor(monthsToRetirement)] || year30;
  
  return {
    now,
    year10,
    year20,
    retirement,
    year30,
  };
}

/**
 * Apply stress test parameters to a scenario
 * @param scenario - Base scenario
 * @returns Stressed scenario
 */
export function applyStressTest(scenario: Scenario): Scenario {
  return {
    ...scenario,
    loans: scenario.loans.map(loan => ({
      ...loan,
      annualRate: loan.annualRate + (scenario.stressRateBumpPct / 100),
    })),
    properties: scenario.properties.map(property => ({
      ...property,
      valueGrowthPa: property.valueGrowthPa - (scenario.stressGrowthHaircutPct / 100),
      vacancyWeeksPa: Math.max(property.vacancyWeeksPa, scenario.stressVacancyWeeks),
    })),
  };
}

/**
 * Format forecast summary for display
 * @param summary - Forecast summary
 * @returns Formatted display data
 */
export function formatSummaryForDisplay(summary: ForecastSummary): any {
  return {
    'Now': {
      'Super': formatCurrency(summary.now.superBalance),
      'Total Assets': formatCurrency(summary.now.totalAssets),
      'Total Debts': formatCurrency(summary.now.totalDebt),
      'Net Worth (Nominal)': formatCurrency(summary.now.netWorth),
      'Net Worth (Today\'s $)': formatCurrency(summary.now.netWorthPresentValue),
      'Passive Income (4%)': formatCurrency(summary.now.passiveIncomeCapacity * 12),
    },
    '10 Years': {
      'Super': formatCurrency(summary.year10.superBalance),
      'Total Assets': formatCurrency(summary.year10.totalAssets),
      'Total Debts': formatCurrency(summary.year10.totalDebt),
      'Net Worth (Nominal)': formatCurrency(summary.year10.netWorth),
      'Net Worth (Today\'s $)': formatCurrency(summary.year10.netWorthPresentValue),
      'Passive Income (4%)': formatCurrency(summary.year10.passiveIncomeCapacity * 12),
    },
    '20 Years': {
      'Super': formatCurrency(summary.year20.superBalance),
      'Total Assets': formatCurrency(summary.year20.totalAssets),
      'Total Debts': formatCurrency(summary.year20.totalDebt),
      'Net Worth (Nominal)': formatCurrency(summary.year20.netWorth),
      'Net Worth (Today\'s $)': formatCurrency(summary.year20.netWorthPresentValue),
      'Passive Income (4%)': formatCurrency(summary.year20.passiveIncomeCapacity * 12),
    },
    'Retirement': {
      'Super': formatCurrency(summary.retirement.superBalance),
      'Total Assets': formatCurrency(summary.retirement.totalAssets),
      'Total Debts': formatCurrency(summary.retirement.totalDebt),
      'Net Worth (Nominal)': formatCurrency(summary.retirement.netWorth),
      'Net Worth (Today\'s $)': formatCurrency(summary.retirement.netWorthPresentValue),
      'Passive Income (4%)': formatCurrency(summary.retirement.passiveIncomeCapacity * 12),
    },
    '30 Years': {
      'Super': formatCurrency(summary.year30.superBalance),
      'Total Assets': formatCurrency(summary.year30.totalAssets),
      'Total Debts': formatCurrency(summary.year30.totalDebt),
      'Net Worth (Nominal)': formatCurrency(summary.year30.netWorth),
      'Net Worth (Today\'s $)': formatCurrency(summary.year30.netWorthPresentValue),
      'Passive Income (4%)': formatCurrency(summary.year30.passiveIncomeCapacity * 12),
    },
  };
}