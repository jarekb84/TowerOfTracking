/**
 * Heatmap Grid
 *
 * Renders the 24x7 (hours x days) activity grid. Each cell displays
 * colored segments representing game run coverage within that hour slot.
 *
 * Thin presentation shell — grid data, label formatting, and segment
 * colors are delegated to pure functions and the orchestration hook.
 */

import type { HeatmapGrid, HeatmapCell, ActiveHoursConfig } from '../types'
import { CELL_BG_NORMAL, CELL_BG_ACTIVE, toPercent } from './cell-rendering'
import { formatHourLabel, formatDayHeaderLabel, isHourActive } from './grid-labels'
import { formatCoveragePercent } from '../summary-formatters'
import { getRunTypeColor } from '@/shared/domain/run-types/run-type-display'

interface HeatmapGridComponentProps {
  grid: HeatmapGrid
  activeHours: ActiveHoursConfig
  hoveredCell: HeatmapCell | null
  onCellHover: (cell: HeatmapCell | null, anchorRect?: DOMRect | null) => void
  dailyCoverage?: number[]
}

export function HeatmapGridComponent({
  grid,
  activeHours,
  hoveredCell,
  onCellHover,
  dailyCoverage,
}: HeatmapGridComponentProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/50 bg-slate-800/20 p-3 sm:p-4">
      <table className="w-full border-collapse" role="grid" aria-label="Activity heatmap grid">
        <thead>
          <tr>
            {/* Empty corner cell */}
            <th className="w-14 p-0 sm:w-16" aria-hidden="true" />
            {/* Day headers with weekday + date */}
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <th
                key={dayIndex}
                className="px-0.5 pb-1 text-center text-[0.65rem] font-medium text-slate-400 sm:px-1 sm:text-xs"
              >
                {formatDayHeaderLabel(dayIndex, grid.weekStart)}
              </th>
            ))}
          </tr>
          {dailyCoverage && (
            <tr>
              <th className="w-14 p-0 sm:w-16" aria-hidden="true" />
              {dailyCoverage.map((coverage, dayIndex) => (
                <th
                  key={dayIndex}
                  className="px-0.5 pb-1.5 text-center text-[0.625rem] tabular-nums text-amber-400/70 sm:text-[0.7rem]"
                  aria-label={`${formatDayHeaderLabel(dayIndex, grid.weekStart)} coverage: ${formatCoveragePercent(coverage)}`}
                >
                  {formatCoveragePercent(coverage)}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {Array.from({ length: 24 }, (_, hour) => (
            <HeatmapRow
              key={hour}
              hour={hour}
              grid={grid}
              activeHours={activeHours}
              hoveredCell={hoveredCell}
              onCellHover={onCellHover}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface HeatmapRowProps {
  hour: number
  grid: HeatmapGrid
  activeHours: ActiveHoursConfig
  hoveredCell: HeatmapCell | null
  onCellHover: (cell: HeatmapCell | null, anchorRect?: DOMRect | null) => void
}

function HeatmapRow({ hour, grid, activeHours, hoveredCell, onCellHover }: HeatmapRowProps) {
  const active = isHourActive(hour, activeHours.startHour, activeHours.endHour, activeHours.enabled)

  return (
    <tr>
      {/* Hour label */}
      <td
        className={`pr-1.5 text-right text-[0.65rem] tabular-nums sm:pr-2 sm:text-xs ${active ? 'font-medium text-amber-400/80' : 'text-slate-500'}`}
      >
        {formatHourLabel(hour)}
      </td>

      {/* Day cells */}
      {Array.from({ length: 7 }, (_, dayIndex) => {
        const cell = grid.days[dayIndex][hour]
        return (
          <HeatmapCellComponent
            key={dayIndex}
            cell={cell}
            isActiveHour={active}
            isHovered={hoveredCell === cell}
            onHover={onCellHover}
          />
        )
      })}
    </tr>
  )
}

interface HeatmapCellComponentProps {
  cell: HeatmapCell
  isActiveHour: boolean
  isHovered: boolean
  onHover: (cell: HeatmapCell | null, anchorRect?: DOMRect | null) => void
}

function getCellBorderClass(isHovered: boolean, isActiveHour: boolean): string {
  if (isHovered) return 'border-amber-400 ring-2 ring-amber-400/30'
  if (isActiveHour) return 'border-amber-500/20'
  return 'border-slate-700/40'
}

/** Returns the opaque solid background color for a cell based on active-hour state. */
function getCellBackgroundColor(isActiveHour: boolean): string {
  return isActiveHour ? CELL_BG_ACTIVE : CELL_BG_NORMAL
}

function HeatmapCellComponent({ cell, isActiveHour, isHovered, onHover }: HeatmapCellComponentProps) {
  const hasSegments = cell.segments.length > 0
  const bgColor = getCellBackgroundColor(isActiveHour)
  const borderClass = getCellBorderClass(isHovered, isActiveHour)

  return (
    <td
      className={`p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900 rounded-sm ${hasSegments ? 'cursor-pointer' : ''}`}
      tabIndex={hasSegments ? 0 : -1}
      aria-label={`${cell.segments.length} segment${cell.segments.length !== 1 ? 's' : ''}, ${formatCoveragePercent(cell.totalCoverage)} coverage`}
      onMouseEnter={(e) => onHover(cell, (e.currentTarget as HTMLElement).getBoundingClientRect())}
      onMouseLeave={() => onHover(null)}
      onFocus={(e) => onHover(cell, (e.currentTarget as HTMLElement).getBoundingClientRect())}
      onBlur={() => onHover(null)}
    >
      <div
        className={`relative h-5 min-w-5 overflow-hidden rounded-sm border transition-colors duration-100 sm:h-6 sm:min-w-6 ${borderClass}`}
        style={{ backgroundColor: bgColor }}
      >
        {hasSegments && cell.segments.map((segment, index) => (
          <div
            key={index}
            className="absolute inset-y-0"
            style={{
              left: `${toPercent(segment.startFraction)}%`,
              width: `${toPercent(segment.endFraction - segment.startFraction)}%`,
              backgroundColor: getRunTypeColor(segment.runType),
            }}
          />
        ))}
      </div>
    </td>
  )
}
