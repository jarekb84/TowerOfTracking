/**
 * Derived Income Calculation
 *
 * Pure functions for calculating weekly income and growth rates
 * from historical run data.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { LookbackPeriod } from '../types'
import { CurrencyId } from '../types'

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for extracting currency values from run data.
 * Supports either a cached property or field names from the fields record.
 */
interface CurrencyFieldConfig {
  /** Cached property name on ParsedGameRun (e.g., 'coinsEarned') */
  cachedProperty?: keyof ParsedGameRun
  /** Field names to sum from run.fields using camelCase keys (e.g., ['rerollShardsEarned', 'rerollShards']) */
  fieldNames?: string[]
}

/**
 * Result of derived weekly income calculation.
 */
export interface DerivedIncomeResult {
  /** Calculated weekly income */
  weeklyIncome: number
  /** True if we have at least 3 days of data */
  hasSufficientData: boolean
  /** Number of days of data available */
  daysOfData: number
  /** Number of runs analyzed */
  runsAnalyzed: number
}

/**
 * Result of derived growth rate calculation.
 */
export interface DerivedGrowthRateResult {
  /** Growth rate as a percentage (e.g., 5 for 5%) */
  growthRatePercent: number
  /** True if we have at least 4 weeks of data */
  hasSufficientData: boolean
  /** Number of weeks of data available */
  weeksOfData: number
}

// =============================================================================
// Field Configuration
// =============================================================================

/**
 * Configuration for extracting values for derivable currencies.
 * Maps currency IDs to the run data fields that contain the income.
 *
 * Field names must match the camelCase keys in run.fields, not display names.
 * See REROLL_SHARDS_CONFIG in section-config.ts for the source field definitions.
 */
export const DERIVABLE_CURRENCY_FIELDS: Partial<Record<CurrencyId, CurrencyFieldConfig>> = {
  [CurrencyId.Coins]: { cachedProperty: 'coinsEarned' },
  [CurrencyId.RerollShards]: { fieldNames: ['rerollShardsEarned', 'rerollShards'] },
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the start date for a lookback period from a reference date.
 */
export function getLookbackStartDate(referenceDate: Date, period: LookbackPeriod): Date {
  const start = new Date(referenceDate)

  switch (period) {
    case '3mo':
      start.setMonth(start.getMonth() - 3)
      break
    case '6mo':
      start.setMonth(start.getMonth() - 6)
      break
    case 'all':
      // Return a very old date to include all runs
      return new Date(0)
  }

  return start
}

/**
 * Filter runs to those within the lookback period.
 */
export function filterRunsByLookback(
  runs: ParsedGameRun[],
  period: LookbackPeriod,
  referenceDate: Date = new Date()
): ParsedGameRun[] {
  const startDate = getLookbackStartDate(referenceDate, period)
  return runs.filter((run) => run.timestamp >= startDate)
}

/**
 * Extract the income value from a run for a given field configuration.
 * Returns 0 if the field is not found or invalid.
 */
export function extractRunValue(run: ParsedGameRun, config: CurrencyFieldConfig): number {
  // Check cached property first
  if (config.cachedProperty) {
    const value = run[config.cachedProperty]
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value
    }
  }

  // Sum field values
  if (config.fieldNames) {
    let total = 0
    for (const fieldName of config.fieldNames) {
      const field = run.fields[fieldName]
      if (field && typeof field.value === 'number' && !Number.isNaN(field.value)) {
        total += field.value
      }
    }
    return total
  }

  return 0
}

/**
 * Group runs by day (using the date portion of timestamp).
 */
export function groupRunsByDay(runs: ParsedGameRun[]): Map<string, ParsedGameRun[]> {
  const groups = new Map<string, ParsedGameRun[]>()

  for (const run of runs) {
    const dateKey = run.timestamp.toISOString().split('T')[0]
    const existing = groups.get(dateKey) || []
    groups.set(dateKey, [...existing, run])
  }

  return groups
}

/**
 * Group runs by week (ISO week number).
 */
export function groupRunsByWeek(runs: ParsedGameRun[]): Map<string, ParsedGameRun[]> {
  const groups = new Map<string, ParsedGameRun[]>()

  for (const run of runs) {
    const weekKey = getIsoWeekKey(run.timestamp)
    const existing = groups.get(weekKey) || []
    groups.set(weekKey, [...existing, run])
  }

  return groups
}

/**
 * Get ISO week key (year-week format).
 */
function getIsoWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}

// =============================================================================
// Income Calculation
// =============================================================================

/**
 * Calculate derived weekly income from run data.
 *
 * Uses a 7-day rolling average to smooth out daily variations.
 * The calculation takes the total income from the most recent 7 days
 * and extrapolates to a weekly rate.
 *
 * @param runs - All available runs
 * @param config - Field configuration for the currency
 * @param referenceDate - Date to calculate from (defaults to now)
 * @returns Derived income result with data quality indicators
 */
