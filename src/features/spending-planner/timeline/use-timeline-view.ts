/**
 * Timeline View Hook
 *
 * Manages timeline view state including week count, layout mode, and scroll position.
 */

import { useState, useCallback, useMemo } from 'react'
import type { TimelineWeeks, TimelineViewConfig, TimelineLayoutMode } from '../types'
import { getWeekStart, getCurrentWeekProrationFactor } from './timeline-utils'

interface UseTimelineViewReturn {
  /** Current timeline configuration */
  config: TimelineViewConfig
  /** Update week count */
  setWeeks: (weeks: TimelineWeeks) => void
  /** Update layout mode */
  setLayoutMode: (mode: TimelineLayoutMode) => void
  /** Available week options */
  weekOptions: TimelineWeeks[]
  /** Start date for timeline (Sunday of current week) */
  startDate: Date
  /** The actual current date */
  currentDate: Date
  /** Proration factor for current week's income (0 < factor <= 1) */
  currentWeekProrationFactor: number
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

  const setLayoutMode = useCallback(
    (layoutMode: TimelineLayoutMode) => {
      const newConfig = { ...config, layoutMode }
      setConfig(newConfig)
      onConfigChange(newConfig)
    },
    [config, onConfigChange]
  )

  const weekOptions: TimelineWeeks[] = useMemo(() => [4, 8, 12, 26, 52], [])

  // Current date for proration calculations
  const currentDate = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])

  // Start from Sunday of the current week
  const startDate = useMemo(() => getWeekStart(currentDate), [currentDate])

  // Proration factor for the current week's income
  const currentWeekProrationFactor = useMemo(
    () => getCurrentWeekProrationFactor(currentDate),
    [currentDate]
  )

  return {
    config,
    setWeeks,
    setLayoutMode,
    weekOptions,
    startDate,
    currentDate,
    currentWeekProrationFactor,
  }
}
