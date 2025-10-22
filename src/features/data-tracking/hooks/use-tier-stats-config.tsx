import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ParsedGameRun } from '../types/game-run.types'
import type {
  TierStatsConfig,
  TierStatsColumnConfig,
  AvailableField
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

  // Available fields
  availableFields: AvailableField[]
  unselectedFields: AvailableField[]

  // Actions
  addColumn: (fieldName: string) => void
  removeColumn: (fieldName: string) => void
  reorderColumns: (fromIndex: number, toIndex: number) => void
  toggleColumnHourlyRate: (fieldName: string) => void
  toggleConfigSection: () => void
  resetToDefaults: () => void
}

/**
 * Hook for managing tier stats configuration state with localStorage persistence
 */
export function useTierStatsConfig(runs: ParsedGameRun[]): UseTierStatsConfigReturn {
  // Discover available fields from runs data
  const availableFields = useMemo(() => discoverAvailableFields(runs), [runs])

  // Load initial configuration from localStorage
  const [config, setConfig] = useState<TierStatsConfig>(() => {
    const loaded = loadTierStatsConfig()
    // Validate against current data
    return {
      ...loaded,
      selectedColumns: validateColumnConfig(loaded.selectedColumns, availableFields)
    }
  })

  // Persist to localStorage whenever config changes
  useEffect(() => {
    saveTierStatsConfig(config)
  }, [config])

  // Revalidate columns when available fields change
  useEffect(() => {
    setConfig(prev => {
      const validated = validateColumnConfig(prev.selectedColumns, availableFields)
      // Only update if validation changed something
      if (validated.length !== prev.selectedColumns.length) {
        return { ...prev, selectedColumns: validated }
      }
      return prev
    })
  }, [availableFields])

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

  // Reset configuration to defaults
  const resetToDefaults = useCallback(() => {
    setConfig(getDefaultConfig())
  }, [])

  return {
    selectedColumns: config.selectedColumns,
    configSectionCollapsed: config.configSectionCollapsed,
    availableFields,
    unselectedFields,
    addColumn,
    removeColumn,
    reorderColumns: handleReorderColumns,
    toggleColumnHourlyRate,
    toggleConfigSection,
    resetToDefaults
  }
}
