import { FormControl, SelectionButtonGroup } from '@/components/ui'
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector'
import {
  TierSelector,
  DurationSelector,
  PeriodCountSelector,
  zeroToAllTierAdapter,
  allToZeroTierAdapter
} from '@/shared/domain/filters'
import { usePeriodCountOptions } from '@/shared/domain/filters/period-count/use-period-count-options'
import { adjustPeriodCountForDuration, asNumericPeriodCount } from '@/shared/domain/filters/period-count/period-count-logic'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { TierTrendsFilters } from '../types'
import { Duration, TrendsAggregation } from '../types'
import { getDefaultAggregationType } from '../calculations/tier-trends-calculations'
import { getAggregationOptions } from './aggregation-options'
import { TIER_TRENDS_PERIOD_COUNTS } from './tier-trends-period-counts'

interface TierTrendsControlsProps {
  runTypeFilter: RunTypeFilter
  onRunTypeChange: (type: RunTypeFilter) => void
  filters: TierTrendsFilters
  onFiltersChange: (filters: TierTrendsFilters) => void
  availableTiers: number[]
  availableDurations: Duration[]
  tierCounts?: Map<number, number>
}

export function TierTrendsControls({
  runTypeFilter,
  onRunTypeChange,
  filters,
  onFiltersChange,
  availableTiers,
  availableDurations,
  tierCounts
}: TierTrendsControlsProps) {
  const { options: periodCountOptions, label: periodCountLabel } =
    usePeriodCountOptions(filters.duration, TIER_TRENDS_PERIOD_COUNTS)

  return (
    <div className="space-y-4">
      {/* Row 1: Run Type & Tier */}
      <div className="flex flex-wrap gap-4 items-end">
        <RunTypeSelector
          selectedType={runTypeFilter}
          onTypeChange={onRunTypeChange}
          layout="vertical"
        />
        <TierSelector
          selectedTier={zeroToAllTierAdapter(filters.tier)}
          onTierChange={(tier) => onFiltersChange({ ...filters, tier: allToZeroTierAdapter(tier) })}
          availableTiers={availableTiers}
          tierCounts={tierCounts}
          showCounts={Boolean(tierCounts)}
          layout="vertical"
        />
      </div>

      {/* Row 2: Duration, Quantity, Aggregation */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Duration Selector */}
        <DurationSelector
          selectedDuration={filters.duration}
          onDurationChange={(duration) => {
            const shouldDefaultToSum = filters.duration === Duration.PER_RUN && duration !== Duration.PER_RUN
            onFiltersChange({
              ...filters,
              duration,
              quantity: asNumericPeriodCount(adjustPeriodCountForDuration(filters.quantity, duration, TIER_TRENDS_PERIOD_COUNTS), duration, TIER_TRENDS_PERIOD_COUNTS),
              aggregationType: shouldDefaultToSum ? TrendsAggregation.SUM : filters.aggregationType
            })
          }}
          availableDurations={availableDurations}
          layout="vertical"
        />

        {/* Quantity Selector */}
        <PeriodCountSelector
          selectedCount={filters.quantity}
          onCountChange={(quantity) => onFiltersChange({ ...filters, quantity: asNumericPeriodCount(quantity, filters.duration, TIER_TRENDS_PERIOD_COUNTS) })}
          countOptions={periodCountOptions}
          label={periodCountLabel}
          showAllOption={false}
          layout="vertical"
        />

        {/* Aggregation Selector */}
        <FormControl label="Aggregation" layout="vertical">
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
