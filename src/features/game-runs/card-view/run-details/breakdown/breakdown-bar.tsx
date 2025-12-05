/**
 * Breakdown Bar Component
 *
 * Horizontal bar chart for displaying a single breakdown metric.
 * Shows label, value, percentage, and visual bar.
 */

import type { BreakdownItem } from '../types'
import { formatPercentage } from '@/shared/formatting/number-scale'
import { formatFieldDisplayName } from '@/shared/domain/fields/field-formatters'

interface BreakdownBarProps {
  item: BreakdownItem
}

/** Minimum visual bar width percentage for small percentages to remain visible */
const MIN_BAR_WIDTH_PERCENT = 2

export function BreakdownBar({ item }: BreakdownBarProps) {
  const { fieldName, displayName, color, percentage, displayValue } = item

  // Show original field name (title case) as tooltip for reference to battle export
  const tooltipText = formatFieldDisplayName(fieldName)

  // Cap visual width at 100%, but show actual percentage in text
  const visualPercentage = Math.min(percentage, 100)

  // Ensure minimum visibility for non-zero percentages
  const barWidth = percentage > 0
    ? Math.max(visualPercentage, MIN_BAR_WIDTH_PERCENT)
    : 0

  return (
    <div className="flex items-center gap-2 sm:gap-3 group">
      {/* Label - wider for readability, truncates gracefully */}
      <span
        className="text-sm text-muted-foreground w-32 sm:w-40 truncate flex-shrink-0 transition-colors duration-200 group-hover:text-foreground/80"
        title={tooltipText}
      >
        {displayName}
      </span>

      {/* Value and percentage - fixed width for alignment */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 w-20 sm:w-24 justify-end">
        <span className="text-muted-foreground/80 font-mono text-xs sm:text-sm">
          {displayValue}
        </span>
        <span className="font-semibold text-xs sm:text-sm" style={{ color }}>
          {formatPercentage(percentage)}
        </span>
      </div>

      {/* Bar container - flex to fill remaining space */}
      <div className="flex-1 min-w-8 sm:min-w-12 relative h-5 sm:h-6 rounded-sm overflow-hidden bg-muted/20">
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
