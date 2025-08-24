import { useState, useMemo, useEffect } from 'react'
import { Button } from '../../../components/ui'
import { useData } from '../hooks/use-data'
import { 
  calculateTierTrends, 
  getAvailableTiersForTrends, 
  formatFieldDisplayName,
  generateSparklinePath 
} from '../utils/tier-trends'
import { formatNumber } from '../utils/data-parser'
import { RunTypeFilter } from '../utils/run-type-filter'
import { RunTypeSelector } from './run-type-selector'
import type { TierTrendsFilters, FieldTrendData, ComparisonColumn } from '../types/game-run.types'

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
    if (availableTiers.length > 0 && !availableTiers.includes(filters.tier)) {
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
            Tier {filters.tier} Trends Analysis
            <span className="text-sm font-normal text-slate-400 ml-auto">
              Last {trendsData.periodCount} {filters.duration === 'per-run' ? 'Runs' : filters.duration === 'daily' ? 'Days' : filters.duration === 'weekly' ? 'Weeks' : 'Months'} - {runTypeFilter === 'farming' ? 'Farming' : runTypeFilter === 'tournament' ? 'Tournament' : ''} Mode
            </span>
          </h3>
          <p className="text-slate-400 text-sm">
            Statistical changes across your recent {runTypeFilter === 'farming' ? 'farming' : runTypeFilter === 'tournament' ? 'tournament' : ''} runs. Showing fields with ≥{filters.changeThresholdPercent}% change.
          </p>
        </div>
        
        {/* Filter Controls */}
        <div className="space-y-4">
          {/* Row 1: Run Type & Tier */}
          <div className="flex flex-wrap gap-4 items-center">
            <RunTypeSelector 
              selectedType={runTypeFilter}
              onTypeChange={setRunTypeFilter}
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Tier:</label>
              <div className="flex gap-1 flex-wrap">
                {availableTiers.map(tier => (
                  <Button
                    key={tier}
                    variant={filters.tier === tier ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, tier }))}
                    className={`border transition-all ${
                      filters.tier === tier
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-100' 
                        : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {tier}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Duration, Quantity, Aggregation */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Duration Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Duration:</label>
              <div className="flex gap-1">
                {[
                  { value: 'per-run', label: 'Per Run' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' }
                ].map(option => (
                  <Button
                    key={option.value}
                    variant={filters.duration === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, duration: option.value as TierTrendsFilters['duration'] }))}
                    className={`border transition-all ${
                      filters.duration === option.value
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-100' 
                        : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">
                Last {filters.duration === 'per-run' ? 'runs' : filters.duration === 'daily' ? 'days' : filters.duration === 'weekly' ? 'weeks' : 'months'}:
              </label>
              <div className="flex gap-1">
                {[2, 3, 4, 5, 6, 7].map(count => (
                  <Button
                    key={count}
                    variant={filters.quantity === count ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, quantity: count }))}
                    className={`border transition-all ${
                      filters.quantity === count
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-100' 
                        : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>

            {/* Aggregation Selector - Only show when not per-run */}
            {filters.duration !== 'per-run' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Aggregation:</label>
                <div className="flex gap-1">
                  {[
                    { value: 'sum', label: 'Sum' },
                    { value: 'average', label: 'Avg' },
                    { value: 'min', label: 'Min' },
                    { value: 'max', label: 'Max' }
                  ].map(option => (
                    <Button
                      key={option.value}
                      variant={filters.aggregationType === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, aggregationType: option.value as NonNullable<TierTrendsFilters['aggregationType']> }))}
                      className={`border transition-all ${
                        filters.aggregationType === option.value
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-100' 
                          : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Change Threshold */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Change Threshold:</label>
              <div className="flex gap-1">
                <Button
                  variant={filters.changeThresholdPercent === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, changeThresholdPercent: 0 }))}
                  className={`border transition-all ${
                    filters.changeThresholdPercent === 0
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-100' 
                      : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  All
                </Button>
                {[1, 5, 10, 25].map(threshold => (
                  <Button
                    key={threshold}
                    variant={filters.changeThresholdPercent === threshold ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, changeThresholdPercent: threshold }))}
                    className={`border transition-all ${
                      filters.changeThresholdPercent === threshold
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-100' 
                        : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {threshold}%
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-sm text-slate-400 mb-1">Fields Changed</div>
          <div className="text-2xl font-bold text-slate-100">{trendsData.summary.fieldsChanged}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-800/20 to-emerald-700/10 border border-emerald-600/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-sm text-emerald-400 mb-1">Top Gainers</div>
          <div className="text-2xl font-bold text-emerald-300">{trendsData.summary.topGainers.length}</div>
        </div>
        <div className="bg-gradient-to-br from-red-800/20 to-red-700/10 border border-red-600/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-sm text-red-400 mb-1">Top Decliners</div>
          <div className="text-2xl font-bold text-red-300">{trendsData.summary.topDecliners.length}</div>
        </div>
      </div>

      {/* Trends Table */}
      <div className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-gradient-to-r from-slate-700/20 via-slate-600/10 to-slate-700/20">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                  <button 
                    onClick={() => handleSort('fieldName')}
                    className="flex items-center gap-1 hover:text-slate-100 transition-colors"
                  >
                    Field Name
                    {sortField === 'fieldName' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-200">
                  Trend
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">
                  <button 
                    onClick={() => handleSort('change')}
                    className="flex items-center gap-1 hover:text-slate-100 transition-colors ml-auto"
                  >
                    Change %
                    {sortField === 'change' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">
                  Value Change
                </th>
                {trendsData.comparisonColumns.map((column, index) => (
                  <th key={index} className="px-3 py-4 text-center text-sm font-semibold text-slate-200 min-w-[80px]">
                    <div className="flex flex-col">
                      <div className="whitespace-nowrap">{column.header}</div>
                      {column.subHeader && (
                        <div className="text-xs text-slate-400 font-normal">{column.subHeader}</div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTrends.map((trend, index) => (
                <TrendRow 
                  key={trend.fieldName} 
                  trend={trend} 
                  index={index}
                  comparisonColumns={trendsData.comparisonColumns}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {sortedTrends.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          {filters.changeThresholdPercent === 0 
            ? "No data available for the selected filters."
            : `No changes found above ${filters.changeThresholdPercent}% threshold. Try lowering the change threshold.`
          }
        </div>
      )}
    </div>
  )
}

interface TrendRowProps {
  trend: FieldTrendData
  index: number
  comparisonColumns: ComparisonColumn[]
}

function TrendRow({ trend, index, comparisonColumns }: TrendRowProps) {
  const isEven = index % 2 === 0
  const rowBg = isEven 
    ? 'bg-gradient-to-r from-slate-800/20 via-slate-700/10 to-slate-800/20' 
    : 'bg-gradient-to-r from-slate-700/20 via-slate-600/10 to-slate-700/20'
  
  const sparklinePath = generateSparklinePath(trend.values, 60, 20)
  
  // Color coding based on change direction
  const getChangeColor = (change: FieldTrendData['change']) => {
    if (change.direction === 'up') return 'text-emerald-300'
    if (change.direction === 'down') return 'text-red-300'
    return 'text-slate-300'
  }
  

  return (
    <tr className={`border-b border-slate-700/30 transition-all duration-200 hover:bg-gradient-to-r hover:from-orange-500/10 hover:via-orange-500/5 hover:to-orange-500/10 ${rowBg}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-sm"></div>
          <span className="font-medium text-slate-100">{formatFieldDisplayName(trend.fieldName, trend.displayName)}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex justify-center">
          {sparklinePath && (
            <svg width="60" height="20" className="opacity-70">
              <path
                d={sparklinePath}
                stroke={trend.change.direction === 'up' ? '#10b981' : trend.change.direction === 'down' ? '#ef4444' : '#64748b'}
                strokeWidth="2"
                fill="none"
              />
            </svg>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center gap-1 justify-end">
          <span className={`font-mono text-lg ${getChangeColor(trend.change)}`}>
            {trend.change.percent > 0 ? '+' : ''}{trend.change.percent.toFixed(1)}%
          </span>
          <span className="text-lg">
            {trend.change.direction === 'up' ? '↗' : trend.change.direction === 'down' ? '↘' : '→'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`font-mono ${getChangeColor(trend.change)}`}>
          {trend.change.absolute > 0 ? '+' : ''}{formatNumber(trend.change.absolute)}
        </span>
      </td>
      {comparisonColumns.map((column, index) => (
        <td key={index} className="px-3 py-4 text-center">
          <span className="font-mono text-sm text-slate-200">
            {formatNumber(column.values[trend.fieldName] || 0)}
          </span>
        </td>
      ))}
    </tr>
  )
}