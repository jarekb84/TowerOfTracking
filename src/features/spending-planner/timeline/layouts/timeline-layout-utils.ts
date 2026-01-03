/**
 * Timeline Layout Utilities
 *
 * Pure functions for calculating and formatting timeline layout data.
 *
 * IMPORTANT: Balance Calculation Semantics
 * ----------------------------------------
 * The timeline calculator produces balancesByWeek with FULL income for all weeks.
 * However, week 0 (current week) only earns PRORATED income based on remaining days.
 *
 * To get correct balances for display:
 * - Week 0: balance = balancesByWeek[0] + proratedIncome
 * - Week N (N > 0): balance = balancesByWeek[N] + incomes[N] + (prorationAdjustment)
 *
 * where prorationAdjustment = (prorationFactor - 1) * fullWeek0Income
 *
 * This adjustment corrects for the fact that balancesByWeek[N] assumes full week 0 income.
 */

import type { CurrencyId } from '../../types'

/**
 * Calculate prior balances for each week based on current balance and expenditure.
 *
 * The timeline calculator produces balancesByWeek[N] as the balance at the START of week N,
 * with spending already subtracted. To get the prior balance (before spending), we simply
 * add back the expenditure for that week.
 *
 * Prior balance for week N = Balance[N] + Expenditure[N]
 *
 * @param balancesByWeek - Balance at start of each week (after spending subtracted)
 * @param expenditureByWeek - Amount spent during each week
 * @returns Prior balance for each week (balance at start of week, before spending)
 */
export function calculatePriorBalances(
  balancesByWeek: Map<CurrencyId, number[]>,
  expenditureByWeek: Map<CurrencyId, number[]>
): Map<CurrencyId, number[]> {
  const result = new Map<CurrencyId, number[]>()

  for (const [currencyId, balances] of balancesByWeek) {
    const expenditures = expenditureByWeek.get(currencyId) ?? []

    const priorBalances = balances.map((balance, weekIndex) => {
      const expenditure = expenditures[weekIndex] ?? 0
      // Prior balance = start of week balance + spending that was subtracted
      return balance + expenditure
    })

    result.set(currencyId, priorBalances)
  }

  return result
}

/**
 * Format a metric value for display based on design decisions:
 * - Zero income: Leave blank (empty string)
 * - No spending: Show '-'
 * - Non-zero values: Format normally (caller handles formatting)
 *
 * @param value - The numeric value
 * @param type - 'income' or 'expenditure' to determine display rules
 * @returns Object with displayValue (formatted or special) and hasValue boolean
 */
export function formatMetricDisplay(
  value: number,
  type: 'income' | 'expenditure'
): { displayValue: string; hasValue: boolean } {
  if (value === 0) {
    if (type === 'income') {
      // Zero income: leave blank
      return { displayValue: '', hasValue: false }
    } else {
      // No spending: show dash
      return { displayValue: '-', hasValue: false }
    }
  }

  // Non-zero value - caller will format the number
  return { displayValue: '', hasValue: true }
}

/**
 * Get display data for a week for a specific currency.
 */
export interface WeekCurrencyData {
  priorBalance: number
  income: number
  expenditure: number
  balance: number
}

/**
 * Data maps for extracting week currency data.
 */
interface WeekDataMaps {
  balancesByWeek: Map<CurrencyId, number[]>
  incomeByWeek: Map<CurrencyId, number[]>
  expenditureByWeek: Map<CurrencyId, number[]>
  priorBalancesByWeek: Map<CurrencyId, number[]>
}

/**
 * Extract week data for a specific currency and week index.
 *
 * balancesByWeek[N] is the balance at START of week N (before income).
 * The ending balance = start balance + income for that week.
 */
export function getWeekCurrencyData(
  weekIndex: number,
  currencyId: CurrencyId,
  maps: WeekDataMaps
): WeekCurrencyData {
  const balances = maps.balancesByWeek.get(currencyId) ?? []
  const incomes = maps.incomeByWeek.get(currencyId) ?? []
  const expenditures = maps.expenditureByWeek.get(currencyId) ?? []
  const priorBalances = maps.priorBalancesByWeek.get(currencyId) ?? []

  const startOfWeekBalance = balances[weekIndex] ?? 0
  const income = incomes[weekIndex] ?? 0

  return {
    priorBalance: priorBalances[weekIndex] ?? 0,
    income,
    expenditure: expenditures[weekIndex] ?? 0,
    // Ending balance = start of week balance + income for this week
    balance: startOfWeekBalance + income,
  }
}

