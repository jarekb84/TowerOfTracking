/**
 * Breakdown Calculations
 *
 * Pure functions for calculating percentage breakdowns of run statistics.
 * Used for damage sources, coin sources, enemy types, and module types.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import type {
  BreakdownConfig,
  BreakdownGroupData,
  BreakdownItem,
  PlainFieldsConfig,
  PlainFieldsData,
  PlainFieldItem,
} from '../types'

/**
 * Extract numeric value from a game run field.
 * Returns 0 if field doesn't exist or isn't a number.
 */
export function extractFieldValue(run: ParsedGameRun, fieldName: string): number {
  const field = run.fields[fieldName]
  if (field && typeof field.value === 'number') {
    return field.value
  }
  return 0
}

/**
 * Check if a field exists in the run (regardless of value).
 */
export function fieldExists(run: ParsedGameRun, fieldName: string): boolean {
  return fieldName in run.fields
}

/**
 * Calculate percentage with proper edge case handling.
 * Returns 0 if total is 0 to avoid division by zero.
 * Rounds to 2 decimal places.
 */
export function calculateBreakdownPercentage(value: number, total: number): number {
  if (total === 0 || value === 0) {
    return 0
  }
  // Round to 2 decimal places for display
  return Math.round((value / total) * 10000) / 100
}

/**
 * Calculate sum of values from multiple fields.
 * Used for computed totals (shards, modules) where no explicit total field exists.
 */
export function calculateSumTotal(run: ParsedGameRun, fieldNames: string[]): number {
  return fieldNames.reduce((sum, fieldName) => {
    return sum + extractFieldValue(run, fieldName)
  }, 0)
}

/**
 * Calculate per-hour rate from a value and duration.
 * Returns 0 if duration is 0 to avoid division by zero.
 */
export function calculatePerHourRate(value: number, durationSeconds: number): number {
  if (durationSeconds === 0) {
    return 0
  }
  const hours = durationSeconds / 3600
  return value / hours
}

/**
 * Sort breakdown items by percentage descending.
 * Uses value as tiebreaker for equal percentages.
 */
export function sortBreakdownItems(items: BreakdownItem[]): BreakdownItem[] {
  return [...items].sort((a, b) => {
    const percentDiff = b.percentage - a.percentage
    if (percentDiff !== 0) return percentDiff
    // Tiebreaker: higher value first
    return b.value - a.value
  })
}

/**
 * Filter breakdown items based on visibility rules.
 * - Zero values are shown if the field exists (per PRD)
 * - Missing fields are not shown (per PRD)
 */
function filterBreakdownItems(
  items: BreakdownItem[],
  run: ParsedGameRun
): BreakdownItem[] {
  return items.filter(item => fieldExists(run, item.fieldName))
}

/**
 * Build a single breakdown item from a source config.
 */
function buildBreakdownItem(
  run: ParsedGameRun,
  source: { fieldName: string; displayName: string; color: string },
  total: number
): BreakdownItem {
  const value = extractFieldValue(run, source.fieldName)
  const percentage = calculateBreakdownPercentage(value, total)
  const field = run.fields[source.fieldName]
  const displayValue = field?.displayValue ?? formatLargeNumber(value)

  return {
    fieldName: source.fieldName,
    displayName: source.displayName,
    color: source.color,
    value,
    percentage,
    displayValue,
  }
}

/**
 * Calculate complete breakdown data for a group.
 * Returns null if the total is 0 (nothing to show).
 */
export function calculateBreakdownGroup(
  run: ParsedGameRun,
  config: BreakdownConfig
): BreakdownGroupData | null {
  // Calculate total
  let total: number
  if (config.totalField) {
    total = extractFieldValue(run, config.totalField)
  } else {
    // Computed sum from source fields
    const sourceFieldNames = config.sources.map(s => s.fieldName)
    total = calculateSumTotal(run, sourceFieldNames)
  }

  // Build breakdown items for all sources
  const allItems = config.sources.map(source =>
    buildBreakdownItem(run, source, total)
  )

  // Filter to only show fields that exist in the run
  const existingItems = filterBreakdownItems(allItems, run)

  // If no items exist, return null
  if (existingItems.length === 0) {
    return null
  }

  // Sort by percentage descending
  const sortedItems = sortBreakdownItems(existingItems)

  // Build per-hour value if configured
  let perHourDisplayValue: string | undefined
  if (config.perHourField) {
    const perHourValue = extractFieldValue(run, config.perHourField)
    if (perHourValue > 0) {
      perHourDisplayValue = formatLargeNumber(perHourValue)
    }
  }

  // Get total display value
  const totalDisplayValue = config.totalField
    ? (run.fields[config.totalField]?.displayValue ?? formatLargeNumber(total))
    : formatLargeNumber(total)

  return {
    label: config.label,
    total,
    totalDisplayValue,
    perHourDisplayValue,
    items: sortedItems,
  }
}

/**
 * Extract plain field data from a run.
 * Only includes fields that exist in the run.
 */
export function extractPlainFields(
  run: ParsedGameRun,
  config: PlainFieldsConfig
): PlainFieldsData {
  const items: PlainFieldItem[] = []

  for (const fieldConfig of config.fields) {
    const field = run.fields[fieldConfig.fieldName]
    if (field) {
      items.push({
        fieldName: fieldConfig.fieldName,
        displayName: fieldConfig.displayName ?? field.originalKey,
        displayValue: field.displayValue,
      })
    }
  }

  return {
    label: config.label,
    items,
  }
}

/**
 * Find all uncategorized fields in a run.
 * Returns fields not in the categorized or skip sets.
 */
export function findUncategorizedFields(
  run: ParsedGameRun,
  categorizedFields: Set<string>,
  skipFields: Set<string>
): PlainFieldsData {
  const items: PlainFieldItem[] = []

  for (const [fieldName, field] of Object.entries(run.fields)) {
    if (!categorizedFields.has(fieldName) && !skipFields.has(fieldName)) {
      items.push({
        fieldName,
        displayName: field.originalKey,
        displayValue: field.displayValue,
      })
    }
  }

  return {
    label: 'MISCELLANEOUS',
    items,
  }
}
