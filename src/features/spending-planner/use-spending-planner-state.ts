/**
 * Spending Planner State Hook
 *
 * Main orchestration hook that combines all state management
 * for the spending planner feature.
 */

import { useState, useCallback, useMemo } from 'react'
import type {
  SpendingPlannerState,
  CurrencyIncome,
  StoneIncomeBreakdown,
  GemIncomeBreakdown,
  TimelineViewConfig,
  TimelineData,
  CurrencyId,
} from './types'
import {
  loadSpendingPlannerState,
} from './persistence/spending-planner-persistence'
import { useSpendingPlannerPersistence } from './persistence/use-spending-planner-persistence'
import { useIncomeState } from './income/use-income-state'
import { useEventQueue } from './events/use-event-queue'
import { useTimelineView } from './timeline/use-timeline-view'
import { calculateTimeline } from './calculations/timeline-calculator'
import { toggleCurrencyEnabled } from './currencies/currency-config'
import type { AddEventData, EditEventData } from './events/event-queue-panel'

interface UseSpendingPlannerStateReturn {
  /** Current state */
  state: SpendingPlannerState
  /** Timeline calculation result */
  timelineData: TimelineData
  /** Income state handlers */
  income: ReturnType<typeof useIncomeState>
  /** Event queue handlers */
  eventQueue: ReturnType<typeof useEventQueue>
  /** Timeline view handlers */
  timeline: ReturnType<typeof useTimelineView>
  /** Toggle income panel collapse */
  toggleIncomePanel: () => void
  /** Toggle currency enabled state */
  handleToggleCurrency: (currencyId: CurrencyId) => void
  /** Add a new event */
  handleAddEvent: (data: AddEventData) => void
  /** Remove an event */
  handleRemoveEvent: (eventId: string) => void
  /** Edit an event */
  handleEditEvent: (data: EditEventData) => void
  /** Clone an event */
  handleCloneEvent: (eventId: string) => void
  /** Handle drag drop completion */
  handleDrop: () => void
}

/**
 * Main hook for spending planner state management.
 */
export function useSpendingPlannerState(): UseSpendingPlannerStateReturn {
  // Load initial state from localStorage
  const [state, setState] = useState<SpendingPlannerState>(() =>
    loadSpendingPlannerState()
  )

  // Auto-persist state changes
  useSpendingPlannerPersistence(state)

  // Income state management
  const income = useIncomeState({
    incomes: state.incomes,
    stoneBreakdown: state.stoneIncomeBreakdown,
    gemBreakdown: state.gemIncomeBreakdown,
    onIncomesChange: useCallback((incomes: CurrencyIncome[]) => {
      setState((prev) => ({ ...prev, incomes }))
    }, []),
    onStoneBreakdownChange: useCallback((stoneIncomeBreakdown: StoneIncomeBreakdown) => {
      setState((prev) => ({ ...prev, stoneIncomeBreakdown }))
    }, []),
    onGemBreakdownChange: useCallback((gemIncomeBreakdown: GemIncomeBreakdown) => {
      setState((prev) => ({ ...prev, gemIncomeBreakdown }))
    }, []),
  })

  // Event queue state management
  const eventQueue = useEventQueue()

  // Timeline view state
  const timeline = useTimelineView({
    initialConfig: state.timelineConfig,
    onConfigChange: useCallback((timelineConfig: TimelineViewConfig) => {
      setState((prev) => ({ ...prev, timelineConfig }))
    }, []),
  })

  // Toggle income panel collapse
  const toggleIncomePanel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      incomePanelCollapsed: !prev.incomePanelCollapsed,
    }))
  }, [])

  // Toggle currency enabled state
  const handleToggleCurrency = useCallback((currencyId: CurrencyId) => {
    setState((prev) => ({
      ...prev,
      enabledCurrencies: toggleCurrencyEnabled(prev.enabledCurrencies, currencyId),
    }))
  }, [])

  // Add event handler
  const handleAddEvent = useCallback(
    (data: AddEventData) => {
      const newEvents = eventQueue.addEvent(state.events, data)
      setState((prev) => ({ ...prev, events: newEvents }))
    },
    [eventQueue, state.events]
  )

  // Remove event handler
  const handleRemoveEvent = useCallback(
    (eventId: string) => {
      const newEvents = eventQueue.removeEvent(state.events, eventId)
      setState((prev) => ({ ...prev, events: newEvents }))
    },
    [eventQueue, state.events]
  )

  // Edit event handler
  const handleEditEvent = useCallback(
    (data: EditEventData) => {
      const { eventId, ...updates } = data
      const newEvents = eventQueue.updateEvent(state.events, eventId, updates)
      setState((prev) => ({ ...prev, events: newEvents }))
    },
    [eventQueue, state.events]
  )

  // Clone event handler
  const handleCloneEvent = useCallback(
    (eventId: string) => {
      const newEvents = eventQueue.cloneEvent(state.events, eventId)
      setState((prev) => ({ ...prev, events: newEvents }))
    },
    [eventQueue, state.events]
  )

  // Handle drop (reorder) completion
  const handleDrop = useCallback(() => {
    const newEvents = eventQueue.handleDrop(state.events)
    setState((prev) => ({ ...prev, events: newEvents }))
    eventQueue.handleDragEnd()
  }, [eventQueue, state.events])

  // Calculate timeline
  const timelineData = useMemo(() => {
    return calculateTimeline(
      state.incomes,
      state.events,
      state.timelineConfig.weeks,
      timeline.startDate
    )
  }, [state.incomes, state.events, state.timelineConfig.weeks, timeline.startDate])

  return {
    state,
    timelineData,
    income,
    eventQueue,
    timeline,
    toggleIncomePanel,
    handleToggleCurrency,
    handleAddEvent,
    handleRemoveEvent,
    handleEditEvent,
    handleCloneEvent,
    handleDrop,
  }
}
