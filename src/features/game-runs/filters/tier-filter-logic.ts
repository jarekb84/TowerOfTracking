import type { ParsedGameRun } from '../../data-tracking/types/game-run.types';

export function filterRunsByTier(runs: ParsedGameRun[], selectedTier: number | null): ParsedGameRun[] {
  if (selectedTier === null) {
    return runs;
  }
  
  return runs.filter(run => run.tier === selectedTier);
}

export function getAvailableTiers(runs: ParsedGameRun[]): number[] {
  return Array.from(new Set(runs.map(run => run.tier))).sort((a, b) => b - a);
}