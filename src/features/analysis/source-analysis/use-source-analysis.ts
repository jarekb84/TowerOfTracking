/**
 * Source Analysis View State Hook
 *
 * Manages filters, calculations, and cross-chart state for the Source Analysis feature.
 */

import { useState, useMemo, useCallback } from 'react';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type {
  SourceAnalysisFilters,
  SourceAnalysisData,
  SourceCategory,
  RunTypeFilter,
  SourceDuration,
} from './types';
import { DEFAULT_FILTERS, getDefaultRunTypeForCategory } from './types';
import { getCategoryDefinition } from './category-config';
import { calculateSourceAnalysis } from './calculations/period-grouping';

interface UseSourceAnalysisOptions {
  runs: ParsedGameRun[];
  initialFilters?: Partial<SourceAnalysisFilters>;
}

interface UseSourceAnalysisReturn {
  // Filter state
  filters: SourceAnalysisFilters;
  setCategory: (category: SourceCategory) => void;
  setRunType: (runType: RunTypeFilter) => void;
  setTier: (tier: number | 'all') => void;
  setDuration: (duration: SourceDuration) => void;
  setQuantity: (quantity: number) => void;

  // Analysis data
  analysisData: SourceAnalysisData | null;
  isLoading: boolean;
  hasData: boolean;

  // Cross-chart highlight state
  highlightedSource: string | null;
  setHighlightedSource: (fieldName: string | null) => void;

  // Available options for filters
  availableTiers: number[];
}

/**
 * Extract unique tiers from runs
 */
function extractAvailableTiers(runs: ParsedGameRun[]): number[] {
  const tiers = new Set<number>();
  for (const run of runs) {
    if (run.tier > 0) {
      tiers.add(run.tier);
    }
  }
  return Array.from(tiers).sort((a, b) => a - b);
}

/**
 * Main hook for Source Analysis view state
 */
export function useSourceAnalysis({
  runs,
  initialFilters = {},
}: UseSourceAnalysisOptions): UseSourceAnalysisReturn {
  // Filter state
  const [filters, setFilters] = useState<SourceAnalysisFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // Cross-chart highlight state
  const [highlightedSource, setHighlightedSource] = useState<string | null>(null);

  // Extract available tiers from runs
  const availableTiers = useMemo(() => extractAvailableTiers(runs), [runs]);

  // Calculate analysis data
  const analysisData = useMemo(() => {
    if (runs.length === 0) {
      return null;
    }

    const category = getCategoryDefinition(filters.category);
    return calculateSourceAnalysis(runs, category, filters);
  }, [runs, filters]);

  // Filter setters
  const setCategory = useCallback((category: SourceCategory) => {
    setFilters(prev => ({
      ...prev,
      category,
      runType: getDefaultRunTypeForCategory(category),
    }));
  }, []);

  const setRunType = useCallback((runType: RunTypeFilter) => {
    setFilters(prev => ({ ...prev, runType }));
  }, []);

  const setTier = useCallback((tier: number | 'all') => {
    setFilters(prev => ({ ...prev, tier }));
  }, []);

  const setDuration = useCallback((duration: SourceDuration) => {
    setFilters(prev => ({ ...prev, duration }));
  }, []);

  const setQuantity = useCallback((quantity: number) => {
    setFilters(prev => ({ ...prev, quantity: Math.max(1, Math.min(50, quantity)) }));
  }, []);

  // Derived state
  const hasData = analysisData !== null && analysisData.periods.length > 0;

  return {
    // Filter state
    filters,
    setCategory,
    setRunType,
    setTier,
    setDuration,
    setQuantity,

    // Analysis data
    analysisData,
    isLoading: false, // Calculations are synchronous
    hasData,

    // Cross-chart highlight state
    highlightedSource,
    setHighlightedSource,

    // Available options
    availableTiers,
  };
}
