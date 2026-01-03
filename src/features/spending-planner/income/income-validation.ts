/**
 * Income Validation
 *
 * Validates income input values before saving.
 */

import type { CurrencyIncome, StoneIncomeBreakdown } from '../types'

/**
 * Result of validating income values.
 */
interface IncomeValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validate a currency income configuration.
 */
export function validateCurrencyIncome(income: CurrencyIncome): IncomeValidationResult {
  const errors: string[] = []

  if (income.currentBalance < 0) {
    errors.push('Current balance cannot be negative')
  }

  if (income.weeklyIncome < 0) {
    errors.push('Weekly income cannot be negative')
  }

  if (income.growthRatePercent < -100) {
    errors.push('Growth rate cannot be less than -100%')
  }

  if (income.growthRatePercent > 1000) {
    errors.push('Growth rate cannot exceed 1000%')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate stone income breakdown.
 */
export function validateStoneBreakdown(breakdown: StoneIncomeBreakdown): IncomeValidationResult {
  const errors: string[] = []

  if (breakdown.weeklyChallenges < 0) {
    errors.push('Weekly challenges cannot be negative')
  }

  if (breakdown.eventStore < 0) {
    errors.push('Event store cannot be negative')
  }

  if (breakdown.tournamentResults < 0) {
    errors.push('Tournament results cannot be negative')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Clamp a number to a valid range.
 */
export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Ensure a number is non-negative.
 */
export function ensureNonNegative(value: number): number {
  return Math.max(0, value)
}

/**
 * Clamp growth rate to valid range (-100% to 1000%).
 */
export function clampGrowthRate(value: number): number {
  return clampNumber(value, -100, 1000)
}
