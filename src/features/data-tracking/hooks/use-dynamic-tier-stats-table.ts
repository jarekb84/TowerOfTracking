import { useMemo, useState, useCallback } from 'react'
import type { ParsedGameRun } from '../types/game-run.types'
import type { UseTierStatsConfigReturn } from './use-tier-stats-config'
import type { DynamicTierStats, TierStatsColumn, CellTooltipData } from '../types/tier-stats-config.types'
import {
  calculateDynamicTierStats,
  buildColumnDefinitions,
  getCellValue,
  calculateSummaryStats,
  type TierStatsSummary
} from '../utils/tier-stats-calculator'
import { filterRunsByType, RunTypeFilter } from '../utils/run-type-filter'
import { getFieldValue } from '../utils/field-utils'
import { formatLargeNumber } from '../utils/chart-data'
import { formatDuration } from '../utils/data-parser'

export interface UseDynamicTierStatsTableReturn {
  tierStats: DynamicTierStats[]
  columns: TierStatsColumn[]
  summary: TierStatsSummary
  sortField: string
  sortDirection: 'asc' | 'desc'
  handleSort: (columnId: string) => void
  getCellDisplayValue: (tierStats: DynamicTierStats, column: TierStatsColumn) => { main: string; hourly?: string }
  getCellTooltipData: (tierStats: DynamicTierStats, column: TierStatsColumn) => CellTooltipData | null
}

export function useDynamicTierStatsTable(
  runs: ParsedGameRun[],
  config: UseTierStatsConfigReturn,
  runTypeFilter: RunTypeFilter = 'farm'
): UseDynamicTierStatsTableReturn {
  // Filter runs by type
  const filteredRuns = useMemo(
    () => filterRunsByType(runs, runTypeFilter),
    [runs, runTypeFilter]
  )

  // Calculate dynamic tier stats
  const baseTierStats = useMemo(
    () => calculateDynamicTierStats(filteredRuns, config.selectedColumns),
    [filteredRuns, config.selectedColumns]
  )

  // Build column definitions
  const columns = useMemo(
    () => buildColumnDefinitions(
      config.selectedColumns,
      config.availableFields
    ),
    [config.selectedColumns, config.availableFields]
  )

  // Calculate summary stats
  const summary = useMemo(
    () => calculateSummaryStats(baseTierStats, config.selectedColumns),
    [baseTierStats, config.selectedColumns]
  )

  // Sorting state
  const [sortField, setSortField] = useState<string>('tier')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Apply sorting
  const tierStats = useMemo(() => {
    return [...baseTierStats].sort((a, b) => {
      // Special case: tier always sorts by tier number
      if (sortField === 'tier') {
        return sortDirection === 'asc' ? a.tier - b.tier : b.tier - a.tier
      }

      // Find the column to sort by
      const column = columns.find(col => col.id === sortField)
      if (!column) return 0

      // Always sort by base value (not hourly rate)
      const aValue = getCellValue(a, column.fieldName, false) ?? -Infinity
      const bValue = getCellValue(b, column.fieldName, false) ?? -Infinity

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [baseTierStats, sortField, sortDirection, columns])

  // Sort handler
  const handleSort = useCallback((columnId: string) => {
    if (sortField === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(columnId)
      setSortDirection('desc')
    }
  }, [sortField, sortDirection])

  // Get cell display value - returns object with main value and optional hourly rate
  const getCellDisplayValue = useCallback((tierStats: DynamicTierStats, column: TierStatsColumn): { main: string; hourly?: string } => {
    if (column.id === 'tier') {
      return { main: `Tier ${tierStats.tier}` }
    }

    const value = getCellValue(tierStats, column.fieldName, false)
    if (value === null) return { main: '-' }

    const formattedMain = formatCellValue(value, column.dataType)

    // Add hourly rate if enabled for this column
    if (column.showHourlyRate) {
      const hourlyValue = getCellValue(tierStats, column.fieldName, true)
      if (hourlyValue !== null) {
        const formattedHourly = formatCellValue(hourlyValue, column.dataType)
        return { main: formattedMain, hourly: `${formattedHourly}/h` }
      }
    }

    return { main: formattedMain }
  }, [])

  // Get tooltip data for a cell
  const getCellTooltipData = useCallback((tierStats: DynamicTierStats, column: TierStatsColumn): CellTooltipData | null => {
    if (column.id === 'tier') return null

    const fieldStats = tierStats.fields[column.fieldName]
    if (!fieldStats) return null

    const run = fieldStats.maxValueRun
    const wave = getFieldValue<number>(run, 'wave') ?? 0
    const duration = run.realTime

    const value = fieldStats.maxValue

    const tooltipData: CellTooltipData = {
      fieldName: column.fieldName,
      displayName: column.displayName,
      value,
      run,
      wave,
      duration,
      timestamp: run.timestamp,
      isHourlyRate: false
    }

    // Add hourly rate context if this column shows hourly rates
    if (column.showHourlyRate && fieldStats.hourlyRate) {
      tooltipData.hourlyRateContext = {
        baseValue: fieldStats.maxValue,
        runDuration: duration
      }
    }

    return tooltipData
  }, [])

  return {
    tierStats,
    columns,
    summary,
    sortField,
    sortDirection,
    handleSort,
    getCellDisplayValue,
    getCellTooltipData
  }
}

// Helper function to format cell values based on data type
function formatCellValue(value: number, dataType: 'number' | 'duration' | 'string' | 'date'): string {
  if (dataType === 'duration') {
    return formatDuration(Math.round(value))
  }
  return formatLargeNumber(Math.round(value))
}
