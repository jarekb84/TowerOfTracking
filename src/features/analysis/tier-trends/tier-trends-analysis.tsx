import { useMemo, useEffect, useCallback } from 'react'
import { useData } from '@/shared/domain/use-data'
import { getAvailableTiersForTrends } from './calculations/tier-trends-calculations'
import { sortFieldTrends, getNextSortState, type SortField, type SortDirection } from './calculations/sort-field-trends'
import { RunType } from '@/shared/domain/run-types/types'
import { Duration, TrendsAggregation } from './types'
import { useAvailableDurations } from '@/shared/domain/filters'
import { usePeriodCountOptions } from '@/shared/domain/filters/period-count/use-period-count-options'
import { usePeriodCountFallback } from '@/shared/domain/filters/period-count/use-period-count-fallback'
import { TIER_TRENDS_PERIOD_COUNTS } from './filters/tier-trends-period-counts'
import { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import { TierTrendsFilters as TierTrendsFiltersComponent } from './filters/tier-trends-filters'
import { TierTrendsTable } from './table/tier-trends-table'
import { TierTrendsControls } from './filters/tier-trends-controls'
import { TierTrendsEmptyState } from './empty-states/tier-trends-empty-state'
import { useFieldFilter } from '@/features/settings/column-config/use-field-filter'
import { useTierTrendsViewState } from './use-tier-trends-view-state'
import type { TierTrendsFilters } from './types'
import { usePersistedPageState } from '@/shared/persistence'

const PAGE_SCOPE = 'charts/tier-trends'

export function TierTrendsAnalysis() {
  const { runs } = useData()

  const [runTypeFilter, setRunTypeFilter] = usePersistedPageState<RunTypeFilter>(
    PAGE_SCOPE, 'runType', RunType.FARM
  )

  const availableTiers = useMemo(() => getAvailableTiersForTrends(runs, runTypeFilter), [runs, runTypeFilter])

  const availableDurations = useAvailableDurations(runs).durations.filter(d => d !== Duration.HOURLY)

  const [tier, setTier] = usePersistedPageState<number>(PAGE_SCOPE, 'tier', 0)
  const [duration, setDuration] = usePersistedPageState<Duration>(PAGE_SCOPE, 'duration', Duration.PER_RUN)
  const [quantity, setQuantity] = usePersistedPageState<number>(PAGE_SCOPE, 'quantity', 4)
  const [aggregationType, setAggregationType] = usePersistedPageState<TrendsAggregation>(
    PAGE_SCOPE, 'aggregationType', TrendsAggregation.AVERAGE
  )

  const filters = useMemo<TierTrendsFilters>(() => ({
    tier, duration, quantity, aggregationType,
  }), [tier, duration, quantity, aggregationType])

  const setFilters = useCallback((newFilters: TierTrendsFilters) => {
    setTier(newFilters.tier)
    setDuration(newFilters.duration)
    setQuantity(newFilters.quantity)
    setAggregationType(newFilters.aggregationType ?? TrendsAggregation.AVERAGE)
  }, [setTier, setDuration, setQuantity, setAggregationType])

  // Data-aware period count options
  const { options: periodCountOptions, label: periodCountLabel } =
    usePeriodCountOptions(filters.duration, TIER_TRENDS_PERIOD_COUNTS, runs)

  // Auto-fallback when options change and current selection is no longer available
  usePeriodCountFallback(
    filters.quantity,
    periodCountOptions,
    (count) => { if (typeof count === 'number') setQuantity(count) },
    'last-available'
  )

  // Auto-select first available tier when run type changes
  useEffect(() => {
    if (availableTiers.length > 0 && filters.tier !== 0 && !availableTiers.includes(filters.tier)) {
      setTier(availableTiers[0])
    }
  }, [availableTiers, filters.tier, setTier])

  const [sortField, setSortField] = usePersistedPageState<SortField>(PAGE_SCOPE, 'sortField', 'change')
  const [sortDirection, setSortDirection] = usePersistedPageState<SortDirection>(PAGE_SCOPE, 'sortDirection', 'desc')

  // Derive view state using custom hook
  const viewState = useTierTrendsViewState(runs, filters, runTypeFilter, availableTiers)

  const sortedTrends = useMemo(() => {
    if (viewState.type !== 'ready' || !viewState.trendsData) return []
    return sortFieldTrends(viewState.trendsData.fieldTrends, sortField, sortDirection)
  }, [viewState, sortField, sortDirection])

  // Field filtering with search
  const fieldFilterHook = useFieldFilter(sortedTrends, { debounceMs: 200 })

  const handleSort = useCallback((field: SortField) => {
    const next = getNextSortState(field, sortField, sortDirection)
    setSortField(next.sortField)
    setSortDirection(next.sortDirection)
  }, [sortField, sortDirection, setSortField, setSortDirection])

  return (
    <div className="space-y-4">
      {/* Filter Controls - Always Visible */}
      <TierTrendsControls
        runTypeFilter={runTypeFilter}
        onRunTypeChange={setRunTypeFilter}
        filters={filters}
        onFiltersChange={setFilters}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        periodCountOptions={periodCountOptions}
        periodCountLabel={periodCountLabel}
      />

      {/* Conditional Results Area */}
      {viewState.type === 'no-data' && (
        <TierTrendsEmptyState variant="no-data" runType={runTypeFilter} />
      )}

      {viewState.type === 'loading' && (
        <TierTrendsEmptyState variant="loading" />
      )}

      {viewState.type === 'ready' && viewState.trendsData && (
        <div
          className="space-y-4 animate-in fade-in duration-300"
          role="region"
          aria-label="Tier trends results"
        >
          {/* Field Search */}
          <TierTrendsFiltersComponent
            fieldFilter={fieldFilterHook}
            totalCount={sortedTrends.length}
          />

          {/* Trends Table */}
          <TierTrendsTable
            trends={fieldFilterHook.filteredTrends}
            comparisonColumns={viewState.trendsData.comparisonColumns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            searchTerm={fieldFilterHook.searchTerm}
            isSearchActive={fieldFilterHook.isSearchActive}
            hasMatches={fieldFilterHook.hasMatches}
            aggregationType={filters.aggregationType}
          />
        </div>
      )}
    </div>
  )
}
