import { formatNumber, formatDuration, calculatePerHour } from '@/features/analysis/shared/parsing/data-parser';
import { getFieldValue } from '@/features/analysis/shared/parsing/field-utils';
import { calculateSumTotal } from '@/features/game-runs/card-view/run-details/breakdown/breakdown-calculations';
import { REROLL_SHARDS_FIELDS } from '@/features/game-runs/card-view/run-details/section-config';
import { formatDisplayDate, formatDisplayTime } from '@/shared/formatting/date-formatters';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

/**
 * Extracts and formats data for the RunCard header section
 */
export function extractCardHeaderData(run: ParsedGameRun) {
  const shortDuration = run.realTime ? formatDuration(run.realTime).replace(/(\d+)s?$/, '') : '-';
  const dateStr = formatDisplayDate(run.timestamp);
  const timeStr = formatDisplayTime(run.timestamp);

  return {
    shortDuration,
    dateStr,
    timeStr,
    hasNotes: !!getFieldValue<string>(run, '_notes')?.trim(),
  };
}

/**
 * Extracts progress information for the RunCard
 */
export function extractProgressData(run: ParsedGameRun) {
  return {
    tier: run.tier || '?',
    wave: run.wave?.toLocaleString() || '?',
    killedBy: getFieldValue<string>(run, 'killedBy'),
  };
}

function formatOrDash(value: number): string {
  return value ? formatNumber(value) : '-';
}

/**
 * Calculates economy data with per-hour rates for the RunCard
 */
export function calculateEconomyData(run: ParsedGameRun) {
  const realTime = run.realTime ?? 0;
  const rerollShardsTotal = calculateSumTotal(run, [...REROLL_SHARDS_FIELDS]);

  return {
    coins: formatOrDash(run.coinsEarned ?? 0),
    coinsPerHour: formatOrDash(calculatePerHour(run.coinsEarned ?? 0, realTime)),
    cells: formatOrDash(run.cellsEarned ?? 0),
    cellsPerHour: formatOrDash(calculatePerHour(run.cellsEarned ?? 0, realTime)),
    rerollShards: formatOrDash(rerollShardsTotal),
    rerollShardsPerHour: formatOrDash(calculatePerHour(rerollShardsTotal, realTime)),
  };
}

/**
 * Combines all RunCard data extraction functions
 */
export function extractRunCardData(run: ParsedGameRun) {
  return {
    header: extractCardHeaderData(run),
    progress: extractProgressData(run),
    economy: calculateEconomyData(run),
  };
}