/**
 * Apply proration factor to income and recalculate balance.
 * Used for partial weeks (e.g., current week where only some days remain).
 *
 * @param data - Original week data with full income
 * @param prorationFactor - Factor to apply (0 < factor <= 1)
 * @returns Adjusted data with prorated income and balance
 */
export function applyIncomeProration(
  data: WeekCurrencyData,
  prorationFactor: number
): WeekCurrencyData {
  if (prorationFactor === 1) return data

  const proratedIncome = data.income * prorationFactor
  // Balance includes full income, so adjust: balance - (fullIncome - proratedIncome)
  const proratedBalance = data.balance - (data.income - proratedIncome)

  return {
    ...data,
    income: proratedIncome,
    balance: proratedBalance,
  }
}

/**
 * Calculate the proration adjustment for week 0 income.
 *
 * The timeline calculator computes balances assuming FULL income for all weeks.
 * When week 0 is prorated (partial week), all subsequent weeks' balances are
 * overstated by the difference between full and prorated week 0 income.
 *
 * @param week0FullIncome - Full income for week 0 (before proration)
 * @param prorationFactor - Factor applied to week 0 (0 < factor <= 1)
 * @returns Adjustment to apply to balances for weeks > 0 (negative value)
 */
export function calculateProrationAdjustment(
  week0FullIncome: number,
  prorationFactor: number
): number {
  if (prorationFactor === 1) return 0
  // Adjustment = prorated - full = (factor - 1) * fullIncome
  // This is negative, reducing the balance
  return (prorationFactor - 1) * week0FullIncome
}

/**
 * Input data needed for accurate week balance calculations.
 */
interface WeekBalanceInputs {
  /** Raw balance from timeline calculator (assumes full income) */
  rawBalance: number
  /** Income for this week */
  income: number
  /** Expenditure for this week */
  expenditure: number
  /** Week index (0 = current week) */
  weekIndex: number
  /** Proration factor for current week (only applies to week 0) */
  currentWeekProrationFactor: number
  /** Full income for week 0 (needed for adjustment calculation) */
  week0FullIncome: number
}

/**
 * Calculate accurate week balance data with proper proration handling.
 *
 * This is the SINGLE SOURCE OF TRUTH for balance calculations.
 * Both layout modes (Columns and Rows) should use this function.
 *
 * Formula:
 * - Prior balance = rawBalance + expenditure (what balance was before spending)
 * - For week 0: endingBalance = rawBalance + (income * prorationFactor)
 * - For week N > 0: endingBalance = rawBalance + income + prorationAdjustment
 *
 * where prorationAdjustment = (prorationFactor - 1) * week0FullIncome
 *
 * @returns Accurate prior balance, income, expenditure, and ending balance
 */
export function calculateWeekBalance(inputs: WeekBalanceInputs): WeekCurrencyData {
  const {
    rawBalance,
    income,
    expenditure,
    weekIndex,
    currentWeekProrationFactor,
    week0FullIncome,
  } = inputs

  // Prior balance = raw balance + expenditure (balance before spending was subtracted)
  const priorBalance = rawBalance + expenditure

  if (weekIndex === 0) {
    // Week 0: Apply proration to income
    const proratedIncome = income * currentWeekProrationFactor
    const endingBalance = rawBalance + proratedIncome
    return {
      priorBalance,
      income: proratedIncome,
      expenditure,
      balance: endingBalance,
    }
  } else {
    // Week N > 0: Apply proration adjustment to correct for week 0's full income assumption
    const prorationAdjustment = calculateProrationAdjustment(
      week0FullIncome,
      currentWeekProrationFactor
    )
    const endingBalance = rawBalance + income + prorationAdjustment
    const adjustedPriorBalance = priorBalance + prorationAdjustment
    return {
      priorBalance: adjustedPriorBalance,
      income,
      expenditure,
      balance: endingBalance,
    }
  }
}
