/**
 * Period Limiting Logic
 *
 * Pure function for selecting the most recent N periods from grouped run data.
 * Shared across analysis features that need period-limited views.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { Duration } from '@/shared/domain/filters/types';

/**
 * Get the most recent N periods of data
 *
 * @param groups - Map of period key to runs in that period
 * @param quantity - Number of periods to keep, or 'all' for no limit
 * @param duration - Duration type (affects sort strategy for per-run keys)
 * @returns New Map with only the most recent periods, ordered oldest-first
 */
export function limitToPeriods(
  groups: Map<string, ParsedGameRun[]>,
  quantity: number | 'all',
  duration: Duration
): Map<string, ParsedGameRun[]> {
  // Sort keys by date (most recent first)
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (duration === 'per-run') {
      return new Date(b).getTime() - new Date(a).getTime();
    }
    return b.localeCompare(a);
  });

  // Take only the most recent N periods (or all if quantity is 'all')
  const limitedKeys = quantity === 'all' ? sortedKeys : sortedKeys.slice(0, quantity);

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
