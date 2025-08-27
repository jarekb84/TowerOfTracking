import { FormControl, SelectionButtonGroup } from '../../../components/ui'
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
        <FormControl label="Tier">
          <SelectionButtonGroup<number>
            options={[
              { value: 0, label: 'All' },
              ...availableTiers.map(tier => ({ value: tier, label: tier.toString() }))
            ]}
            selectedValue={filters.tier}
            onSelectionChange={(tier) => onFiltersChange({ ...filters, tier })}
            size="sm"
            fullWidthOnMobile={false}
          />
        </FormControl>
      </div>

      {/* Row 2: Duration, Quantity, Aggregation */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Duration Selector */}
        <FormControl label="Duration">
          <SelectionButtonGroup<TierTrendsFilters['duration']>
            options={[
              { value: 'per-run', label: 'Per Run' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' }
            ]}
            selectedValue={filters.duration}
            onSelectionChange={(duration) => onFiltersChange({ ...filters, duration })}
            size="sm"
            fullWidthOnMobile={false}
          />
        </FormControl>

        {/* Quantity Selector */}
        <FormControl 
          label={`Last ${filters.duration === 'per-run' ? 'runs' : filters.duration === 'daily' ? 'days' : filters.duration === 'weekly' ? 'weeks' : 'months'}`}
        >
          <SelectionButtonGroup<number>
            options={[2, 3, 4, 5, 6, 7].map(count => ({ value: count, label: count.toString() }))}
            selectedValue={filters.quantity}
            onSelectionChange={(quantity) => onFiltersChange({ ...filters, quantity })}
            size="sm"
            fullWidthOnMobile={false}
          />
        </FormControl>

        {/* Aggregation Selector - Only show when not per-run */}
        {filters.duration !== 'per-run' && (
          <FormControl label="Aggregation">
            <SelectionButtonGroup<NonNullable<TierTrendsFilters['aggregationType']>>
              options={[
                { value: 'sum', label: 'Sum' },
                { value: 'average', label: 'Avg' },
                { value: 'min', label: 'Min' },
                { value: 'max', label: 'Max' }
              ]}
              selectedValue={filters.aggregationType || 'sum'}
              onSelectionChange={(aggregationType) => onFiltersChange({ ...filters, aggregationType })}
              size="sm"
              fullWidthOnMobile={false}
            />
          </FormControl>
        )}
      </div>

      {/* Row 3: Change Threshold */}
      <div className="flex flex-wrap gap-4 items-center">
        <FormControl label="Change Threshold">
          <SelectionButtonGroup<number>
            options={[
              { value: 0, label: 'All' },
              ...([1, 5, 10, 25].map(threshold => ({ value: threshold, label: `${threshold}%` })))
            ]}
            selectedValue={filters.changeThresholdPercent}
            onSelectionChange={(changeThresholdPercent) => onFiltersChange({ ...filters, changeThresholdPercent })}
            size="sm"
            fullWidthOnMobile={false}
          />
        </FormControl>
      </div>
    </div>
  )
}