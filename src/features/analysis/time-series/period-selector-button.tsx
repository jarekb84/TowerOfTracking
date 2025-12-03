import { Button } from '@/components/ui'
import type { TimePeriod, TimePeriodConfig } from './chart-types'

interface PeriodSelectorButtonProps {
  config: TimePeriodConfig
  isSelected: boolean
  onSelect: (period: TimePeriod) => void
}

/**
 * Individual period selection button with color-coded visual styling.
 * Extracted from TimeSeriesChart to reduce component complexity.
 */
export function PeriodSelectorButton({ config, isSelected, onSelect }: PeriodSelectorButtonProps) {
  return (
    <Button
      variant={isSelected ? "outline-selected" : "outline"}
      size="sm"
      fullWidthOnMobile={false}
      onClick={() => onSelect(config.period)}
      className="transition-all duration-200 group min-w-0 flex-shrink-0"
      style={{
        '--period-color': config.color,
        backgroundColor: isSelected
          ? `color-mix(in srgb, ${config.color} 15%, transparent)`
          : undefined,
        borderColor: isSelected
          ? `color-mix(in srgb, ${config.color} 60%, transparent)`
          : undefined,
        color: isSelected ? '#e2e8f0' : '#94a3b8'
      } as React.CSSProperties}
    >
      <div
        className="w-3 h-3 rounded-full mr-2 transition-all duration-200 flex-shrink-0"
        style={{
          backgroundColor: config.color,
          filter: isSelected ? 'none' : 'opacity(0.6)'
        }}
      />
      <span className="whitespace-nowrap">{config.label}</span>
    </Button>
  )
}
