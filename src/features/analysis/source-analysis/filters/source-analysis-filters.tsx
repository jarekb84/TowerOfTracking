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
} from '@/shared/domain/filters'
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { PeriodCountFilter } from '@/shared/domain/filters/types'
import type {
  SourceAnalysisFilters,
  SourceCategory,
} from '../types'
import { getAvailableCategories } from '../category-config'

interface SourceAnalysisFiltersProps {
  filters: SourceAnalysisFilters
  availableTiers: number[]
  availableDurations: Duration[]
  onCategoryChange: (category: SourceCategory) => void
  onRunTypeChange: (runType: RunTypeFilter) => void
  onTierChange: (tier: number | 'all') => void
  onDurationChange: (duration: Duration) => void
  onQuantityChange: (quantity: PeriodCountFilter) => void
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
  const periodOptions = getPeriodCountOptions(filters.duration)
  const periodLabel = getPeriodCountLabel(filters.duration)

  return (
    <div className="space-y-4">
      {/* Row 1: Category */}
      <div className="flex flex-wrap gap-4 items-end">
        <FormControl label="Category" layout="vertical">
          <SelectionButtonGroup<SourceCategory>
            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
            selectedValue={filters.category}
            onSelectionChange={onCategoryChange}
            size="sm"
            fullWidthOnMobile={false}
            accentColor="purple"
          />
        </FormControl>
      </div>

      {/* Row 2: Run Type + Tier (related concepts) */}
      <div className="flex flex-wrap gap-4 items-end">
        <RunTypeSelector
          selectedType={filters.runType}
          onTypeChange={onRunTypeChange}
          accentColor="purple"
          layout="vertical"
        />

        <TierSelector
          selectedTier={filters.tier}
          onTierChange={onTierChange}
          availableTiers={availableTiers}
          accentColor="purple"
          layout="vertical"
        />
      </div>

      {/* Row 3: Duration + Period Count */}
      <div className="flex flex-wrap gap-4 items-end">
        <DurationSelector
          selectedDuration={filters.duration}
          onDurationChange={onDurationChange}
          availableDurations={availableDurations}
          accentColor="purple"
          layout="vertical"
        />

        <PeriodCountSelector
          selectedCount={filters.quantity}
          onCountChange={onQuantityChange}
          countOptions={periodOptions}
          label={periodLabel}
          accentColor="purple"
          layout="vertical"
        />
      </div>
    </div>
  )
}
