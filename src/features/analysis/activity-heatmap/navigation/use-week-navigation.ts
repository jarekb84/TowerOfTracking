/**
 * Week Navigation Hook
 *
 * Manages week selection state and navigation (prev/next/latest) for the
 * activity heatmap. Derives available weeks from runs and auto-selects
 * the most recent week on initialization.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { WeekInfo } from '../types'
import { deriveAvailableWeeks, getDefaultWeek, canNavigateNext, canNavigatePrev } from './week-navigation'
import { isSameWeek } from '../week-utils'

export interface UseWeekNavigationReturn {
  selectedWeek: WeekInfo | null
  availableWeeks: WeekInfo[]
  canGoNext: boolean
  canGoPrev: boolean
  onPrevWeek: () => void
  onNextWeek: () => void
  onGoToLatest: () => void
}

/**
 * Hook for week navigation state derived from all runs.
 * Available weeks are derived from unfiltered runs so navigation
 * remains stable regardless of filter changes.
 */
export function useWeekNavigation(runs: ParsedGameRun[]): UseWeekNavigationReturn {
  const [selectedWeek, setSelectedWeek] = useState<WeekInfo | null>(null)
  const initializedRef = useRef(false)

  // Derive available weeks from ALL runs (unfiltered)
  const availableWeeks = useMemo(
    () => deriveAvailableWeeks(runs),
    [runs]
  )

  // Auto-select default week when availableWeeks changes
  useEffect(() => {
    if (availableWeeks.length === 0) {
      setSelectedWeek(null)
      initializedRef.current = false
      return
    }

    if (!initializedRef.current) {
      setSelectedWeek(getDefaultWeek(availableWeeks))
      initializedRef.current = true
      return
    }

    if (selectedWeek && !availableWeeks.some(w => isSameWeek(w.weekStart, selectedWeek.weekStart))) {
      setSelectedWeek(getDefaultWeek(availableWeeks))
    }
  }, [availableWeeks, selectedWeek])

  const canGoNext = useMemo(() => {
    if (!selectedWeek) return false
    return canNavigateNext(selectedWeek.weekStart, availableWeeks)
  }, [selectedWeek, availableWeeks])

  const canGoPrev = useMemo(() => {
    if (!selectedWeek) return false
    return canNavigatePrev(selectedWeek.weekStart, availableWeeks)
  }, [selectedWeek, availableWeeks])

  const onNextWeek = useCallback(() => {
    if (!selectedWeek || !canGoNext) return
    const currentIndex = availableWeeks.findIndex(
      w => isSameWeek(w.weekStart, selectedWeek.weekStart)
    )
    if (currentIndex > 0) {
      setSelectedWeek(availableWeeks[currentIndex - 1])
    }
  }, [selectedWeek, canGoNext, availableWeeks])

  const onPrevWeek = useCallback(() => {
    if (!selectedWeek || !canGoPrev) return
    const currentIndex = availableWeeks.findIndex(
      w => isSameWeek(w.weekStart, selectedWeek.weekStart)
    )
    if (currentIndex >= 0 && currentIndex < availableWeeks.length - 1) {
      setSelectedWeek(availableWeeks[currentIndex + 1])
    }
  }, [selectedWeek, canGoPrev, availableWeeks])

  const onGoToLatest = useCallback(() => {
    const latest = getDefaultWeek(availableWeeks)
    if (latest) {
      setSelectedWeek(latest)
    }
  }, [availableWeeks])

  return {
    selectedWeek,
    availableWeeks,
    canGoNext,
    canGoPrev,
    onPrevWeek,
    onNextWeek,
    onGoToLatest,
  }
}
