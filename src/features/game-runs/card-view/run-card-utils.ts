import { formatNumber, formatDuration, calculatePerHour } from '@/features/analysis/shared/data-parser';
import { getFieldValue } from '@/features/analysis/shared/field-utils';
import type { ParsedGameRun } from '../../data-tracking/types/game-run.types';

/**
 * Extracts and formats data for the RunCard header section
 */
export function extractCardHeaderData(run: ParsedGameRun) {
  const shortDuration = run.realTime ? formatDuration(run.realTime).replace(/(\d+)s?$/, '') : '-';
  const dateStr = run.timestamp.toLocaleDateString();
  const timeStr = run.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

/**
 * Calculates economy data with per-hour rates for the RunCard
 */
export function calculateEconomyData(run: ParsedGameRun) {
  const coinsPerHour = calculatePerHour(run.coinsEarned ?? 0, run.realTime ?? 0);
  const cellsPerHour = calculatePerHour(run.cellsEarned ?? 0, run.realTime ?? 0);
  
  return {
    coins: run.coinsEarned ? formatNumber(run.coinsEarned) : '-',
    coinsPerHour: coinsPerHour ? formatNumber(coinsPerHour) : '-',
    cells: run.cellsEarned ? formatNumber(run.cellsEarned) : '-',
    cellsPerHour: cellsPerHour ? formatNumber(cellsPerHour) : '-',
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