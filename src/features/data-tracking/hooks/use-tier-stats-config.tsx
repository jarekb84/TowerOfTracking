import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ParsedGameRun } from '../types/game-run.types'
import type {
  TierStatsConfig,
  TierStatsColumnConfig,
  AvailableField,
  TierStatsAggregation
} from '../types/tier-stats-config.types'
import {
  discoverAvailableFields,
  getUnselectedFields,
  validateColumnConfig,
  getDefaultConfig
} from '../utils/tier-stats-config'
import {
  loadTierStatsConfig,
  saveTierStatsConfig
} from '../utils/tier-stats-persistence'
import { reorderColumns } from '../utils/column-reorder'

export interface UseTierStatsConfigReturn {
  // Configuration state
  selectedColumns: TierStatsColumnConfig[]
  configSectionCollapsed: boolean
  aggregationType: TierStatsAggregation

  // Available fields
  availableFields: AvailableField[]
  unselectedFields: AvailableField[]

  // Data loading state
  isDataLoaded: boolean

  // Actions
  addColumn: (fieldName: string) => void
  removeColumn: (fieldName: string) => void
  reorderColumns: (fromIndex: number, toIndex: number) => void
  toggleColumnHourlyRate: (fieldName: string) => void
  toggleConfigSection: () => void
  setAggregationType: (aggregationType: TierStatsAggregation) => void
  resetToDefaults: () => void
}

/**
 * Hook for managing tier stats configuration state with localStorage persistence
 */
export function useTierStatsConfig(runs: ParsedGameRun[]): UseTierStatsConfigReturn {
  // Discover available fields from runs data
  const availableFields = useMemo(() => discoverAvailableFields(runs), [runs])

  // Create stable field name set for validation dependency tracking
  // Only changes when actual field names change, not on array reference changes
  const fieldNameSet = useMemo(
    () => availableFields.map(f => f.fieldName).sort().join(','),
    [availableFields]
  )

  // Load initial configuration from localStorage
  // NOTE: Don't validate columns during initial state - availableFields may be empty during SSR/initial render
  const [config, setConfig] = useState<TierStatsConfig>(() => loadTierStatsConfig())

  // Persist to localStorage whenever config changes
  useEffect(() => {
    saveTierStatsConfig(config)
  }, [config])

  // Revalidate columns when available fields change (but only if we have fields)
  // Uses fieldNameSet as dependency to avoid unnecessary re-runs when array reference changes
  useEffect(() => {
    // Skip validation if no fields available yet (data still loading)
    if (availableFields.length === 0) return

    setConfig(prev => {
      const validated = validateColumnConfig(prev.selectedColumns, availableFields)

      // Only update if validation actually changed the columns
      // Check both length and content to avoid unnecessary state updates
      if (validated.length !== prev.selectedColumns.length) {
        return { ...prev, selectedColumns: validated }
      }

      // Check if any column was actually removed (content changed)
      const hasContentChange = prev.selectedColumns.some(
        (col, idx) => validated[idx]?.fieldName !== col.fieldName
      )

      if (hasContentChange) {
        return { ...prev, selectedColumns: validated }
      }

      return prev
    })
  }, [fieldNameSet, availableFields])

  // Track data loading state
  const isDataLoaded = useMemo(() => availableFields.length > 0, [availableFields.length])

  // Calculate unselected fields
  const unselectedFields = useMemo(
    () => getUnselectedFields(availableFields, config.selectedColumns),
    [availableFields, config.selectedColumns]
  )

  // Add a column to the configuration
  const addColumn = useCallback((fieldName: string) => {
    setConfig(prev => {
      // Check if already selected
      if (prev.selectedColumns.some(col => col.fieldName === fieldName)) {
        return prev
      }

      return {
        ...prev,
        selectedColumns: [
          ...prev.selectedColumns,
          { fieldName, showHourlyRate: false }
        ]
      }
    })
  }, [])

  // Remove a column from the configuration
  const removeColumn = useCallback((fieldName: string) => {
    setConfig(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.filter(col => col.fieldName !== fieldName)
    }))
  }, [])

  // Reorder columns
  const handleReorderColumns = useCallback((fromIndex: number, toIndex: number) => {
    setConfig(prev => ({
      ...prev,
      selectedColumns: reorderColumns(prev.selectedColumns, fromIndex, toIndex)
    }))
  }, [])

  // Toggle hourly rate for a specific column
  const toggleColumnHourlyRate = useCallback((fieldName: string) => {
    setConfig(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.map(col =>
        col.fieldName === fieldName
          ? { ...col, showHourlyRate: !col.showHourlyRate }
          : col
      )
    }))
  }, [])

  // Toggle configuration section collapsed state
  const toggleConfigSection = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      configSectionCollapsed: !prev.configSectionCollapsed
    }))
  }, [])

  // Set aggregation type
  const setAggregationType = useCallback((aggregationType: TierStatsAggregation) => {
    setConfig(prev => ({
      ...prev,
      aggregationType
    }))
  }, [])

  // Reset configuration to defaults
  const resetToDefaults = useCallback(() => {
    setConfig(getDefaultConfig())
  }, [])

  return {
    selectedColumns: config.selectedColumns,
    configSectionCollapsed: config.configSectionCollapsed,
    aggregationType: config.aggregationType,
    availableFields,
    unselectedFields,
    isDataLoaded,
    addColumn,
    removeColumn,
    reorderColumns: handleReorderColumns,
    toggleColumnHourlyRate,
    toggleConfigSection,
    setAggregationType,
    resetToDefaults
  }
}
