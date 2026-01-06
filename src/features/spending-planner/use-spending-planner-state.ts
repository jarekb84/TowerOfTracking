/**
 * Spending Planner State Hook
 *
 * Main orchestration hook that combines all state management
 * for the spending planner feature.
 */

/* eslint-disable max-lines-per-function */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import type {
  SpendingPlannerState,
  CurrencyIncome,
  StoneIncomeBreakdown,
  GemIncomeBreakdown,
  TimelineViewConfig,
  TimelineData,
  CurrencyId,
  LookbackPeriod,
} from './types'
import {
  loadSpendingPlannerState,
} from './persistence/spending-planner-persistence'
import { useSpendingPlannerPersistence } from './persistence/use-spending-planner-persistence'
import { useIncomeState } from './income/use-income-state'
import { useDerivedIncome } from './income/use-derived-income'
import { useEventQueue } from './events/use-event-queue'
import { useTimelineView } from './timeline/use-timeline-view'
import { calculateTimeline } from './calculations/timeline-calculator'
import { toggleCurrencyEnabled, CURRENCY_CONFIGS } from './currencies/currency-config'
import type { AddEventData, EditEventData } from './events/event-queue-panel'

interface UseSpendingPlannerStateReturn {
  /** Current state */
  state: SpendingPlannerState
  /** Timeline calculation result */
  timelineData: TimelineData
  /** Income state handlers */
  income: ReturnType<typeof useIncomeState>
  /** Derived income state */
  derivedIncome: ReturnType<typeof useDerivedIncome>
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
  /** Update lookback period for derived income calculation */
  handleLookbackPeriodChange: (period: LookbackPeriod) => void
  /** Toggle event chain state */
  handleToggleChain: (eventId: string) => void
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

  // Derived income from run data
  const derivedIncome = useDerivedIncome(state.incomeDerivedPreferences.lookbackPeriod)

  // Track the last synced values to avoid re-syncing on every render
  const lastSyncedRef = useRef<{
    totalRuns: number
    lookbackPeriod: LookbackPeriod
  } | null>(null)

  // Sync derived values only when run data or lookback period actually changes
  // This runs once on mount and when runs are added/removed or lookback changes
  useEffect(() => {
    const currentKey = {
      totalRuns: derivedIncome.totalRuns,
      lookbackPeriod: state.incomeDerivedPreferences.lookbackPeriod,
    }

    // Skip if we've already synced for this data
    if (
      lastSyncedRef.current &&
      lastSyncedRef.current.totalRuns === currentKey.totalRuns &&
      lastSyncedRef.current.lookbackPeriod === currentKey.lookbackPeriod
    ) {
      return
    }

    // Mark as synced before updating to prevent re-entry
    lastSyncedRef.current = currentKey

    // Batch update all derived values in a single state update
    setState((prev) => {
      const updatedIncomes = prev.incomes.map((incomeItem) => {
        const config = CURRENCY_CONFIGS[incomeItem.currencyId]
        if (!config.isDerivable) return incomeItem

        const incomeResult = derivedIncome.incomeResults[incomeItem.currencyId]
        const growthResult = derivedIncome.growthRateResults[incomeItem.currencyId]

        const derivedWeeklyIncome = incomeResult?.weeklyIncome ?? null
        const derivedGrowthRate = growthResult?.growthRatePercent ?? null

        const newIncome = {
          ...incomeItem,
          derivedWeeklyIncome,
          derivedGrowthRate,
        }

        // If source is derived, also update the active values
        if (incomeItem.weeklyIncomeSource === 'derived' && derivedWeeklyIncome !== null) {
          newIncome.weeklyIncome = derivedWeeklyIncome
        }
        if (incomeItem.growthRateSource === 'derived' && derivedGrowthRate !== null) {
          newIncome.growthRatePercent = derivedGrowthRate
        }

        return newIncome
      })

      return { ...prev, incomes: updatedIncomes }
    })
  }, [derivedIncome.totalRuns, derivedIncome.incomeResults, derivedIncome.growthRateResults, state.incomeDerivedPreferences.lookbackPeriod])

  // Update lookback period
  const handleLookbackPeriodChange = useCallback((period: LookbackPeriod) => {
    setState((prev) => ({
      ...prev,
      incomeDerivedPreferences: { ...prev.incomeDerivedPreferences, lookbackPeriod: period },
    }))
  }, [])

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

  // Toggle event chain state
  const handleToggleChain = useCallback(
    (eventId: string) => {
      const newEvents = eventQueue.toggleEventChain(state.events, eventId)
      if (newEvents) {
        setState((prev) => ({ ...prev, events: newEvents }))
      }
    },
    [eventQueue, state.events]
  )

  // Calculate timeline with proration for week 0
  const timelineData = useMemo(() => {
    return calculateTimeline(state.incomes, state.events, state.timelineConfig.weeks, {
      startDate: timeline.startDate,
      week0ProrationFactor: timeline.currentWeekProrationFactor,
    })
  }, [state.incomes, state.events, state.timelineConfig.weeks, timeline.startDate, timeline.currentWeekProrationFactor])

  return {
    state,
    timelineData,
    income,
    derivedIncome,
    eventQueue,
    timeline,
    toggleIncomePanel,
    handleToggleCurrency,
    handleAddEvent,
    handleRemoveEvent,
    handleEditEvent,
    handleCloneEvent,
    handleDrop,
    handleLookbackPeriodChange,
    handleToggleChain,
  }
}
