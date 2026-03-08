import { useCallback } from 'react'
import { usePersistedPageState } from '@/shared/persistence'

interface UsePercentChangeResult {
  /** Whether percentage change overlay is enabled */
  isEnabled: boolean
  /** Set percentage change on/off (persists to localStorage) */
  setEnabled: (enabled: boolean) => void
  /** Convenience toggle function */
  toggle: () => void
}

/**
 * Hook to manage percentage change toggle state with page-scoped localStorage persistence.
 */
export function usePercentChange(
  metricKey: string,
  pageScope: string
): UsePercentChangeResult {
  const [isEnabled, setIsEnabled] = usePersistedPageState<boolean>(
    pageScope, `percentChange:${metricKey}`, false
  )

  const setEnabled = useCallback(
    (enabled: boolean) => setIsEnabled(enabled),
    [setIsEnabled]
  )

  const toggle = useCallback(() => {
    setIsEnabled((prev) => !prev)
  }, [setIsEnabled])

  return {
    isEnabled,
    setEnabled,
    toggle,
  }
}
