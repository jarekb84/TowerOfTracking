import { FormControl, SelectionButtonGroup } from '@/components/ui'
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { TierTrendsFilters } from '../types'
import { TrendsDuration, TrendsAggregation } from '../types'
import { getDefaultAggregationType, getQuantityLabel } from '../calculations/tier-trends-calculations'
import { getAggregationOptions } from './aggregation-options'

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
          <SelectionButtonGroup<TrendsDuration>
            options={[
              { value: TrendsDuration.PER_RUN, label: 'Per Run' },
              { value: TrendsDuration.DAILY, label: 'Daily' },
              { value: TrendsDuration.WEEKLY, label: 'Weekly' },
              { value: TrendsDuration.MONTHLY, label: 'Monthly' }
            ]}
            selectedValue={filters.duration}
            onSelectionChange={(duration) => {
              // When switching from per-run to aggregated duration, default to sum
              const shouldDefaultToSum = filters.duration === TrendsDuration.PER_RUN && duration !== TrendsDuration.PER_RUN
              onFiltersChange({
                ...filters,
                duration,
                aggregationType: shouldDefaultToSum ? TrendsAggregation.SUM : filters.aggregationType
              })
            }}
            size="sm"
            fullWidthOnMobile={false}
          />
        </FormControl>

        {/* Quantity Selector */}
        <FormControl label={`Last ${getQuantityLabel(filters.duration)}`}>
          <SelectionButtonGroup<number>
            options={[2, 3, 4, 5, 6, 7].map(count => ({ value: count, label: count.toString() }))}
            selectedValue={filters.quantity}
            onSelectionChange={(quantity) => onFiltersChange({ ...filters, quantity })}
            size="sm"
            fullWidthOnMobile={false}
          />
        </FormControl>

        {/* Aggregation Selector */}
        <FormControl label="Aggregation">
          <SelectionButtonGroup<TrendsAggregation>
            options={getAggregationOptions(filters.duration)}
            selectedValue={filters.aggregationType || getDefaultAggregationType(filters.duration)}
            onSelectionChange={(aggregationType) => onFiltersChange({ ...filters, aggregationType })}
            size="sm"
            fullWidthOnMobile={false}
          />
        </FormControl>
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