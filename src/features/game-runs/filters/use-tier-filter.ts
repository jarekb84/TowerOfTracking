import { useState, useMemo } from 'react';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { filterRunsByTier, getAvailableTiers } from './tier-filter-logic';

interface UseTierFilterResult {
  selectedTier: number | null;
  setSelectedTier: (tier: number | null) => void;
  filteredRuns: ParsedGameRun[];
  availableTiers: number[];
  shouldShowFilter: boolean;
}

export function useTierFilter(runs: ParsedGameRun[]): UseTierFilterResult {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  const availableTiers = useMemo(() => 
    getAvailableTiers(runs), 
    [runs]
  );

  const filteredRuns = useMemo(() => 
    filterRunsByTier(runs, selectedTier), 
    [runs, selectedTier]
  );

  const shouldShowFilter = availableTiers.length > 1;

  return {
    selectedTier,
    setSelectedTier,
    filteredRuns,
    availableTiers,
    shouldShowFilter,
  };
}