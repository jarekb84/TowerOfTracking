/**
 * Period Grouping Logic
 *
 * Pure functions for grouping runs by time periods and calculating
 * aggregate source breakdowns per period.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type {
  CategoryDefinition,
  PeriodSourceBreakdown,
  SourceDuration,
  SourceValue,
  SourceSummary,
  SourceSummaryValue,
  SourceAnalysisData,
  SourceAnalysisFilters,
} from '../types';
import {
  extractFieldValue,
  calculatePercentage,
} from './source-extraction';
import {
  getPeriodKey,
  formatPeriodLabel,
} from './period-formatting';

// Re-export for backwards compatibility with existing imports
export { getPeriodKey, formatPeriodLabel } from './period-formatting';

/**
 * Group runs by the specified duration period
 */
export function groupRunsByPeriod(
  runs: ParsedGameRun[],
  duration: SourceDuration
): Map<string, ParsedGameRun[]> {
  const groups = new Map<string, ParsedGameRun[]>();

  for (const run of runs) {
    const key = getPeriodKey(run.timestamp, duration);
    const existing = groups.get(key) || [];
    groups.set(key, [...existing, run]);
  }

  return groups;
}

/**
 * Calculate source breakdown for a group of runs in one period
 */
export function calculatePeriodBreakdown(
  runs: ParsedGameRun[],
  category: CategoryDefinition,
  periodKey: string,
  periodLabel: string
): PeriodSourceBreakdown {
  // Sum all sources across runs in this period
  const sourceTotals = new Map<string, number>();
  let periodTotal = 0;

  for (const source of category.sources) {
    sourceTotals.set(source.fieldName, 0);
  }

  for (const run of runs) {
    for (const source of category.sources) {
      const value = extractFieldValue(run, source.fieldName);
      sourceTotals.set(source.fieldName, (sourceTotals.get(source.fieldName) || 0) + value);
      periodTotal += value;
    }
  }

  // Convert to SourceValue array with percentages
  const sources: SourceValue[] = category.sources.map(source => ({
    fieldName: source.fieldName,
    displayName: source.displayName,
    color: source.color,
    value: sourceTotals.get(source.fieldName) || 0,
    percentage: calculatePercentage(sourceTotals.get(source.fieldName) || 0, periodTotal)
  }));

  return {
    periodLabel,
    periodKey,
    total: periodTotal,
    runCount: runs.length,
    sources
  };
}

/**
 * Calculate summary across all periods
 */
export function calculateSummary(
  periods: PeriodSourceBreakdown[],
  category: CategoryDefinition
): SourceSummary {
  const sourceTotals = new Map<string, number>();
  let grandTotal = 0;

  // Initialize source totals
  for (const source of category.sources) {
    sourceTotals.set(source.fieldName, 0);
  }

  // Sum across all periods
  for (const period of periods) {
    grandTotal += period.total;
    for (const source of period.sources) {
      sourceTotals.set(source.fieldName, (sourceTotals.get(source.fieldName) || 0) + source.value);
    }
  }

  // Build summary values
  const sources: SourceSummaryValue[] = category.sources.map(source => ({
    fieldName: source.fieldName,
    displayName: source.displayName,
    color: source.color,
    totalValue: sourceTotals.get(source.fieldName) || 0,
    percentage: calculatePercentage(sourceTotals.get(source.fieldName) || 0, grandTotal)
  }));

  // Sort by percentage descending and filter non-zero
  const sortedSources = sources
    .filter(s => s.totalValue > 0)
    .sort((a, b) => b.percentage - a.percentage);

  return {
    totalValue: grandTotal,
    periodCount: periods.length,
    sources: sortedSources
  };
}

/**
 * Apply filters to runs
 */
export function filterRuns(
  runs: ParsedGameRun[],
  filters: SourceAnalysisFilters
): ParsedGameRun[] {
  return runs.filter(run => {
    // Filter by run type
    if (filters.runType !== 'all' && run.runType !== filters.runType) {
      return false;
    }

    // Filter by tier
    if (filters.tier !== 'all' && run.tier !== filters.tier) {
      return false;
    }

    return true;
  });
}

/**
 * Get the most recent N periods of data
 */
export function limitToPeriods(
  groups: Map<string, ParsedGameRun[]>,
  quantity: number,
  duration: SourceDuration
): Map<string, ParsedGameRun[]> {
  // Sort keys by date (most recent first)
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (duration === 'per-run') {
      return new Date(b).getTime() - new Date(a).getTime();
    }
    return b.localeCompare(a);
  });

  // Take only the most recent N periods
  const limitedKeys = sortedKeys.slice(0, quantity);

  // Reverse to get oldest first for chart display
  const result = new Map<string, ParsedGameRun[]>();
  for (const key of limitedKeys.reverse()) {
    const value = groups.get(key);
    if (value) {
      result.set(key, value);
    }
  }

  return result;
}

/**
 * Main calculation function - produces complete source analysis data
 */
export function calculateSourceAnalysis(
  runs: ParsedGameRun[],
  category: CategoryDefinition,
  filters: SourceAnalysisFilters
): SourceAnalysisData {
  // Apply filters
  const filteredRuns = filterRuns(runs, filters);

  // Sort by timestamp (oldest first for consistent grouping)
  const sortedRuns = [...filteredRuns].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Group by period
  let groups = groupRunsByPeriod(sortedRuns, filters.duration);

  // Limit to requested quantity
  groups = limitToPeriods(groups, filters.quantity, filters.duration);

  // Calculate breakdown for each period
  const groupEntries = Array.from(groups.entries());
  const totalRuns = groupEntries.length;

  const periods: PeriodSourceBreakdown[] = groupEntries.map(([key, periodRuns], index) => {
    const label = formatPeriodLabel(key, filters.duration, index, totalRuns);
    return calculatePeriodBreakdown(periodRuns, category, key, label);
  });

  // Calculate overall summary
  const summary = calculateSummary(periods, category);

  return {
    category,
    filters,
    periods,
    summary
  };
}
