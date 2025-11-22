/**
 * Source Analysis Filter Controls Component
 *
 * Provides controls for filtering and configuring the source analysis view.
 * Uses purple accent theme to differentiate from other analysis pages.
 */

import { FormControl, SelectionButtonGroup } from '@/components/ui'
import type {
  SourceAnalysisFilters,
  SourceCategory,
  RunTypeFilter,
  SourceDuration,
} from '../types'
import { DURATION_LABELS, SourceDuration as Duration } from '../types'
import { getAvailableCategories } from '../category-config'

interface SourceAnalysisFiltersProps {
  filters: SourceAnalysisFilters
  availableTiers: number[]
  onCategoryChange: (category: SourceCategory) => void
  onRunTypeChange: (runType: RunTypeFilter) => void
  onTierChange: (tier: number | 'all') => void
  onDurationChange: (duration: SourceDuration) => void
  onQuantityChange: (quantity: number) => void
}

const RUN_TYPE_OPTIONS: { value: RunTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'farm', label: 'Farm' },
  { value: 'tournament', label: 'Tournament' },
]

const DURATION_OPTIONS: { value: SourceDuration; label: string }[] = [
  { value: Duration.PER_RUN, label: DURATION_LABELS[Duration.PER_RUN] },
  { value: Duration.DAILY, label: DURATION_LABELS[Duration.DAILY] },
  { value: Duration.WEEKLY, label: DURATION_LABELS[Duration.WEEKLY] },
  { value: Duration.MONTHLY, label: DURATION_LABELS[Duration.MONTHLY] },
  { value: Duration.YEARLY, label: DURATION_LABELS[Duration.YEARLY] },
]

const QUANTITY_OPTIONS = [5, 10, 15, 20, 30, 50]

export function SourceAnalysisFiltersComponent({
  filters,
  availableTiers,
  onCategoryChange,
  onRunTypeChange,
  onTierChange,
  onDurationChange,
  onQuantityChange,
}: SourceAnalysisFiltersProps) {
  const categories = getAvailableCategories()

  return (
    <div className="space-y-4">
      {/* Category Selector */}
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

      {/* Filter Row */}
      <div className="flex flex-wrap gap-4">
        {/* Run Type */}
        <FormControl label="Run Type">
          <SelectionButtonGroup<RunTypeFilter>
            options={RUN_TYPE_OPTIONS}
            selectedValue={filters.runType}
            onSelectionChange={onRunTypeChange}
            size="sm"
            fullWidthOnMobile={false}
            accentColor="purple"
          />
        </FormControl>

        {/* Tier Selector */}
        <FormControl label="Tier">
          <SelectionButtonGroup<number | 'all'>
            options={[
              { value: 'all', label: 'All' },
              ...availableTiers.map(tier => ({ value: tier, label: `T${tier}` }))
            ]}
            selectedValue={filters.tier}
            onSelectionChange={onTierChange}
            size="sm"
            fullWidthOnMobile={false}
            accentColor="purple"
          />
        </FormControl>

        {/* Aggregation Duration */}
        <FormControl label="Aggregation">
          <SelectionButtonGroup<SourceDuration>
            options={DURATION_OPTIONS}
            selectedValue={filters.duration}
            onSelectionChange={onDurationChange}
            size="sm"
            fullWidthOnMobile={false}
            accentColor="purple"
          />
        </FormControl>

        {/* Period Quantity */}
        <FormControl label="Periods">
          <SelectionButtonGroup<number>
            options={QUANTITY_OPTIONS.map(qty => ({ value: qty, label: `${qty}` }))}
            selectedValue={filters.quantity}
            onSelectionChange={onQuantityChange}
            size="sm"
            fullWidthOnMobile={false}
            accentColor="purple"
          />
        </FormControl>
      </div>
    </div>
  )
}
