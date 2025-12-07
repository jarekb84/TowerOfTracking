/**
 * Breakdown Bar Component
 *
 * Horizontal bar chart for displaying a single breakdown metric.
 * Shows label, value, percentage, and visual bar.
 *
 * Supports discrepancy items (Unknown/Overage) with distinct styling
 * and explanatory tooltips.
 */

import type { BreakdownItem } from '../types'
import { formatPercentage } from '@/shared/formatting/number-scale'
import { formatFieldDisplayName } from '@/shared/domain/fields/field-formatters'
import { buildDiscrepancyTooltip } from './breakdown-tooltip'

interface BreakdownBarProps {
  item: BreakdownItem
}

/** Minimum visual bar width percentage for small percentages to remain visible */
const MIN_BAR_WIDTH_PERCENT = 2

export function BreakdownBar({ item }: BreakdownBarProps) {
  const {
    fieldName,
    displayName,
    color,
    percentage,
    displayValue,
    isDiscrepancy,
    discrepancyType,
  } = item

  // Build tooltip: explanatory text for discrepancies, field name for regular items
  const tooltipText = isDiscrepancy && discrepancyType
    ? buildDiscrepancyTooltip(discrepancyType, percentage, displayValue)
    : formatFieldDisplayName(fieldName)

  // Cap visual width at 100%, but show actual percentage in text
  const visualPercentage = Math.min(percentage, 100)

  // Ensure minimum visibility for non-zero percentages
  const barWidth = percentage > 0
    ? Math.max(visualPercentage, MIN_BAR_WIDTH_PERCENT)
    : 0

  // Base label classes shared by all items
  const labelBaseClassName = 'text-sm w-32 sm:w-40 truncate flex-shrink-0 transition-colors duration-200'

  // Discrepancy items: italic label with inline color (no hover override to preserve color connection)
  // Regular items: muted color with hover brightening
  const labelClassName = isDiscrepancy
    ? `${labelBaseClassName} italic`
    : `${labelBaseClassName} text-muted-foreground group-hover:text-foreground/80`

  // Discrepancy bar: dashed border around all edges with subtle fill to convey "estimated/tentative"
  // Regular bar: solid gradient fill with strong visual presence
  const barStyle = isDiscrepancy
    ? {
        width: `${barWidth}%`,
        background: `linear-gradient(90deg, ${color}30 0%, ${color}15 100%)`,
        border: `1px dashed ${color}80`,
      }
    : {
        width: `${barWidth}%`,
        background: `linear-gradient(90deg, ${color} 0%, ${color}99 50%, ${color}55 100%)`,
      }

  return (
    <div className="flex items-center gap-2 sm:gap-3 group">
      {/* Label - wider for readability, truncates gracefully */}
      <span
        className={labelClassName}
        style={isDiscrepancy ? { color } : undefined}
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
        {/* Filled bar with gradient (or dashed for discrepancy) */}
        <div
          className="absolute inset-y-0 left-0 rounded-sm transition-all duration-300 ease-out"
          style={barStyle}
        />
      </div>
    </div>
  )
}
