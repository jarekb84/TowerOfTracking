/**
 * Coverage Report Filter Controls Component
 *
 * Provides controls for filtering and configuring the coverage report view. 
 */

import {
  TierSelector,
  DurationSelector,
  PeriodCountSelector,
  Duration,
  getPeriodCountOptions,
  getPeriodCountLabel,
} from '@/shared/domain/filters'
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { CoverageReportFilters, CoverageFieldName } from '../types'
import { MetricToggleSelector } from './metric-toggle-selector'

interface CoverageReportFiltersProps {
  filters: CoverageReportFilters
  availableTiers: number[]
  availableDurations: Duration[]
  onToggleMetric: (fieldName: CoverageFieldName) => void
  onRunTypeChange: (runType: RunTypeFilter) => void
  onTierChange: (tier: number | 'all') => void
  onDurationChange: (duration: Duration) => void
  onPeriodCountChange: (count: number) => void
}

export function CoverageReportFiltersComponent({
  filters,
  availableTiers,
  availableDurations,
  onToggleMetric,
  onRunTypeChange,
  onTierChange,
  onDurationChange,
  onPeriodCountChange,
}: CoverageReportFiltersProps) {
  const periodOptions = getPeriodCountOptions(filters.duration)
  const periodLabel = getPeriodCountLabel(filters.duration)

  return (
    <div className="space-y-4">
      {/* Row 1: Metric Toggles */}
      <MetricToggleSelector
        selectedMetrics={filters.selectedMetrics}
        onToggleMetric={onToggleMetric}
      />

      {/* Row 2: Run Type + Tier */}
      <div className="flex flex-wrap gap-4 items-center">
        <RunTypeSelector
          selectedType={filters.runType}
          onTypeChange={onRunTypeChange}
          accentColor="cyan"
        />

        <TierSelector
          selectedTier={filters.tier}
          onTierChange={onTierChange}
          availableTiers={availableTiers}
          accentColor="cyan"
        />
      </div>

      {/* Row 3: Duration + Period Count */}
      <div className="flex flex-wrap gap-4 items-center">
        <DurationSelector
          selectedDuration={filters.duration}
          onDurationChange={onDurationChange}
          availableDurations={availableDurations}
          accentColor="cyan"
        />

        <PeriodCountSelector
          selectedCount={filters.periodCount}
          onCountChange={(count) => {
            if (typeof count === 'number') {
              onPeriodCountChange(count)
            }
          }}
          countOptions={periodOptions}
          label={periodLabel}
          showAllOption={false}
          accentColor="cyan"
        />
      </div>
    </div>
  )
}
