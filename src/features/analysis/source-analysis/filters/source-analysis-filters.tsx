/**
 * Source Analysis Filter Controls Component
 *
 * Provides controls for filtering and configuring the source analysis view.
 * Uses purple accent theme to differentiate from other analysis pages.
 */

import { FormControl, SelectionButtonGroup } from '@/components/ui'
import {
  TierSelector,
  DurationSelector,
  PeriodCountSelector,
  Duration,
  getPeriodCountOptions,
  getPeriodCountLabel,
  stringToDuration,
  durationToString
} from '@/shared/domain/filters'
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type {
  SourceAnalysisFilters,
  SourceCategory,
  SourceDuration,
} from '../types'
import { getAvailableCategories } from '../category-config'

interface SourceAnalysisFiltersProps {
  filters: SourceAnalysisFilters
  availableTiers: number[]
  availableDurations: Duration[]
  onCategoryChange: (category: SourceCategory) => void
  onRunTypeChange: (runType: RunTypeFilter) => void
  onTierChange: (tier: number | 'all') => void
  onDurationChange: (duration: SourceDuration) => void
  onQuantityChange: (quantity: number) => void
}

export function SourceAnalysisFiltersComponent({
  filters,
  availableTiers,
  availableDurations,
  onCategoryChange,
  onRunTypeChange,
  onTierChange,
  onDurationChange,
  onQuantityChange,
}: SourceAnalysisFiltersProps) {
  const categories = getAvailableCategories()
  // Convert SourceDuration (legacy enum) to unified Duration using safe adapter
  const unifiedDuration = stringToDuration(filters.duration)
  const periodOptions = getPeriodCountOptions(unifiedDuration)
  const periodLabel = getPeriodCountLabel(unifiedDuration)

  return (
    <div className="space-y-4">
      {/* Row 1: Category + Run Type */}
      <div className="flex flex-wrap gap-4 items-center">
        <FormControl label="Category" layout="horizontal">
          <SelectionButtonGroup<SourceCategory>
            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
            selectedValue={filters.category}
            onSelectionChange={onCategoryChange}
            size="sm"
            fullWidthOnMobile={false}
            accentColor="purple"
          />
        </FormControl>

        <RunTypeSelector
          selectedType={filters.runType}
          onTypeChange={onRunTypeChange}
          accentColor="purple"
        />
      </div>

      {/* Row 2: Tier (can grow with many options) */}
      <div className="flex flex-wrap gap-4 items-center">
        <TierSelector
          selectedTier={filters.tier}
          onTierChange={onTierChange}
          availableTiers={availableTiers}
          accentColor="purple"
        />
      </div>

      {/* Row 3: Duration + Period Count */}
      <div className="flex flex-wrap gap-4 items-center">
        <DurationSelector
          selectedDuration={unifiedDuration}
          onDurationChange={(duration) => onDurationChange(durationToString(duration) as SourceDuration)}
          availableDurations={availableDurations}
          accentColor="purple"
        />

        <PeriodCountSelector
          selectedCount={filters.quantity}
          onCountChange={(count) => {
            // Since showAllOption={false}, we only receive numbers
            if (typeof count === 'number') {
              onQuantityChange(count)
            }
          }}
          countOptions={periodOptions}
          label={periodLabel}
          showAllOption={false}
          accentColor="purple"
        />
      </div>
    </div>
  )
}
