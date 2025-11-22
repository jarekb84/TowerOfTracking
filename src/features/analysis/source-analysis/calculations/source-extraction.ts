/**
 * Source Extraction Logic
 *
 * Pure functions for extracting source values from game run data.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type { CategoryDefinition, SourceFieldDefinition, SourceValue } from '../types';
import { FIELD_ALIASES } from '../category-config';

/**
 * Extract numeric value from a game run field
 * Returns 0 if field doesn't exist or isn't a number
 */
export function extractFieldValue(
  run: ParsedGameRun,
  fieldName: string
): number {
  // Try primary field name
  const field = run.fields[fieldName];
  if (field && typeof field.value === 'number') {
    return field.value;
  }

  // Try aliases
  const aliases = FIELD_ALIASES[fieldName];
  if (aliases) {
    for (const alias of aliases) {
      const aliasField = run.fields[alias];
      if (aliasField && typeof aliasField.value === 'number') {
        return aliasField.value;
      }
    }
  }

  return 0;
}

/**
 * Extract all source values for a category from a single run
 */
export function extractSourceValues(
  run: ParsedGameRun,
  category: CategoryDefinition
): SourceValue[] {
  const total = calculateRunTotal(run, category);

  return category.sources.map(source => {
    const value = extractFieldValue(run, source.fieldName);
    return {
      fieldName: source.fieldName,
      displayName: source.displayName,
      color: source.color,
      value,
      percentage: calculatePercentage(value, total)
    };
  });
}

/**
 * Calculate the total value for a category from a run
 * Uses the totalField if available, otherwise sums all sources
 */
export function calculateRunTotal(
  run: ParsedGameRun,
  category: CategoryDefinition
): number {
  // Try to get the explicit total field
  const totalFromField = extractFieldValue(run, category.totalField);
  if (totalFromField > 0) {
    return totalFromField;
  }

  // Fall back to summing all sources
  return sumSourceValues(run, category.sources);
}

/**
 * Sum all source values from a run
 */
export function sumSourceValues(
  run: ParsedGameRun,
  sources: SourceFieldDefinition[]
): number {
  return sources.reduce((sum, source) => {
    return sum + extractFieldValue(run, source.fieldName);
  }, 0);
}

/**
 * Calculate percentage with proper handling of edge cases
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0 || value === 0) {
    return 0;
  }
  // Round to 2 decimal places for display
  return Math.round((value / total) * 10000) / 100;
}

/**
 * Filter sources to only include those with non-zero values
 */
export function filterNonZeroSources(sources: SourceValue[]): SourceValue[] {
  return sources.filter(source => source.value > 0);
}

/**
 * Sort sources by percentage descending
 */
export function sortSourcesByPercentage(sources: SourceValue[]): SourceValue[] {
  return [...sources].sort((a, b) => b.percentage - a.percentage);
}

/**
 * Generic sort by percentage descending for any type with a percentage property
 */
export function sortByPercentageDescending<T extends { percentage: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => b.percentage - a.percentage);
}

/**
 * Check if a run has any data for the given category
 */
export function hasSourceData(
  run: ParsedGameRun,
  category: CategoryDefinition
): boolean {
  // Check total field
  if (extractFieldValue(run, category.totalField) > 0) {
    return true;
  }

  // Check individual sources
  return category.sources.some(source =>
    extractFieldValue(run, source.fieldName) > 0
  );
}
