import { useState, useMemo, useEffect } from 'react'
import { useData } from '@/features/data-tracking/hooks/use-data'
import { getAvailableTiersForTrends } from './calculations/tier-trends-calculations'
import { RunType, TrendsDuration, TrendsAggregation } from '@/features/data-tracking/types/game-run.types'
import { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import { TierTrendsSummary } from './table/tier-trends-summary'
import { TierTrendsFilters as TierTrendsFiltersComponent } from './filters/tier-trends-filters'
import { TierTrendsTable } from './table/tier-trends-table'
import { TierTrendsControls } from './filters/tier-trends-controls'
import { TierTrendsEmptyState } from './empty-states/tier-trends-empty-state'
import { useFieldFilter } from '../../settings/column-config/use-field-filter'
import { useTierTrendsViewState } from './use-tier-trends-view-state'
import { formatPeriodSummary, formatRunTypeFilterDisplay } from './tier-trends-display'
import type { TierTrendsFilters } from '@/features/data-tracking/types/game-run.types'

type SortField = 'fieldName' | 'change'
type SortDirection = 'asc' | 'desc'

export function TierTrendsAnalysis() {
  const { runs } = useData()

  const [runTypeFilter, setRunTypeFilter] = useState<RunTypeFilter>(RunType.FARM)
  
  const availableTiers = useMemo(() => getAvailableTiersForTrends(runs, runTypeFilter), [runs, runTypeFilter])
  
  const [filters, setFilters] = useState<TierTrendsFilters>({
    tier: 0, // 0 = All tiers
    changeThresholdPercent: 0, // 0 = All (no threshold filtering)
    duration: TrendsDuration.PER_RUN,
    quantity: 4, // Default to 4 periods for better trending visibility
    aggregationType: TrendsAggregation.AVERAGE
  })
  
  // Auto-select first available tier when run type changes
  useEffect(() => {
    if (availableTiers.length > 0 && filters.tier !== 0 && !availableTiers.includes(filters.tier)) {
      setFilters(prev => ({ ...prev, tier: availableTiers[0] }))
    }
  }, [availableTiers, filters.tier])
  
  const [sortField, setSortField] = useState<SortField>('change')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Derive view state using custom hook
  const viewState = useTierTrendsViewState(runs, filters, runTypeFilter, availableTiers)

  const sortedTrends = useMemo(() => {
    if (viewState.type !== 'ready' || !viewState.trendsData) return []

    return [...viewState.trendsData.fieldTrends].sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortField) {
        case 'fieldName':
          aValue = a.displayName.toLowerCase()
          bValue = b.displayName.toLowerCase()
          break
        case 'change':
          aValue = Math.abs(a.change.percent)
          bValue = Math.abs(b.change.percent)
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [viewState, sortField, sortDirection])

  // Field filtering with search
  const fieldFilterHook = useFieldFilter(sortedTrends, { debounceMs: 200 })
  const {
    searchTerm,
    isSearchActive,
    filteredTrends,
    hasMatches
  } = fieldFilterHook

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header - Always Visible */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-lg shadow-orange-500/30"></div>
            {filters.tier === 0 ? 'All Tiers' : `Tier ${filters.tier}`} Trends Analysis
            {viewState.type === 'ready' && viewState.trendsData && (
              <span className="text-sm font-normal text-slate-400 ml-auto">
                {formatPeriodSummary(viewState.trendsData.periodCount, filters.duration, runTypeFilter)}
              </span>
            )}
          </h3>
          <p className="text-slate-400 text-sm">
            Statistical changes across your recent {formatRunTypeFilterDisplay(runTypeFilter)} runs. Showing fields with ≥{filters.changeThresholdPercent}% change.
          </p>
        </div>

        {/* Filter Controls - Always Visible */}
        <TierTrendsControls
          runTypeFilter={runTypeFilter}
          onRunTypeChange={setRunTypeFilter}
          filters={filters}
          onFiltersChange={setFilters}
          availableTiers={availableTiers}
        />
      </div>

      {/* Conditional Results Area */}
      {viewState.type === 'no-data' && (
        <TierTrendsEmptyState variant="no-data" runType={runTypeFilter} />
      )}

      {viewState.type === 'loading' && (
        <TierTrendsEmptyState variant="loading" />
      )}

      {viewState.type === 'ready' && viewState.trendsData && (
        <div
          className="space-y-6 animate-in fade-in duration-300"
          role="region"
          aria-label="Tier trends results"
        >
          {/* Summary Stats */}
          <TierTrendsSummary trendsData={viewState.trendsData} />

          {/* Field Search */}
          <TierTrendsFiltersComponent
            fieldFilter={fieldFilterHook}
            totalCount={sortedTrends.length}
          />

          {/* Trends Table */}
          <TierTrendsTable
            trends={filteredTrends}
            comparisonColumns={viewState.trendsData.comparisonColumns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            searchTerm={searchTerm}
            isSearchActive={isSearchActive}
            hasMatches={hasMatches}
            changeThreshold={filters.changeThresholdPercent}
            aggregationType={filters.aggregationType}
          />
        </div>
      )}
    </div>
  )
}