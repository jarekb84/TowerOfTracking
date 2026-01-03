/**
 * Timeline View Hook
 *
 * Manages timeline view state including week count and scroll position.
 */

import { useState, useCallback, useMemo } from 'react'
import type { TimelineWeeks, TimelineViewConfig } from '../types'

interface UseTimelineViewReturn {
  /** Current timeline configuration */
  config: TimelineViewConfig
  /** Update week count */
  setWeeks: (weeks: TimelineWeeks) => void
  /** Available week options */
  weekOptions: TimelineWeeks[]
  /** Start date for timeline */
  startDate: Date
}

interface UseTimelineViewProps {
  initialConfig: TimelineViewConfig
  onConfigChange: (config: TimelineViewConfig) => void
}

/**
 * Hook for managing timeline view state.
 */
export function useTimelineView({
  initialConfig,
  onConfigChange,
}: UseTimelineViewProps): UseTimelineViewReturn {
  const [config, setConfig] = useState<TimelineViewConfig>(initialConfig)

  const setWeeks = useCallback(
    (weeks: TimelineWeeks) => {
      const newConfig = { ...config, weeks }
      setConfig(newConfig)
      onConfigChange(newConfig)
    },
    [config, onConfigChange]
  )

  const weekOptions: TimelineWeeks[] = useMemo(() => [4, 8, 12, 26, 52], [])

  // Start from the current week
  const startDate = useMemo(() => {
    const now = new Date()
    // Round to start of current week
    now.setHours(0, 0, 0, 0)
    return now
  }, [])

  return {
    config,
    setWeeks,
    weekOptions,
    startDate,
  }
}
