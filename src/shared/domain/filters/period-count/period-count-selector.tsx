/**
 * PeriodCountSelector Component
 *
 * Unified period count selector with dynamic labels based on duration.
 * Shows appropriate increments for each duration type.
 */

import { FormControl } from '@/components/ui/form-field'
import { SelectionButtonGroup, type SelectionOption } from '@/components/ui'
import type { PeriodCountFilter } from '../types'

interface PeriodCountSelectorProps {
  /** Currently selected period count */
  selectedCount: PeriodCountFilter
  /** Callback when count selection changes */
  onCountChange: (count: PeriodCountFilter) => void
  /** Available count options */
  countOptions: number[]
  /** Dynamic label based on duration (e.g., "Last Days") */
  label: string
  /** Whether to include "All" option */
  showAllOption?: boolean
  /** Optional className for the wrapper */
  className?: string
  /** Accent color theme */
  accentColor?: 'orange' | 'purple'
}

/**
 * Build period count options for SelectionButtonGroup
 */
function buildCountOptions(
  countOptions: number[],
  showAllOption: boolean
): SelectionOption<PeriodCountFilter>[] {
  const options: SelectionOption<PeriodCountFilter>[] = []

  if (showAllOption) {
    options.push({ value: 'all', label: 'All' })
  }

  for (const count of countOptions) {
    options.push({ value: count, label: count.toString() })
  }

  return options
}

export function PeriodCountSelector({
  selectedCount,
  onCountChange,
  countOptions,
  label,
  showAllOption = true,
  className,
  accentColor = 'orange'
}: PeriodCountSelectorProps) {
  const options = buildCountOptions(countOptions, showAllOption)

  return (
    <FormControl label={label} className={className}>
      <SelectionButtonGroup<PeriodCountFilter>
        options={options}
        selectedValue={selectedCount}
        onSelectionChange={onCountChange}
        size="sm"
        fullWidthOnMobile={false}
        accentColor={accentColor}
        ariaLabel={`Select ${label.toLowerCase()}`}
      />
    </FormControl>
  )
}
