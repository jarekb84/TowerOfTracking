/**
 * Activity Heatmap Main Component
 *
 * Orchestrates the activity heatmap feature by wiring the orchestration hook
 * to the presentation sub-components: week navigator, filters, grid, tooltip,
 * and summary statistics.
 *
 * Thin presentation shell — all business logic lives in useActivityHeatmap.
 */

import { useActivityHeatmap, type UseActivityHeatmapReturn } from './use-activity-heatmap'
import { WeekNavigator } from './navigation/week-navigator'
import { HeatmapFilters } from './filters/heatmap-filters'
import { HeatmapGridComponent } from './grid/heatmap-grid'
import { CellTooltip } from './grid/cell-tooltip'
import { HeatmapSummaryBar } from './heatmap-summary-bar'

function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[32rem] px-4 py-8">
      <div className="max-w-lg text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
            <svg
              className="w-12 h-12 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-100">
            No Data Available
          </h3>
          <p className="text-slate-400">
            Import your game data to view your activity heatmap.
            Head to the Data tab to get started.
          </p>
        </div>
      </div>
    </div>
  )
}

function NoFilteredDataState() {
  return (
    <div className="flex items-center justify-center min-h-[20rem] px-4 py-8">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-600">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-slate-200">
            No Activity This Week
          </h3>
          <p className="text-slate-400 text-sm">
            No runs match the current filters for this week.
            Try adjusting the tier or run type filters, or navigate to a different week.
          </p>
        </div>
      </div>
    </div>
  )
}

export function ActivityHeatmap() {
  const heatmap = useActivityHeatmap()

  if (!heatmap.hasRuns) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      {heatmap.selectedWeek && (
        <WeekNavigator
          weekLabel={heatmap.selectedWeek.weekLabel}
          canGoPrev={heatmap.canGoPrev}
          canGoNext={heatmap.canGoNext}
          onPrev={heatmap.onPrevWeek}
          onNext={heatmap.onNextWeek}
          onGoToLatest={heatmap.onGoToLatest}
        />
      )}

      {/* Filters */}
      <HeatmapFilters
        selectedTier={heatmap.selectedTier}
        onTierChange={heatmap.setSelectedTier}
        availableTiers={heatmap.availableTiers}
        selectedRunType={heatmap.selectedRunType}
        onRunTypeChange={heatmap.setSelectedRunType}
        activeHours={heatmap.activeHours}
        onActiveHoursChange={heatmap.setActiveHours}
      />

      <HeatmapWeekContent heatmap={heatmap} />
    </div>
  )
}

function HeatmapWeekContent({ heatmap }: { heatmap: UseActivityHeatmapReturn }) {
  const hasWeekActivity = heatmap.summary !== null && heatmap.summary.runCount > 0

  if (!hasWeekActivity) {
    return <NoFilteredDataState />
  }

  return (
    <>
      {/* Summary Statistics */}
      {heatmap.summary && (
        <HeatmapSummaryBar
          summary={heatmap.summary}
          activeHoursEnabled={heatmap.activeHours.enabled}
          selectedRunType={heatmap.selectedRunType}
        />
      )}

      {/* Heatmap Grid */}
      {heatmap.grid && (
        <HeatmapGridComponent
          grid={heatmap.grid}
          activeHours={heatmap.activeHours}
          hoveredCell={heatmap.hoveredCell}
          onCellHover={heatmap.setHoveredCell}
          dailyCoverage={heatmap.summary?.dailyCoverage}
        />
      )}

      {/* Cell Tooltip (fixed-positioned overlay) */}
      {heatmap.hoveredCell && (
        <CellTooltip
          cell={heatmap.hoveredCell}
          anchorRect={heatmap.tooltipAnchorRect}
        />
      )}
    </>
  )
}
