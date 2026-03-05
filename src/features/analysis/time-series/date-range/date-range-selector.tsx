import { useMemo } from 'react'
import { FormControl, Select } from '@/components/ui'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import {
  type DateRange,
  DATE_RANGE_OPTIONS,
  countRunsForOption,
} from './date-range-types'

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (value: DateRange) => void
  runs: readonly ParsedGameRun[]
}

/**
 * Dropdown selector for date range filtering.
 * Shows options grouped by date and run count, with per-option run counts.
 */
export function DateRangeSelector({ value, onChange, runs }: DateRangeSelectorProps) {
  const optionsWithCounts = useMemo(
    () =>
      DATE_RANGE_OPTIONS.map((opt) => ({
        ...opt,
        count: countRunsForOption(runs, opt),
      })),
    [runs]
  )

  const dateOptions = optionsWithCounts.filter((o) => o.group === 'date')
  const runsOptions = optionsWithCounts.filter((o) => o.group === 'runs')

  return (
    <FormControl label="Data" layout="vertical">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as DateRange)}
        size="compact"
        data-testid="date-range-selector"
      >
        <optgroup label="By Date">
          {dateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} ({opt.count})
            </option>
          ))}
        </optgroup>
        <optgroup label="By Count">
          {runsOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} ({opt.count})
            </option>
          ))}
        </optgroup>
      </Select>
    </FormControl>
  )
}
