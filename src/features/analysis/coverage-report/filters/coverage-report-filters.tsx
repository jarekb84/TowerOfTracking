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
} from '@/shared/domain/filters'
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { CoverageReportFilters, CoverageFieldName } from '../types'
import { MetricToggleSelector } from './metric-toggle-selector'

interface CoverageReportFiltersProps {
  filters: CoverageReportFilters
  availableTiers: number[]
  availableDurations: Duration[]
  periodCountOptions: number[]
  periodCountLabel: string
  onToggleMetric: (fieldName: CoverageFieldName) => void
  onRunTypeChange: (runType: RunTypeFilter) => void
  onTierChange: (tier: number | 'all') => void
  onDurationChange: (duration: Duration) => void
  onPeriodCountChange: (count: number | 'all') => void
}

export function CoverageReportFiltersComponent({
  filters,
  availableTiers,
  availableDurations,
  periodCountOptions,
  periodCountLabel,
  onToggleMetric,
  onRunTypeChange,
  onTierChange,
  onDurationChange,
  onPeriodCountChange,
}: CoverageReportFiltersProps) {

  return (
    <div className="space-y-4">
      {/* Row 1: Metric Toggles */}
      <MetricToggleSelector
        selectedMetrics={filters.selectedMetrics}
        onToggleMetric={onToggleMetric}
      />

      {/* Row 2: Run Type + Tier */}
      <div className="flex flex-wrap gap-4 items-end">
        <RunTypeSelector
          selectedType={filters.runType}
          onTypeChange={onRunTypeChange}
          accentColor="cyan"
          layout="vertical"
        />

        <TierSelector
          selectedTier={filters.tier}
          onTierChange={onTierChange}
          availableTiers={availableTiers}
          accentColor="cyan"
          layout="vertical"
        />
      </div>

      {/* Row 3: Duration + Period Count */}
      <div className="flex flex-wrap gap-4 items-end">
        <DurationSelector
          selectedDuration={filters.duration}
          onDurationChange={onDurationChange}
          availableDurations={availableDurations}
          accentColor="cyan"
          layout="vertical"
        />

        <PeriodCountSelector
          selectedCount={filters.periodCount}
          onCountChange={onPeriodCountChange}
          countOptions={periodCountOptions}
          label={periodCountLabel}
          accentColor="cyan"
          layout="vertical"
        />
      </div>
    </div>
  )
}
