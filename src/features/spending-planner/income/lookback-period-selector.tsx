/**
 * Lookback Period Selector Component
 *
 * Allows user to select how far back to look for growth rate calculation.
 */

import { SelectionButtonGroup, type SelectionOption } from '@/components/ui/selection-button-group'
import type { LookbackPeriod } from '../types'

interface LookbackPeriodSelectorProps {
  value: LookbackPeriod
  onChange: (period: LookbackPeriod) => void
  className?: string
}

const LOOKBACK_OPTIONS: SelectionOption<LookbackPeriod>[] = [
  { value: '3mo', label: '3 months', tooltip: 'Calculate growth from last 3 months of data' },
  { value: '6mo', label: '6 months', tooltip: 'Calculate growth from last 6 months of data' },
  { value: 'all', label: 'All time', tooltip: 'Calculate growth from all available data' },
]

export function LookbackPeriodSelector({
  value,
  onChange,
  className,
}: LookbackPeriodSelectorProps) {
  return (
    <SelectionButtonGroup
      options={LOOKBACK_OPTIONS}
      selectedValue={value}
      onSelectionChange={onChange}
      size="sm"
      spacing="tight"
      className={className}
      ariaLabel="Growth rate calculation period"
    />
  )
}
