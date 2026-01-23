/**
 * Results Formatters
 *
 * Pure functions for formatting simulation results for display.
 * All number formatting uses locale-aware utilities from @/shared/formatting/.
 */

import {
  formatLargeNumber,
  formatPercentage as formatLocalePercentage,
} from '@/shared/formatting/number-scale';

/**
 * Format a large number with appropriate suffix (K, M, B)
 *
 * Delegates to the shared locale-aware formatLargeNumber utility.
 * This ensures consistent formatting across all locales.
 */
export function formatCost(value: number): string {
  return formatLargeNumber(value);
}

/**
 * Format a cost range (min - max)
 */
export function formatCostRange(min: number, max: number): string {
  return `${formatCost(min)} - ${formatCost(max)}`;
}

/**
 * Format a percentage value using locale-aware formatting
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return formatLocalePercentage(value, decimals);
}

/**
 * Format a probability as a percentage using locale-aware formatting.
 * Uses adaptive decimal places based on magnitude for readability.
 */
export function formatProbability(probability: number): string {
  const percent = probability * 100;
  if (percent < 0.1) {
    return formatLocalePercentage(percent, 2);
  }
  if (percent < 1) {
    return formatLocalePercentage(percent, 1);
  }
  return formatLocalePercentage(percent, 0);
}

/**
 * Format shard cost with unit
 */
export function formatShardCost(shards: number): string {
  return `${formatCost(shards)} shards`;
}

/**
 * Format roll count
 */
export function formatRollCount(rolls: number): string {
  return `${formatCost(rolls)} rolls`;
}

/**
 * Format expected rolls (1/probability)
 */
export function formatExpectedRolls(probability: number): string {
  if (probability <= 0) {
    return '∞ rolls';
  }
  const expected = 1 / probability;
  return `~${formatCost(expected)} rolls`;
}

/**
 * Get color for a percentile indicator
 */
export function getPercentileColor(percentile: number): string {
  if (percentile <= 25) return '#22c55e'; // Green (good case)
  if (percentile <= 50) return '#eab308'; // Yellow (typical)
  if (percentile <= 75) return '#f97316'; // Orange (pessimistic)
  return '#ef4444'; // Red (worst case)
}

/**
 * Format a percentile label
 */
export function formatPercentileLabel(percentile: number): string {
  if (percentile === 50) return 'Median';
  if (percentile === 25) return '25th %ile (good)';
  if (percentile === 75) return '75th %ile (pessimistic)';
  if (percentile === 95) return '95th %ile (worst)';
  return `${percentile}th %ile`;
}

/**
 * Format simulation run count using locale-aware number formatting
 */
export function formatRunCount(count: number): string {
  return `Based on ${formatLargeNumber(count)} simulations`;
}

/**
 * Calculate and format the "confidence" message
 */
export function formatConfidenceMessage(percentile95: number): string {
  return `95% of runs cost less than ${formatCost(percentile95)} shards`;
}

/**
 * Generate collapsed header summary for Monte Carlo Simulation panel
 * Format: "Good: 450 | Typ: 1.2K | Pess: 3.8K" or "Simulating... 45%" or "No results yet"
 */
export function generateSimulationSummary(
  results: { percentile25: number; median: number; percentile75: number } | null,
  isRunning: boolean,
  progress: number,
  hasTargets: boolean
): string {
  if (isRunning) {
    return `Simulating... ${formatLocalePercentage(progress, 0)}`;
  }

  if (results) {
    return `Good: ${formatCost(results.percentile25)} | Typ: ${formatCost(results.median)} | Pess: ${formatCost(results.percentile75)}`;
  }

  if (!hasTargets) {
    return 'No targets selected';
  }

  return 'Ready to simulate';
}
