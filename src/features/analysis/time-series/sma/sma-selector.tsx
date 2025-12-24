import { FormControl, Select } from '@/components/ui'
import { SmaOption, SMA_DROPDOWN_OPTIONS } from './sma-types'
import { cn } from '@/shared/lib/utils'

interface SmaSelectorProps {
  value: SmaOption
  onChange: (option: SmaOption) => void
}

/**
 * Dropdown selector for SMA (Simple Moving Average) period
 * Renders next to the Data Points indicator in time series charts
 *
 * When an SMA option is selected (not 'none'), the selector shows a subtle
 * orange accent to indicate the trend line is active on the chart.
 */
export function SmaSelector({ value, onChange }: SmaSelectorProps) {
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
        data-testid="sma-selector"
        className={cn(
          "transition-colors duration-200",
          isActive && "border-orange-500/50 bg-orange-500/5 text-orange-100"
        )}
      >
        {SMA_DROPDOWN_OPTIONS.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </Select>
    </FormControl>
  )
}
