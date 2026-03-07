import { useState, useEffect, useCallback } from 'react'
import type { TimePeriod, TimePeriodConfig } from '../chart-types'
import {
  loadPersistedDuration,
  savePersistedDuration,
} from './interval-persistence'

interface UseDurationSelectorResult {
  selectedPeriod: TimePeriod
  setSelectedPeriod: (period: TimePeriod) => void
}

/**
 * Hook to manage duration/period selection with localStorage persistence.
 * Hydrates from localStorage on mount and auto-resets when the selected
 * period is no longer available in the provided configs.
 */
export function useDurationSelector(
  defaultPeriod: TimePeriod,
  availablePeriodConfigs: TimePeriodConfig[]
): UseDurationSelectorResult {
  const [selectedPeriod, setSelectedPeriodState] = useState<TimePeriod>(defaultPeriod)

  // Hydrate duration from localStorage on mount
  useEffect(() => {
    const persisted = loadPersistedDuration()
    if (persisted) {
      setSelectedPeriodState(persisted)
    }
  }, [])

  // Reset period if current selection is not available
  useEffect(() => {
    const isCurrentPeriodAvailable = availablePeriodConfigs.some(
      (config) => config.period === selectedPeriod
    )
    if (!isCurrentPeriodAvailable && availablePeriodConfigs.length > 0) {
      setSelectedPeriodState(availablePeriodConfigs[0].period)
    }
  }, [availablePeriodConfigs, selectedPeriod])

  // Wrap setter to also persist
  const setSelectedPeriod = useCallback((period: TimePeriod) => {
    setSelectedPeriodState(period)
    savePersistedDuration(period)
  }, [])

  return {
    selectedPeriod,
    setSelectedPeriod,
  }
}
