import { FormControl, SelectionButtonGroup } from '@/components/ui'
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector'
import {
  TierSelector,
  zeroToAllTierAdapter,
  allToZeroTierAdapter
} from '@/shared/domain/filters'
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
  tierCounts?: Map<number, number>
}

export function TierTrendsControls({
  runTypeFilter,
  onRunTypeChange,
  filters,
  onFiltersChange,
  availableTiers,
  tierCounts
}: TierTrendsControlsProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Run Type & Tier */}
      <div className="flex flex-wrap gap-4 items-center">
        <RunTypeSelector
          selectedType={runTypeFilter}
          onTypeChange={onRunTypeChange}
        />
        <TierSelector
          selectedTier={zeroToAllTierAdapter(filters.tier)}
          onTierChange={(tier) => onFiltersChange({ ...filters, tier: allToZeroTierAdapter(tier) })}
          availableTiers={availableTiers}
          tierCounts={tierCounts}
          showCounts={Boolean(tierCounts)}
        />
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
            ariaLabel="Select duration"
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
            ariaLabel={`Select last ${getQuantityLabel(filters.duration).toLowerCase()}`}
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
            ariaLabel="Select aggregation method"
          />
        </FormControl>
      </div>
    </div>
  )
}
