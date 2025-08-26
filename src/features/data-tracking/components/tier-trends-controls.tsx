import { Button } from '../../../components/ui'
import { RunTypeSelector } from './run-type-selector'
import type { RunTypeFilter } from '../utils/run-type-filter'
import type { TierTrendsFilters } from '../types/game-run.types'

interface TierTrendsControlsProps {
  runTypeFilter: RunTypeFilter
  onRunTypeChange: (type: RunTypeFilter) => void
  filters: TierTrendsFilters
  onFiltersChange: (filters: TierTrendsFilters) => void
  availableTiers: number[]
}

export function TierTrendsControls({
  runTypeFilter,
  onRunTypeChange,
  filters,
  onFiltersChange,
  availableTiers
}: TierTrendsControlsProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Run Type & Tier */}
      <div className="flex flex-wrap gap-4 items-center">
        <RunTypeSelector 
          selectedType={runTypeFilter}
          onTypeChange={onRunTypeChange}
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Tier:</label>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={filters.tier === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, tier: 0 })}
              className={`border transition-all ${
                filters.tier === 0
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-100' 
                  : 'border-slate-600 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All
            </Button>
            {availableTiers.map(tier => (
              <Button
                key={tier}
                variant={filters.tier === tier ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, tier })}
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
                onClick={() => onFiltersChange({ ...filters, duration: option.value as TierTrendsFilters['duration'] })}
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
                onClick={() => onFiltersChange({ ...filters, quantity: count })}
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
                  onClick={() => onFiltersChange({ ...filters, aggregationType: option.value as NonNullable<TierTrendsFilters['aggregationType']> })}
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
              onClick={() => onFiltersChange({ ...filters, changeThresholdPercent: 0 })}
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
                onClick={() => onFiltersChange({ ...filters, changeThresholdPercent: threshold })}
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
  )
}