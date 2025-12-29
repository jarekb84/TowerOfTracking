/**
 * Results Formatters
 *
 * Pure functions for formatting simulation results for display.
 */

import { formatLargeNumber } from '@/shared/formatting/number-scale';

/**
 * Format a large number with appropriate suffix (K, M, B)
 *
 * Uses 2 decimal places for better precision when comparing similar values.
 */
export function formatCost(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Format a cost range (min - max)
 */
export function formatCostRange(min: number, max: number): string {
  return `${formatCost(min)} - ${formatCost(max)}`;
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a probability as a percentage
 */
export function formatProbability(probability: number): string {
  const percent = probability * 100;
  if (percent < 0.1) {
    return `${percent.toFixed(2)}%`;
  }
  if (percent < 1) {
    return `${percent.toFixed(1)}%`;
  }
  return `${percent.toFixed(0)}%`;
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
  if (percentile <= 10) return '#22c55e'; // Green (lucky)
  if (percentile <= 50) return '#f97316'; // Orange (median)
  if (percentile <= 90) return '#eab308'; // Yellow (above average)
  return '#ef4444'; // Red (unlucky)
}

/**
 * Format a percentile label
 */
export function formatPercentileLabel(percentile: number): string {
  if (percentile === 50) return 'Median';
  if (percentile === 10) return '10th %ile (lucky)';
  if (percentile === 90) return '90th %ile';
  if (percentile === 95) return '95th %ile (unlucky)';
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
 * Format: "Best: 450 | Typ: 1.2K | Worst: 3.8K" or "Simulating... 45%" or "No results yet"
 */
export function generateSimulationSummary(
  results: { percentile10: number; median: number; percentile90: number } | null,
  isRunning: boolean,
  progress: number,
  hasTargets: boolean
): string {
  if (isRunning) {
    return `Simulating... ${progress.toFixed(0)}%`;
  }

  if (results) {
    return `Best: ${formatCost(results.percentile10)} | Typ: ${formatCost(results.median)} | Worst: ${formatCost(results.percentile90)}`;
  }

  if (!hasTargets) {
    return 'No targets selected';
  }

  return 'Ready to simulate';
}
