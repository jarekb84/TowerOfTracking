import type { ParsedGameRun, TierTrendsFilters } from '../types';
import { TrendsDuration } from '../types';
import { createEnhancedRunHeader } from './run-header-formatting';

/**
 * Represents data for a specific time period with associated runs
 */
export interface PeriodData {
  label: string;
  subLabel?: string;
  runs: ParsedGameRun[];
  startDate: Date;
  endDate: Date;
}

/**
 * Group runs by the specified time period
 *
 * @param runs - Game runs to group (should be sorted newest first)
 * @param duration - Time period type (per-run, daily, weekly, monthly)
 * @param quantity - Number of periods to include
 * @returns Array of period data with associated runs
 *
 * @remarks
 * - For PER_RUN mode: Returns individual runs with enhanced headers
 * - For time-based modes: Groups runs into calendar periods
 * - Uses latest run timestamp as reference point (not current time)
 * - Includes empty periods to maintain consistency
 */
export function groupRunsByPeriod(
  runs: ParsedGameRun[],
  duration: TierTrendsFilters['duration'],
  quantity: number
): PeriodData[] {
  if (duration === TrendsDuration.PER_RUN) {
    return runs.slice(0, quantity).map((run) => {
      // Use enhanced headers for per-run analysis
      const headerData = createEnhancedRunHeader(run);

      return {
        label: headerData.header,
        subLabel: headerData.subHeader,
        runs: [run],
        startDate: run.timestamp,
        endDate: run.timestamp
      };
    });
  }

  const periods: PeriodData[] = [];
  // Use the latest run's timestamp as the reference point instead of current time
  const referenceDate = runs.length > 0 ? runs[0].timestamp : new Date();

  for (let i = 0; i < quantity; i++) {
    const { startDate, endDate, label } = getPeriodBounds(referenceDate, duration, i);
    const periodRuns = runs.filter(run =>
      run.timestamp >= startDate && run.timestamp <= endDate
    );

    // For time-based grouping, include periods even if empty to maintain consistency
    periods.push({
      label,
      runs: periodRuns,
      startDate,
      endDate
    });
  }

  return periods;
}

/**
 * Get the start/end dates and label for a specific period
 *
 * @param now - Reference date (typically latest run timestamp)
 * @param duration - Time period type
 * @param periodOffset - Period offset from reference (0 = current, 1 = previous, etc.)
 * @returns Period boundaries and display label
 *
 * @remarks
 * - DAILY: Midnight to midnight for the target date
 * - WEEKLY: Sunday to Saturday for the week containing target date
 * - MONTHLY: First to last day of the target month
 */
export function getPeriodBounds(
  now: Date,
  duration: TierTrendsFilters['duration'],
  periodOffset: number
): { startDate: Date; endDate: Date; label: string } {
  const currentDate = new Date(now);

  switch (duration) {
    case TrendsDuration.DAILY: {
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - periodOffset);

      const startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);

      return {
        startDate,
        endDate,
        label: targetDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      };
    }

    case TrendsDuration.WEEKLY: {
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - (periodOffset * 7));

      // Get start of week (Sunday)
      const startDate = new Date(targetDate);
      startDate.setDate(targetDate.getDate() - targetDate.getDay());
      startDate.setHours(0, 0, 0, 0);

      // Get end of week (Saturday)
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      return {
        startDate,
        endDate,
        label: `Week of ${startDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}`
      };
    }

    case TrendsDuration.MONTHLY: {
      const targetDate = new Date(currentDate);
      targetDate.setMonth(currentDate.getMonth() - periodOffset);

      const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

      return {
        startDate,
        endDate,
        label: targetDate.toLocaleDateString('en-US', { month: 'short' })
      };
    }

    default:
      throw new Error(`Unsupported duration: ${duration}`);
  }
}
