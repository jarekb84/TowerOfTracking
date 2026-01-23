/**
 * Spending Planner Persistence Hook
 *
 * Provides debounced auto-save functionality for spending planner state.
 */

import { useEffect, useRef, useCallback } from 'react'
import { saveSpendingPlannerState } from './spending-planner-persistence'
import type { SpendingPlannerState } from '../types'

const DEBOUNCE_MS = 500

/**
 * Hook that auto-saves spending planner state with debouncing.
 * Saves changes to localStorage after a 500ms delay.
 *
 * @param state - The current spending planner state to persist
 */
export function useSpendingPlannerPersistence(state: SpendingPlannerState): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  // Debounced save function
  const debouncedSave = useCallback((stateToSave: SpendingPlannerState) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      saveSpendingPlannerState(stateToSave)
    }, DEBOUNCE_MS)
  }, [])

  // Auto-save on state changes (skip first render to avoid saving initial load)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    debouncedSave(state)
  }, [state, debouncedSave])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}
