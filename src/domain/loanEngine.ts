/**
 * Loan Engine - Handles loan calculations, offset accounts, and amortization schedules
 */

import { 
  calculateMonthlyPayment, 
  calculateInterestOnlyPayment,
  LOAN_CONSTANTS 
} from './constants';

export interface LoanDetails {
  id: string;
  startDate: Date;
  startBalanceCents: number;
  annualRate: number;
  ioYears: number;
  termYears: number;
  offsetStartCents: number;
  offsetContribMonthlyCents: number;
  allowRedraw: boolean;
}

export interface LoanMonth {
  month: number;
  date: Date;
  startingBalance: number;
  offsetBalance: number;
  effectiveBalance: number;
  interestCharged: number;
  principalPayment: number;
  totalPayment: number;
  endingBalance: number;
  isInterestOnly: boolean;
}

export interface LoanSchedule {
  loanId: string;
  months: LoanMonth[];
  totalInterest: number;
  totalPayments: number;
}

/**
 * Calculate loan schedule with offset account
 * @param loan - Loan details
 * @param months - Number of months to calculate
 * @returns Complete loan schedule
 */
export function calculateLoanSchedule(
  loan: LoanDetails,
  months: number = loan.termYears * 12
): LoanSchedule {
  const schedule: LoanMonth[] = [];
  let currentBalance = loan.startBalanceCents;
  let offsetBalance = loan.offsetStartCents;
  let totalInterest = 0;
  let totalPayments = 0;

  const ioMonths = loan.ioYears * LOAN_CONSTANTS.MONTHS_PER_YEAR;
  const monthlyRate = loan.annualRate / LOAN_CONSTANTS.MONTHS_PER_YEAR;

  for (let month = 1; month <= months && currentBalance > 0; month++) {
    const currentDate = new Date(loan.startDate);
    currentDate.setMonth(currentDate.getMonth() + month - 1);

    // Update offset balance with monthly contributions
    offsetBalance += loan.offsetContribMonthlyCents;
    
    // Ensure offset doesn't exceed loan balance unless redraw allowed
    if (!loan.allowRedraw && offsetBalance > currentBalance) {
      offsetBalance = currentBalance;
    }

    // Calculate effective balance (loan balance minus offset)
    const effectiveBalance = Math.max(0, currentBalance - offsetBalance);

    // Calculate interest on effective balance
    const interestCharged = Math.round(effectiveBalance * monthlyRate);

    let principalPayment = 0;
    let totalPayment = interestCharged;

    const isInterestOnly = month <= ioMonths;

    if (!isInterestOnly && effectiveBalance > 0) {
      // Calculate P&I payment for remaining term
      const remainingMonths = months - month + 1;
      const piPayment = calculateMonthlyPayment(
        effectiveBalance,
        loan.annualRate,
        remainingMonths / LOAN_CONSTANTS.MONTHS_PER_YEAR
      );
      
      principalPayment = piPayment - interestCharged;
      totalPayment = piPayment;
      
      // Ensure we don't overpay
      if (principalPayment > currentBalance) {
        principalPayment = currentBalance;
        totalPayment = principalPayment + interestCharged;
      }
    }

    // Update balances
    currentBalance -= principalPayment;
    totalInterest += interestCharged;
    totalPayments += totalPayment;

    schedule.push({
      month,
      date: currentDate,
      startingBalance: currentBalance + principalPayment,
      offsetBalance,
      effectiveBalance,
      interestCharged,
      principalPayment,
      totalPayment,
      endingBalance: currentBalance,
      isInterestOnly,
    });
  }

  return {
    loanId: loan.id,
    months: schedule,
    totalInterest,
    totalPayments,
  };
}

/**
 * Calculate monthly payment for a given month
 * @param loan - Loan details
 * @param monthNumber - Month number (1-based)
 * @param currentBalance - Current loan balance in cents
 * @param offsetBalance - Current offset balance in cents
 * @returns Monthly payment amount in cents
 */
export function getMonthlyPayment(
  loan: LoanDetails,
  monthNumber: number,
  currentBalance: number,
  offsetBalance: number
): number {
  const ioMonths = loan.ioYears * LOAN_CONSTANTS.MONTHS_PER_YEAR;
  const effectiveBalance = Math.max(0, currentBalance - offsetBalance);

  if (monthNumber <= ioMonths) {
    return calculateInterestOnlyPayment(effectiveBalance, loan.annualRate);
  }

  const remainingMonths = (loan.termYears * LOAN_CONSTANTS.MONTHS_PER_YEAR) - monthNumber + 1;
  const remainingYears = remainingMonths / LOAN_CONSTANTS.MONTHS_PER_YEAR;
  
  return calculateMonthlyPayment(effectiveBalance, loan.annualRate, remainingYears);
}

/**
 * Apply refinancing to a loan
 * @param loan - Current loan details
 * @param refinanceDate - Date of refinancing
 * @param newRate - New interest rate
 * @param newIoYears - New interest-only period
 * @param newTermYears - New loan term
 * @returns Updated loan details
 */
export function refinanceLoan(
  loan: LoanDetails,
  refinanceDate: Date,
  newRate: number,
  newIoYears: number = 0,
  newTermYears: number = 30
): LoanDetails {
  return {
    ...loan,
    startDate: refinanceDate,
    annualRate: newRate,
    ioYears: newIoYears,
    termYears: newTermYears,
  };
}

/**
 * Calculate total interest saved by offset account
 * @param loan - Loan details
 * @param months - Number of months to calculate
 * @returns Interest saved in cents
 */
export function calculateOffsetSavings(
  loan: LoanDetails,
  months: number = loan.termYears * 12
): number {
  // Calculate schedule with offset
  const withOffset = calculateLoanSchedule(loan, months);
  
  // Calculate schedule without offset
  const withoutOffset = calculateLoanSchedule({
    ...loan,
    offsetStartCents: 0,
    offsetContribMonthlyCents: 0,
  }, months);
  
  return withoutOffset.totalInterest - withOffset.totalInterest;
}