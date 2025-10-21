import type { ParsedGameRun } from '../types/game-run.types';

/**
 * Calculate total duration in hours from a set of runs
 *
 * @param runs - Array of game runs to sum durations from
 * @returns Total duration in hours (converted from seconds)
 *
 * @example
 * const runs = [runA, runB]; // runA: 3600s (1h), runB: 7200s (2h)
 * calculateTotalDurationHours(runs); // Returns 3.0
 */
export function calculateTotalDurationHours(runs: ParsedGameRun[]): number {
  return runs.reduce((total, run) => {
    const durationSeconds = run.realTime;
    return total + (durationSeconds / 3600); // Convert seconds to hours
  }, 0);
}

/**
 * Calculate hourly rate for a value and duration
 *
 * @param value - The total value to normalize (e.g., coins earned, cells earned)
 * @param durationHours - The duration in hours
 * @returns The hourly rate (value per hour)
 *
 * @remarks
 * Returns 0 when duration is 0 to handle edge cases gracefully.
 * This prevents division-by-zero errors for runs with no recorded duration,
 * treating them as having no meaningful hourly rate rather than infinite rate.
 *
 * Works for both per-run calculations (single field value / single run duration)
 * and aggregated period calculations (total field value / total duration).
 */
export function calculateHourlyRate(value: number, durationHours: number): number {
  if (durationHours === 0) return 0;
  return value / durationHours;
}

/**
 * Format total duration hours for display in column subheader
 * Rounds to 1 decimal place for readability
 *
 * @param totalHours - The total duration in hours
 * @returns Formatted string like "25.8 hours" or "1 hour"
 *
 * @example
 * formatHoursSubheader(25.75); // "25.8 hours"
 * formatHoursSubheader(11.5); // "11.5 hours"
 * formatHoursSubheader(1.0); // "1 hour"
 */
export function formatHoursSubheader(totalHours: number): string {
  const rounded = Math.round(totalHours * 10) / 10;
  return `${rounded} ${rounded === 1 ? 'hour' : 'hours'}`;
}
