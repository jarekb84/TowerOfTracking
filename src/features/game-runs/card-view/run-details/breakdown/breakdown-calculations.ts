/**
 * Breakdown Calculations
 *
 * Pure functions for calculating percentage breakdowns of run statistics.
 * Used for damage sources, coin sources, enemy types, and module types.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import {
  calculateDiscrepancy,
  DISCREPANCY_COLORS,
  DISCREPANCY_FIELD_NAMES,
  DISCREPANCY_DISPLAY_NAMES,
} from '@/shared/domain/fields/breakdown-sources'
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
 * Calculate game speed multiplier (gameTime / realTime).
 * Returns null if realTime is 0 (cannot calculate).
 */
export function calculateGameSpeed(
  gameTimeSeconds: number,
  realTimeSeconds: number
): number | null {
  if (realTimeSeconds === 0) {
    return null
  }
  return gameTimeSeconds / realTimeSeconds
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
 * Build a discrepancy breakdown item (Unknown or Overage).
 */
function buildDiscrepancyItem(
  type: 'unknown' | 'overage',
  value: number,
  percentage: number
): BreakdownItem {
  return {
    fieldName: DISCREPANCY_FIELD_NAMES[type],
    displayName: DISCREPANCY_DISPLAY_NAMES[type],
    color: DISCREPANCY_COLORS[type],
    value,
    percentage,
    displayValue: formatLargeNumber(value),
    isDiscrepancy: true,
    discrepancyType: type,
  }
}

/** Options for discrepancy check */
interface DiscrepancyCheckOptions {
  items: BreakdownItem[]
  existingItems: BreakdownItem[]
  total: number
  config: BreakdownConfig
}

/**
 * Check for discrepancy and append to items if found.
 * Only checks when there's an explicit totalField and skipDiscrepancy is false.
 */
function appendDiscrepancyIfNeeded(options: DiscrepancyCheckOptions): void {
  const { items, existingItems, total, config } = options
  if (config.totalField === null || config.skipDiscrepancy) return

  const sourceSum = existingItems.reduce((sum, item) => sum + item.value, 0)
  const discrepancy = calculateDiscrepancy(total, sourceSum)
  if (discrepancy) {
    items.push(buildDiscrepancyItem(discrepancy.type, discrepancy.value, discrepancy.percentage))
  }
}

/**
 * Extract per-hour display value if configured.
 */
function extractPerHourDisplay(run: ParsedGameRun, perHourField?: string): string | undefined {
  if (!perHourField) return undefined
  const value = extractFieldValue(run, perHourField)
  return value > 0 ? formatLargeNumber(value) : undefined
}

/**
 * Calculate complete breakdown data for a group.
 * Returns null if the total is 0 (nothing to show).
 *
 * When a totalField is configured and sources don't sum to the total,
 * a discrepancy entry (Unknown or Overage) is appended to explain the gap.
 */
export function calculateBreakdownGroup(
  run: ParsedGameRun,
  config: BreakdownConfig
): BreakdownGroupData | null {
  const hasTotalField = config.totalField !== null
  const total = hasTotalField
    ? extractFieldValue(run, config.totalField!)
    : calculateSumTotal(run, config.sources.map(s => s.fieldName))

  const allItems = config.sources.map(source => buildBreakdownItem(run, source, total))
  const existingItems = filterBreakdownItems(allItems, run)
  if (existingItems.length === 0) return null

  const sortedItems = sortBreakdownItems(existingItems)
  appendDiscrepancyIfNeeded({ items: sortedItems, existingItems, total, config })

  const totalDisplayValue = config.totalField
    ? (run.fields[config.totalField]?.displayValue ?? formatLargeNumber(total))
    : formatLargeNumber(total)

  return {
    label: config.label,
    total,
    totalDisplayValue,
    perHourDisplayValue: extractPerHourDisplay(run, config.perHourField),
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
