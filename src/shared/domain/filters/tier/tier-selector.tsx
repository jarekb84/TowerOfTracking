/**
 * TierSelector Component
 *
 * Unified tier selector with consistent ordering (highest first),
 * abbreviated labels (T14, T13...), and optional count display.
 */

import { FormControl } from '@/components/ui/form-field'
import { SelectionButtonGroup, type SelectionOption } from '@/components/ui'
import type { TierFilter } from '../types'
import { formatTierLabel } from './tier-filter-logic'

interface TierSelectorProps {
  /** Currently selected tier (number or 'all') */
  selectedTier: TierFilter
  /** Callback when tier selection changes */
  onTierChange: (tier: TierFilter) => void
  /** Available tiers to show (should be sorted highest first) */
  availableTiers: number[]
  /** Optional counts per tier for display as subtle badges */
  tierCounts?: Map<number, number>
  /** Whether to show counts as badges */
  showCounts?: boolean
  /** Whether to include "All" option */
  showAllOption?: boolean
  /** Optional className for the wrapper */
  className?: string
  /** Accent color theme */
  accentColor?: 'orange' | 'purple'
  /** Label for the selector */
  label?: string
}

/**
 * Build tier options for SelectionButtonGroup
 * Counts are displayed as subtle badges when enabled
 */
function buildTierOptions(
  availableTiers: number[],
  tierCounts: Map<number, number> | undefined,
  showCounts: boolean,
  showAllOption: boolean
): SelectionOption<TierFilter>[] {
  const options: SelectionOption<TierFilter>[] = []

  if (showAllOption) {
    options.push({ value: 'all', label: 'All' })
  }

  for (const tier of availableTiers) {
    const count = showCounts && tierCounts ? tierCounts.get(tier) : undefined

    options.push({
      value: tier,
      label: formatTierLabel(tier),
      badge: count
    })
  }

  return options
}

export function TierSelector({
  selectedTier,
  onTierChange,
  availableTiers,
  tierCounts,
  showCounts = false,
  showAllOption = true,
  className,
  accentColor = 'orange',
  label = 'Tier'
}: TierSelectorProps) {
  const options = buildTierOptions(
    availableTiers,
    tierCounts,
    showCounts,
    showAllOption
  )

  return (
    <FormControl label={label} className={className}>
      <SelectionButtonGroup<TierFilter>
        options={options}
        selectedValue={selectedTier}
        onSelectionChange={onTierChange}
        size="sm"
        fullWidthOnMobile={false}
        accentColor={accentColor}
        ariaLabel="Select tier"
      />
    </FormControl>
  )
}
