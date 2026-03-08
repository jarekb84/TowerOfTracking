import type { TimePeriod } from '../chart-types'
import type { TrendWindowValue } from './moving-average-types'
import { getWindowSize } from './moving-average-types'
import { usePersistedPageState } from '@/shared/persistence'

interface UseMovingAverageResult {
  /** Current trend window value ('none' or period-specific string like '7d') */
  trendWindow: TrendWindowValue
  /** Update trend window value (persists to localStorage) */
  setTrendWindow: (value: TrendWindowValue) => void
  /** Numeric window size for calculation, null when 'none' */
  windowSize: number | null
  /** Whether trend line is enabled (not 'none') */
  isEnabled: boolean
}

/**
 * Hook to manage trend window state with page-scoped localStorage persistence.
 * Values are stored per metric + period combination within the page scope.
 */
export function useMovingAverage(
  metricKey: string,
  period: TimePeriod,
  pageScope: string
): UseMovingAverageResult {
  const [trendWindow, setTrendWindow] = usePersistedPageState<TrendWindowValue>(
    pageScope, `movingAverage:${metricKey}:${period}`, 'none'
  )

  return {
    trendWindow,
    setTrendWindow,
    windowSize: getWindowSize(trendWindow),
    isEnabled: trendWindow !== 'none',
  }
}
