import { useState, useEffect, useCallback } from 'react'
import {
  loadPercentChangeEnabled,
  savePercentChangeEnabled,
} from './percent-change-persistence'

interface UsePercentChangeResult {
  /** Whether percentage change overlay is enabled */
  isEnabled: boolean
  /** Set percentage change on/off (persists to localStorage) */
  setEnabled: (enabled: boolean) => void
  /** Convenience toggle function */
  toggle: () => void
}

/**
 * Hook to manage percentage change toggle state with localStorage persistence.
 * Loads persisted value on mount and saves changes automatically.
 *
 * @param metricKey - Unique key to identify this chart's setting
 * @returns Percentage change state and setter functions
 */
export function usePercentChange(metricKey: string): UsePercentChangeResult {
  const [isEnabled, setIsEnabledState] = useState(false)

  // Load persisted value on mount (SSR-safe)
  useEffect(() => {
    const savedEnabled = loadPercentChangeEnabled(metricKey)
    setIsEnabledState(savedEnabled)
  }, [metricKey])

  // Handle enable/disable with persistence
  const setEnabled = useCallback(
    (enabled: boolean) => {
      setIsEnabledState(enabled)
      savePercentChangeEnabled(metricKey, enabled)
    },
    [metricKey]
  )

  // Convenience toggle
  const toggle = useCallback(() => {
    setEnabled(!isEnabled)
  }, [isEnabled, setEnabled])

  return {
    isEnabled,
    setEnabled,
    toggle,
  }
}
