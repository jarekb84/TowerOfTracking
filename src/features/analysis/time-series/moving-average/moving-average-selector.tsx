import { FormControl, Select } from '@/components/ui'
import { MovingAveragePeriod, MOVING_AVERAGE_OPTIONS } from './moving-average-types'
import { cn } from '@/shared/lib/utils'

interface MovingAverageSelectorProps {
  value: MovingAveragePeriod
  onChange: (period: MovingAveragePeriod) => void
}

/**
 * Dropdown selector for moving average window size
 * Renders next to the Data Points indicator in time series charts
 *
 * When a moving average period is selected (not 'none'), the selector shows a subtle
 * orange accent to indicate the trend line is active on the chart.
 */
export function MovingAverageSelector({ value, onChange }: MovingAverageSelectorProps) {
  const isActive = value !== 'none'

  return (
    <FormControl label="Trend" layout="vertical">
      <Select
        value={String(value)}
        onChange={(e) => {
          const val = e.target.value
          onChange(val === 'none' ? 'none' : (Number(val) as 3 | 5 | 10))
        }}
        size="compact"
        data-testid="moving-average-selector"
        className={cn(
          "transition-colors duration-200",
          isActive && "border-orange-500/50 text-orange-100"
        )}
      >
        {MOVING_AVERAGE_OPTIONS.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </Select>
    </FormControl>
  )
}
