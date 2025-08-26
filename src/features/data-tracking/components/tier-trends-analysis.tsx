import { useState, useMemo, useEffect } from 'react'
import { useData } from '../hooks/use-data'
import { 
  calculateTierTrends, 
  getAvailableTiersForTrends
} from '../utils/tier-trends'
import { RunTypeFilter } from '../utils/run-type-filter'
import { TierTrendsSummary } from './tier-trends-summary'
import { TierTrendsFilters as TierTrendsFiltersComponent } from './tier-trends-filters'
import { TierTrendsTable } from './tier-trends-table'
import { TierTrendsControls } from './tier-trends-controls'
import { useFieldFilter } from '../hooks/use-field-filter'
import type { TierTrendsFilters } from '../types/game-run.types'

type SortField = 'fieldName' | 'change'
type SortDirection = 'asc' | 'desc'

export function TierTrendsAnalysis() {
  const { runs } = useData()
  
  const [runTypeFilter, setRunTypeFilter] = useState<RunTypeFilter>('farming')
  
  const availableTiers = useMemo(() => getAvailableTiersForTrends(runs, runTypeFilter), [runs, runTypeFilter])
  
  const [filters, setFilters] = useState<TierTrendsFilters>({
    tier: 1, // Will be updated by useEffect
    changeThresholdPercent: 5,
    duration: 'per-run',
    quantity: 3,
    aggregationType: 'average'
  })
  
  // Auto-select first available tier when run type changes
  useEffect(() => {
    if (availableTiers.length > 0 && filters.tier !== 0 && !availableTiers.includes(filters.tier)) {
      setFilters(prev => ({ ...prev, tier: availableTiers[0] }))
    }
  }, [availableTiers, filters.tier])
  
  const [sortField, setSortField] = useState<SortField>('change')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  const trendsData = useMemo(() => {
    if (availableTiers.length === 0) return null
    return calculateTierTrends(runs, filters, runTypeFilter)
  }, [runs, filters, runTypeFilter, availableTiers])
  
  const sortedTrends = useMemo(() => {
    if (!trendsData) return []
    
    return [...trendsData.fieldTrends].sort((a, b) => {
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
  }, [trendsData, sortField, sortDirection])

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
  
  if (availableTiers.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No tier data available for trends analysis.</p>
          <p className="text-sm mt-2">
            You need at least 2 {runTypeFilter === 'farming' ? 'farming' : runTypeFilter === 'tournament' ? 'tournament' : ''} runs in the same tier to see trends.
          </p>
        </div>
      </div>
    )
  }
  
  if (!trendsData) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        Loading trends analysis...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-lg shadow-orange-500/30"></div>
{filters.tier === 0 ? 'All Tiers' : `Tier ${filters.tier}`} Trends Analysis
            <span className="text-sm font-normal text-slate-400 ml-auto">
              Last {trendsData.periodCount} {filters.duration === 'per-run' ? 'Runs' : filters.duration === 'daily' ? 'Days' : filters.duration === 'weekly' ? 'Weeks' : 'Months'} - {runTypeFilter === 'farming' ? 'Farming' : runTypeFilter === 'tournament' ? 'Tournament' : ''} Mode
            </span>
          </h3>
          <p className="text-slate-400 text-sm">
            Statistical changes across your recent {runTypeFilter === 'farming' ? 'farming' : runTypeFilter === 'tournament' ? 'tournament' : ''} runs. Showing fields with ≥{filters.changeThresholdPercent}% change.
          </p>
        </div>
        
        {/* Filter Controls */}
        <TierTrendsControls 
          runTypeFilter={runTypeFilter}
          onRunTypeChange={setRunTypeFilter}
          filters={filters}
          onFiltersChange={setFilters}
          availableTiers={availableTiers}
        />
      </div>

      {/* Summary Stats */}
      <TierTrendsSummary trendsData={trendsData} />

      {/* Field Search */}
      <TierTrendsFiltersComponent 
        fieldFilter={fieldFilterHook}
        totalCount={sortedTrends.length}
      />

      {/* Trends Table */}
      <TierTrendsTable 
        trends={filteredTrends}
        comparisonColumns={trendsData.comparisonColumns}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchTerm={searchTerm}
        isSearchActive={isSearchActive}
        hasMatches={hasMatches}
        changeThreshold={filters.changeThresholdPercent}
      />
    </div>
  )
}