/**
 * Activity Heatmap Orchestration Hook
 *
 * Manages all state for the Activity Heatmap feature: week navigation,
 * tier/run-type filtering, active hours configuration, grid building,
 * and summary statistics. Components consume this hook as a thin shell.
 *
 * Data flow:
 *   runs → filter by tier + runType → get runs for selected week →
 *   build heatmap grid → calculate summary statistics
 *
 * Week navigation is delegated to useWeekNavigation to keep this hook focused.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useData } from '@/shared/domain/use-data'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { HeatmapGrid, HeatmapSummary, HeatmapCell, ActiveHoursConfig } from './types'
import { extractAvailableTiers, allToZeroTierAdapter } from '@/shared/domain/filters/tier/tier-filter-logic'
import type { TierFilter } from '@/shared/domain/filters/types'
import { buildHeatmapGrid } from './calculations/heatmap-grid-builder'
import { getRunsForWeek } from './navigation/week-navigation'
import { filterHeatmapRuns } from './filters/run-filtering'
import { calculateHeatmapSummary } from './calculations/heatmap-statistics'
import { loadHeatmapConfig, saveHeatmapConfig } from './persistence/heatmap-persistence'
import { useWeekNavigation, type UseWeekNavigationReturn } from './navigation/use-week-navigation'

export interface UseActivityHeatmapReturn extends UseWeekNavigationReturn {
  // Grid data
  grid: HeatmapGrid | null
  summary: HeatmapSummary | null

  // Filters
  selectedTier: TierFilter
  setSelectedTier: (tier: TierFilter) => void
  availableTiers: number[]
  selectedRunType: RunTypeFilter
  setSelectedRunType: (runType: RunTypeFilter) => void
  activeHours: ActiveHoursConfig
  setActiveHours: (config: ActiveHoursConfig) => void

  // Tooltip
  hoveredCell: HeatmapCell | null
  tooltipAnchorRect: DOMRect | null
  setHoveredCell: (cell: HeatmapCell | null, anchorRect?: DOMRect | null) => void

  // Data state
  hasRuns: boolean
}

export function useActivityHeatmap(): UseActivityHeatmapReturn {
  const { runs } = useData()

  // Week navigation (delegated to sub-hook)
  const weekNav = useWeekNavigation(runs)

  // State: filters
  const [selectedTier, setSelectedTier] = useState<TierFilter>('all')
  const [selectedRunType, setSelectedRunType] = useState<RunTypeFilter>('all')

  // State: active hours (initialized from persistence)
  const [activeHours, setActiveHoursState] = useState<ActiveHoursConfig>(loadHeatmapConfig)

  // State: tooltip hover + anchor rect for positioning
  const [hoveredCell, setHoveredCellState] = useState<HeatmapCell | null>(null)
  const [tooltipAnchorRect, setTooltipAnchorRect] = useState<DOMRect | null>(null)

  const setHoveredCell = useCallback((cell: HeatmapCell | null, anchorRect?: DOMRect | null) => {
    setHoveredCellState(cell)
    setTooltipAnchorRect(anchorRect ?? null)
  }, [])

  // Derive available tiers from ALL runs
  const availableTiers = useMemo(() => extractAvailableTiers(runs), [runs])

  // Auto-reset tier to 'all' when the selected tier is no longer available
  useEffect(() => {
    if (selectedTier !== 'all' && !availableTiers.includes(selectedTier)) {
      setSelectedTier('all')
    }
  }, [availableTiers, selectedTier])

  // Filter runs by tier + run type
  const filteredRuns = useMemo(() => {
    const tierValue = allToZeroTierAdapter(selectedTier)
    return filterHeatmapRuns(runs, { tier: tierValue, runType: selectedRunType })
  }, [runs, selectedTier, selectedRunType])

  // Get runs for the selected week, then build grid and summary
  const weekRuns = useMemo(() => {
    if (!weekNav.selectedWeek) return []
    return getRunsForWeek(filteredRuns, weekNav.selectedWeek.weekStart)
  }, [filteredRuns, weekNav.selectedWeek])

  const grid = useMemo(() => {
    if (!weekNav.selectedWeek) return null
    return buildHeatmapGrid(weekRuns, weekNav.selectedWeek.weekStart)
  }, [weekRuns, weekNav.selectedWeek])

  const summary = useMemo(() => {
    if (!grid) return null
    return calculateHeatmapSummary(grid, activeHours)
  }, [grid, activeHours])

  // Persist active hours config when changed
  const setActiveHours = useCallback((config: ActiveHoursConfig) => {
    setActiveHoursState(config)
    saveHeatmapConfig(config)
  }, [])

  return {
    // Week navigation (spread from sub-hook)
    ...weekNav,

    // Grid data
    grid,
    summary,

    // Filters
    selectedTier,
    setSelectedTier,
    availableTiers,
    selectedRunType,
    setSelectedRunType,
    activeHours,
    setActiveHours,

    // Tooltip
    hoveredCell,
    tooltipAnchorRect,
    setHoveredCell,

    // Data state
    hasRuns: runs.length > 0,
  }
}
