import { FormControl, Select } from '@/components/ui'
import type { TimePeriod } from '../chart-types'
import { getTrendWindowOptions, type TrendWindowValue } from './moving-average-types'
import { cn } from '@/shared/lib/utils'

interface MovingAverageSelectorProps {
  value: TrendWindowValue
  period: TimePeriod
  onChange: (value: TrendWindowValue) => void
}

/**
 * Dropdown selector for trend window size.
 * Renders next to the Data Points indicator in time series charts.
 * Options are context-aware based on the selected time period.
 *
 * When a trend window is selected (not 'none'), the selector shows a subtle
 * orange accent to indicate the trend line is active on the chart.
 */
export function MovingAverageSelector({
  value,
  period,
  onChange,
}: MovingAverageSelectorProps) {
  const isActive = value !== 'none'
  const options = getTrendWindowOptions(period)

  return (
    <FormControl label="Trend" layout="vertical">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as TrendWindowValue)}
        size="compact"
        data-testid="moving-average-selector"
        className={cn(
          'transition-colors duration-200',
          isActive && 'bg-orange-950/30 border-orange-500/50 text-orange-100'
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </FormControl>
  )
}
