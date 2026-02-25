/**
 * Cell Tooltip Component
 *
 * Displays detailed information about a hovered heatmap cell.
 * Shows the date/time, coverage percentage, and segment breakdown.
 * Uses the shared TooltipContentWrapper for consistent styling.
 *
 * Positioned as a fixed overlay anchored to the cell's DOM rect,
 * with automatic viewport-edge detection to prevent overflow.
 *
 * Thin presentation shell — all data is pre-computed and passed as props.
 */

import type { HeatmapCell } from '../types'
import { formatDisplayDate } from '@/shared/formatting/date-formatters'
import { getRunTypeDisplayLabel } from '@/features/analysis/shared/filtering/run-type-filter'
import { getRunTypeColor } from '@/shared/domain/run-types/run-type-display'
import { TooltipContentWrapper } from '@/components/ui/tooltip-content'
import { formatHourLabel } from './grid-labels'
import { formatCoveragePercent, formatMinuteDisplay, sortSegmentsByTime } from '../summary-formatters'
import type { RunTypeValue } from '@/shared/domain/run-types/types'

interface CellTooltipProps {
  cell: HeatmapCell
  anchorRect: DOMRect | null
}

export function CellTooltip({ cell, anchorRect }: CellTooltipProps) {
  if (!anchorRect) return null

  const tooltipWidth = 260
  const tooltipGap = 8

  // Position above the cell by default; flip below if near top of viewport
  const positionAbove = anchorRect.top > 160
  const top = positionAbove
    ? anchorRect.top - tooltipGap
    : anchorRect.bottom + tooltipGap

  // Center horizontally on the cell, clamp to viewport edges
  const rawLeft = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2
  const left = Math.max(8, Math.min(rawLeft, window.innerWidth - tooltipWidth - 8))

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        top,
        left,
        width: tooltipWidth,
        transform: positionAbove ? 'translateY(-100%)' : undefined,
      }}
      role="tooltip"
    >
      <TooltipContentWrapper variant="detailed" className="shadow-2xl backdrop-blur-md">
        <div className="space-y-2">
          {/* Date & time header */}
          <div className="border-b border-slate-700/80 pb-2 text-xs font-medium text-slate-300">
            {formatDisplayDate(cell.date)} — {formatHourLabel(cell.hour)}
          </div>

          {/* Coverage percentage */}
          <div className="text-sm font-semibold text-white">
            {formatCoveragePercent(cell.totalCoverage)} coverage
          </div>

          {/* Segment breakdown */}
          {cell.segments.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              {sortSegmentsByTime(cell.segments).map((segment, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-slate-300">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: getRunTypeColor(segment.runType) }}
                  />
                  <span>{getRunTypeDisplayLabel(segment.runType as RunTypeValue)}</span>
                  <span className="text-slate-500">T{segment.tier}</span>
                  <span className="ml-auto tabular-nums text-slate-400">
                    {formatMinuteDisplay(segment.startFraction)}&ndash;{formatMinuteDisplay(segment.endFraction)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {cell.segments.length === 0 && (
            <div className="text-xs text-slate-500">No activity</div>
          )}
        </div>
      </TooltipContentWrapper>
    </div>
  )
}