export function calculateDerivedWeeklyIncome(
  runs: ParsedGameRun[],
  config: CurrencyFieldConfig,
  referenceDate: Date = new Date()
): DerivedIncomeResult {
  if (runs.length === 0) {
    return {
      weeklyIncome: 0,
      hasSufficientData: false,
      daysOfData: 0,
      runsAnalyzed: 0,
    }
  }

  // Get runs from the last 7 days
  const sevenDaysAgo = new Date(referenceDate)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentRuns = runs.filter((run) => run.timestamp >= sevenDaysAgo)

  // Group by day to count unique days
  const runsByDay = groupRunsByDay(recentRuns)
  const daysOfData = runsByDay.size

  // Sum total income from recent runs
  let totalIncome = 0
  for (const run of recentRuns) {
    totalIncome += extractRunValue(run, config)
  }

  // Calculate weekly income
  // If we have less than 7 days of data, extrapolate
  const weeklyIncome = daysOfData > 0 ? (totalIncome / daysOfData) * 7 : 0

  return {
    weeklyIncome: Math.round(weeklyIncome),
    hasSufficientData: daysOfData >= 3,
    daysOfData,
    runsAnalyzed: recentRuns.length,
  }
}

// =============================================================================
// Growth Rate Calculation
// =============================================================================

/**
 * Calculate weekly income totals for each week from grouped runs.
 */
function calculateWeeklyTotals(
  runsByWeek: Map<string, ParsedGameRun[]>,
  weekKeys: string[],
  config: CurrencyFieldConfig
): number[] {
  return weekKeys.map((weekKey) => {
    const weekRuns = runsByWeek.get(weekKey) || []
    return weekRuns.reduce((sum, run) => sum + extractRunValue(run, config), 0)
  })
}

/**
 * Calculate growth rate using linear regression.
 *
 * This approach finds the best-fit line through the weekly data points,
 * which is more robust than averaging week-over-week changes because:
 * - It smooths out volatility (e.g., tournament weeks vs normal weeks)
 * - It represents the actual trend rather than being skewed by outliers
 * - It handles the case where values bounce around a stable mean (returns ~0%)
 *
 * The slope of the regression line is converted to a percentage of the mean value.
 *
 * @param weeklyIncomes - Array of weekly income totals
 * @returns Weekly growth rate as a percentage
 */
function calculateGrowthRateFromRegression(weeklyIncomes: number[]): number {
  const n = weeklyIncomes.length
  if (n < 2) return 0

  // Calculate mean of x (week indices) and y (incomes)
  const meanX = (n - 1) / 2 // Mean of 0, 1, 2, ... n-1
  const meanY = weeklyIncomes.reduce((sum, val) => sum + val, 0) / n

  // If mean income is zero or negative, can't calculate meaningful growth
  if (meanY <= 0) return 0

  // Calculate slope using least squares regression
  // slope = Σ((x - meanX)(y - meanY)) / Σ((x - meanX)²)
  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    const xDiff = i - meanX
    const yDiff = weeklyIncomes[i] - meanY
    numerator += xDiff * yDiff
    denominator += xDiff * xDiff
  }

  if (denominator === 0) return 0

  const slope = numerator / denominator

  // Convert slope to percentage growth rate relative to mean
  // slope represents "change per week", divide by mean to get percentage
  const growthRatePercent = (slope / meanY) * 100

  return growthRatePercent
}

/**
 * Calculate derived growth rate from run data.
 *
 * Uses linear regression to find the trend in weekly income over time.
 * This is more stable than averaging week-over-week changes because it
 * smooths out volatility from tournaments, inconsistent play patterns, etc.
 *
 * @param runs - All available runs
 * @param config - Field configuration for the currency
 * @param lookbackPeriod - How far back to analyze for growth trend
 * @param referenceDate - Date to calculate from (defaults to now)
 * @returns Derived growth rate result with data quality indicators
 */
export function calculateDerivedGrowthRate(
  runs: ParsedGameRun[],
  config: CurrencyFieldConfig,
  lookbackPeriod: LookbackPeriod,
  referenceDate: Date = new Date()
): DerivedGrowthRateResult {
  const filteredRuns = filterRunsByLookback(runs, lookbackPeriod, referenceDate)

  if (filteredRuns.length === 0) {
    return { growthRatePercent: 0, hasSufficientData: false, weeksOfData: 0 }
  }

  const runsByWeek = groupRunsByWeek(filteredRuns)
  const weekKeys = Array.from(runsByWeek.keys()).sort()
  const weeksOfData = weekKeys.length

  if (weeksOfData < 2) {
    return { growthRatePercent: 0, hasSufficientData: false, weeksOfData }
  }

  const weeklyIncomes = calculateWeeklyTotals(runsByWeek, weekKeys, config)
  const growthRatePercent = calculateGrowthRateFromRegression(weeklyIncomes)

  return {
    growthRatePercent: Math.round(growthRatePercent * 10) / 10,
    hasSufficientData: weeksOfData >= 4,
    weeksOfData,
  }
}

// =============================================================================
// Combined Calculation
// =============================================================================

/**
 * Calculate both derived income and growth rate for a currency.
 */
export function calculateDerivedValues(
  runs: ParsedGameRun[],
  currencyId: CurrencyId,
  lookbackPeriod: LookbackPeriod,
  referenceDate: Date = new Date()
): { income: DerivedIncomeResult | null; growthRate: DerivedGrowthRateResult | null } {
  const config = DERIVABLE_CURRENCY_FIELDS[currencyId]

  if (!config) {
    return { income: null, growthRate: null }
  }

  return {
    income: calculateDerivedWeeklyIncome(runs, config, referenceDate),
    growthRate: calculateDerivedGrowthRate(runs, config, lookbackPeriod, referenceDate),
  }
}
