/**
 * Source Analysis View State Hook
 *
 * Manages filters, calculations, and cross-chart state for the Source Analysis feature.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type {
  SourceAnalysisFilters,
  SourceAnalysisData,
  SourceCategory,
  RunTypeFilter,
  PeriodCountFilter,
} from './types';
import { DEFAULT_FILTERS, getDefaultRunTypeForCategory } from './types';
import { getCategoryDefinition } from './category-config';
import { calculateSourceAnalysis } from './calculations/period-grouping';
import { clampPeriodCount } from '@/shared/domain/filters/period-count/period-count-logic';
import { usePeriodCountOptions } from '@/shared/domain/filters/period-count/use-period-count-options';
import { usePeriodCountFallback } from '@/shared/domain/filters/period-count/use-period-count-fallback';
import {
  useAvailableTiers,
  useAvailableDurations,
  Duration,
  getDefaultPeriodCount,
} from '@/shared/domain/filters';
import { usePersistedPageState } from '@/shared/persistence';

interface UseSourceAnalysisOptions {
  runs: ParsedGameRun[];
}

interface UseSourceAnalysisReturn {
  // Filter state
  filters: SourceAnalysisFilters;
  setCategory: (category: SourceCategory) => void;
  setRunType: (runType: RunTypeFilter) => void;
  setTier: (tier: number | 'all') => void;
  setDuration: (duration: Duration) => void;
  setQuantity: (quantity: PeriodCountFilter) => void;

  // Analysis data
  analysisData: SourceAnalysisData | null;
  isLoading: boolean;
  hasData: boolean;

  // Cross-chart highlight state
  highlightedSource: string | null;
  setHighlightedSource: (fieldName: string | null) => void;

  // Available options for filters
  availableTiers: number[];
  availableDurations: Duration[];
  periodCountOptions: number[];
  periodCountLabel: string;
}

const PAGE_SCOPE = 'charts/sources';

/**
 * Main hook for Source Analysis view state
 */
export function useSourceAnalysis({
  runs,
}: UseSourceAnalysisOptions): UseSourceAnalysisReturn {

  // Persisted filter state
  const [category, setCategoryState] = usePersistedPageState<SourceCategory>(
    PAGE_SCOPE, 'category', DEFAULT_FILTERS.category
  );
  const [runType, setRunTypeState] = usePersistedPageState<RunTypeFilter>(
    PAGE_SCOPE, 'runType', DEFAULT_FILTERS.runType
  );
  const [tier, setTierState] = usePersistedPageState<number | 'all'>(
    PAGE_SCOPE, 'tier', DEFAULT_FILTERS.tier
  );
  const [duration, setDurationState] = usePersistedPageState<Duration>(
    PAGE_SCOPE, 'duration', DEFAULT_FILTERS.duration
  );
  const [quantity, setQuantityState] = usePersistedPageState<PeriodCountFilter>(
    PAGE_SCOPE, 'quantity', DEFAULT_FILTERS.quantity
  );

  // Reconstruct filters object for downstream consumers
  const filters = useMemo<SourceAnalysisFilters>(() => ({
    category, runType, tier, duration, quantity,
  }), [category, runType, tier, duration, quantity]);

  // Cross-chart highlight state (ephemeral)
  const [highlightedSource, setHighlightedSource] = useState<string | null>(null);

  // Use unified hooks for available options
  const { tiers: availableTiers } = useAvailableTiers(runs, filters.runType);
  const { durations: availableDurations } = useAvailableDurations(runs);

  // Data-aware period count options
  const { options: periodCountOptions, label: periodCountLabel } =
    usePeriodCountOptions(filters.duration, undefined, runs);

  // Auto-fallback when options change and current selection is no longer available
  usePeriodCountFallback(
    quantity,
    periodCountOptions,
    setQuantityState
  );

  // Auto-reset tier to 'all' when the selected tier is no longer available
  useEffect(() => {
    if (tier !== 'all' && !availableTiers.includes(tier)) {
      setTierState('all');
    }
  }, [availableTiers, tier, setTierState]);

  // Calculate analysis data
  const analysisData = useMemo(() => {
    if (runs.length === 0) {
      return null;
    }

    const categoryDef = getCategoryDefinition(filters.category);
    return calculateSourceAnalysis(runs, categoryDef, filters);
  }, [runs, filters]);

  // Filter setters
  const setCategory = useCallback((cat: SourceCategory) => {
    setCategoryState(cat);
    setRunTypeState(getDefaultRunTypeForCategory(cat));
  }, [setCategoryState, setRunTypeState]);

  const setRunType = useCallback((rt: RunTypeFilter) => {
    setRunTypeState(rt);
  }, [setRunTypeState]);

  const setTier = useCallback((t: number | 'all') => {
    setTierState(t);
  }, [setTierState]);

  const setDuration = useCallback((d: Duration) => {
    setDurationState(d);
    setQuantityState(getDefaultPeriodCount(d));
  }, [setDurationState, setQuantityState]);

  const setQuantity = useCallback((q: PeriodCountFilter) => {
    setQuantityState(clampPeriodCount(q));
  }, [setQuantityState]);

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
    isLoading: false,
    hasData,

    // Cross-chart highlight state
    highlightedSource,
    setHighlightedSource,

    // Available options
    availableTiers,
    availableDurations,
    periodCountOptions,
    periodCountLabel,
  };
}
