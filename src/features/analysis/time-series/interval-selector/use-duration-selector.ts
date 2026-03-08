import { useEffect } from 'react'
import type { TimePeriod, TimePeriodConfig } from '../chart-types'
import { usePersistedPageState } from '@/shared/persistence'

interface UseDurationSelectorResult {
  selectedPeriod: TimePeriod
  setSelectedPeriod: (period: TimePeriod) => void
}

/**
 * Hook to manage duration/period selection with page-scoped localStorage persistence.
 * Hydrates from localStorage on mount and auto-resets when the selected
 * period is no longer available in the provided configs.
 */
export function useDurationSelector(
  defaultPeriod: TimePeriod,
  availablePeriodConfigs: TimePeriodConfig[],
  pageScope: string
): UseDurationSelectorResult {
  const [selectedPeriod, setSelectedPeriod] = usePersistedPageState<TimePeriod>(
    pageScope, 'duration', defaultPeriod
  )

  // Reset period if current selection is not available
  useEffect(() => {
    const isCurrentPeriodAvailable = availablePeriodConfigs.some(
      (config) => config.period === selectedPeriod
    )
    if (!isCurrentPeriodAvailable && availablePeriodConfigs.length > 0) {
      setSelectedPeriod(availablePeriodConfigs[0].period)
    }
  }, [availablePeriodConfigs, selectedPeriod, setSelectedPeriod])

  return {
    selectedPeriod,
    setSelectedPeriod,
  }
}
