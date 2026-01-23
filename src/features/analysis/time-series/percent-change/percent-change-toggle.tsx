import { FormControl, ToggleSwitch } from '@/components/ui'
import { cn } from '@/shared/lib/utils'

interface PercentChangeToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

/**
 * Toggle switch for enabling/disabling percentage change overlay.
 * Positioned between MovingAverageSelector and DataPointsCount.
 *
 * Shows a cyan accent when enabled to match the line color on the chart.
 */
export function PercentChangeToggle({
  enabled,
  onToggle,
}: PercentChangeToggleProps) {
  return (
    <FormControl label="% Change" layout="vertical">
      <div
        className={cn(
          'h-8 [@media(pointer:coarse)]:h-10 flex items-center px-2.5 rounded-md border transition-colors duration-200',
          enabled
            ? 'bg-cyan-950/30 border-cyan-500/50'
            : 'bg-transparent border-transparent'
        )}
      >
        <ToggleSwitch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label="Toggle percentage change overlay"
          data-testid="percent-change-toggle"
          className={cn(enabled && 'bg-cyan-500 hover:bg-cyan-600')}
        />
      </div>
    </FormControl>
  )
}
