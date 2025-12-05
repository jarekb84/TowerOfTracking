/**
 * DurationSelector Component
 *
 * Unified duration selector with context-aware options.
 * Only shows Yearly when data spans multiple years.
 */

import { FormControl } from '@/components/ui/form-field'
import { SelectionButtonGroup, type SelectionOption } from '@/components/ui'
import { Duration, DURATION_LABELS } from '../types'
import type { SelectorStyleProps } from '../types'

interface DurationSelectorProps extends SelectorStyleProps {
  /** Currently selected duration */
  selectedDuration: Duration
  /** Callback when duration selection changes */
  onDurationChange: (duration: Duration) => void
  /** Available durations based on data span */
  availableDurations: Duration[]
  /** Label for the selector */
  label?: string
}

/**
 * Build duration options for SelectionButtonGroup
 */
function buildDurationOptions(
  availableDurations: Duration[]
): SelectionOption<Duration>[] {
  return availableDurations.map(duration => ({
    value: duration,
    label: DURATION_LABELS[duration]
  }))
}

export function DurationSelector({
  selectedDuration,
  onDurationChange,
  availableDurations,
  className,
  accentColor = 'orange',
  label = 'Duration',
  layout = 'auto'
}: DurationSelectorProps) {
  const options = buildDurationOptions(availableDurations)

  return (
    <FormControl label={label} className={className} layout={layout}>
      <SelectionButtonGroup<Duration>
        options={options}
        selectedValue={selectedDuration}
        onSelectionChange={onDurationChange}
        size="sm"
        fullWidthOnMobile={false}
        accentColor={accentColor}
        ariaLabel="Select duration"
      />
    </FormControl>
  )
}
