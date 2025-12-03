/**
 * Coverage Bar Component
 *
 * Horizontal bar chart for displaying a single coverage metric.
 * Shows label, visual bar with gradient fill, and value/percentage.
 */

import type { MetricCoverage } from '@/features/analysis/coverage-report/types'
import { formatLargeNumber, formatPercentage } from '@/shared/formatting/number-scale'

interface CoverageBarProps {
  metric: MetricCoverage
}

/** Minimum visual bar width percentage for small percentages to remain visible */
const MIN_BAR_WIDTH_PERCENT = 2

export function CoverageBar({ metric }: CoverageBarProps) {
  const { label, color, percentage, affectedCount } = metric

  // Cap visual width at 100%, but show actual percentage in text
  const visualPercentage = Math.min(percentage, 100)

  // Ensure minimum visibility for non-zero percentages
  const barWidth = percentage > 0
    ? Math.max(visualPercentage, MIN_BAR_WIDTH_PERCENT)
    : 0

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Label - responsive width for alignment */}
      <span className="text-xs text-muted-foreground w-20 sm:w-28 truncate flex-shrink-0" title={label}>
        {label}
      </span>

      {/* Value and percentage - responsive width for alignment */}
      <div className="flex items-center gap-1 sm:gap-1.5 text-xs flex-shrink-0 w-20 sm:w-24 justify-end">
        <span className="text-muted-foreground font-mono text-[11px] sm:text-xs">
          {formatLargeNumber(affectedCount)}
        </span>
        <span className="font-semibold text-[11px] sm:text-xs" style={{ color }}>
          {formatPercentage(percentage)}
        </span>
      </div>

      {/* Bar container - uses Tailwind height class for consistency */}
      <div className="flex-1 relative h-6 rounded-sm overflow-hidden bg-muted/30">
        {/* Filled bar with gradient */}
        <div
          className="absolute inset-y-0 left-0 rounded-sm transition-all duration-300 ease-out"
          style={{
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color}99 50%, ${color}55 100%)`,
          }}
        />
      </div>
    </div>
  )
}
