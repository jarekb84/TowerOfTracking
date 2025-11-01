import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { calculateTotalDurationHours, calculateHourlyRate } from './hourly-rate-calculations';

/**
 * Sum all numeric values for a field across runs
 */
export function sumAggregation(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0);
}

/**
 * Calculate the average of all numeric values for a field across runs
 */
export function averageAggregation(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Find the minimum value for a field across runs
 */
export function minAggregation(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

/**
 * Find the maximum value for a field across runs
 */
export function maxAggregation(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

/**
 * Calculate hourly rate by summing all values and dividing by total duration
 *
 * @param values - Array of field values from runs
 * @param runs - The runs to calculate total duration from
 * @returns Hourly rate (total value / total duration in hours)
 */
export function hourlyAggregation(values: number[], runs: ParsedGameRun[]): number {
  if (values.length === 0) return 0;
  const totalValue = sumAggregation(values);
  const totalDurationHours = calculateTotalDurationHours(runs);
  return calculateHourlyRate(totalValue, totalDurationHours);
}
