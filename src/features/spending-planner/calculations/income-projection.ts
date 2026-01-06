/**
 * Income Projection
 *
 * Functions for projecting currency balances over time with growth.
 */

import type { CurrencyIncome, CurrencyId } from '../types'

/**
 * Project balances for a currency over multiple weeks.
 * Applies compound growth to weekly income.
 *
 * @param income - Income configuration for the currency
 * @param weeks - Number of weeks to project
 * @param week0ProrationFactor - Proration factor for week 0 income (0 < factor <= 1).
 *        Defaults to 1 (full week). Use this to account for partial weeks when the
 *        current day is mid-week.
 * @returns Array of balances, one per week (index 0 = week 0, current balance)
 */
export function projectBalances(
  income: CurrencyIncome,
  weeks: number,
  week0ProrationFactor: number = 1
): number[] {
  const balances: number[] = [income.currentBalance]
  let currentIncome = income.weeklyIncome
  const growthMultiplier = 1 + income.growthRatePercent / 100

  for (let week = 1; week <= weeks; week++) {
    const previousBalance = balances[week - 1]
    // Apply proration to week 0's income (week 1 balance = week 0 ending balance)
    const effectiveIncome = week === 1 ? currentIncome * week0ProrationFactor : currentIncome
    balances.push(previousBalance + effectiveIncome)
    // Apply growth for next week's income
    currentIncome *= growthMultiplier
  }

  return balances
}

/**
 * Project weekly income amounts for a currency.
 * Shows the income added each week (with growth applied).
 *
 * @param income - Income configuration for the currency
 * @param weeks - Number of weeks to project
 * @returns Array of income amounts, one per week (index 0 = week 1 income)
 */
export function projectIncomes(income: CurrencyIncome, weeks: number): number[] {
  const incomes: number[] = []
  let currentIncome = income.weeklyIncome
  const growthMultiplier = 1 + income.growthRatePercent / 100

  for (let week = 0; week < weeks; week++) {
    incomes.push(currentIncome)
    currentIncome *= growthMultiplier
  }

  return incomes
}

/**
 * Project balances for all currencies.
 *
 * @param incomes - Income configurations for all currencies
 * @param weeks - Number of weeks to project
 * @returns Map of currency ID to balance arrays
 */
export function projectAllBalances(
  incomes: CurrencyIncome[],
  weeks: number
): Map<CurrencyId, number[]> {
  const result = new Map<CurrencyId, number[]>()

  for (const income of incomes) {
    result.set(income.currencyId, projectBalances(income, weeks))
  }

  return result
}

/**
 * Project income amounts for all currencies.
 *
 * @param incomes - Income configurations for all currencies
 * @param weeks - Number of weeks to project
 * @returns Map of currency ID to income arrays
 */
export function projectAllIncomes(
  incomes: CurrencyIncome[],
  weeks: number
): Map<CurrencyId, number[]> {
  const result = new Map<CurrencyId, number[]>()

  for (const income of incomes) {
    result.set(income.currencyId, projectIncomes(income, weeks))
  }

  return result
}

/**
 * Find the first week where balance exceeds a threshold.
 *
 * @param balances - Projected balances array
 * @param amount - Amount needed
 * @returns Week index where balance first exceeds amount, or -1 if never
 */
export function findAffordableWeek(balances: number[], amount: number): number {
  for (let week = 0; week < balances.length; week++) {
    if (balances[week] >= amount) {
      return week
    }
  }
  return -1
}
