/**
 * Spending Planner Persistence
 *
 * Handles loading, saving, and validating spending planner state
 * to/from localStorage.
 */

import type {
  SpendingPlannerState,
  CurrencyIncome,
  SpendingEvent,
  StoneIncomeBreakdown,
  TimelineViewConfig,
} from '../types'
import {
  CURRENCY_ORDER,
  createDefaultIncome,
  createDefaultStoneBreakdown,
  isValidCurrencyId,
} from '../currencies/currency-config'

const STORAGE_KEY = 'tower-tracking-spending-planner'

/**
 * Create default spending planner state.
 */
export function getDefaultState(): SpendingPlannerState {
  return {
    incomes: CURRENCY_ORDER.map(createDefaultIncome),
    stoneIncomeBreakdown: createDefaultStoneBreakdown(),
    events: [],
    timelineConfig: { weeks: 12 },
    incomePanelCollapsed: false,
    lastUpdated: Date.now(),
  }
}

/**
 * Load spending planner state from localStorage.
 * Returns default state if none exists or if parsing fails.
 * NOTE: incomePanelCollapsed always returns true (collapsed) on load.
 */
export function loadSpendingPlannerState(): SpendingPlannerState {
  if (typeof window === 'undefined') {
    return getDefaultState()
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return getDefaultState()
    }

    const parsed = JSON.parse(stored) as SpendingPlannerState
    const validated = validateStoredState(parsed)

    // Always start with collapsed income panel
    return {
      ...validated,
      incomePanelCollapsed: true,
    }
  } catch (error) {
    console.warn('Failed to load spending planner state from localStorage:', error)
    return getDefaultState()
  }
}

/**
 * Save spending planner state to localStorage.
 */
export function saveSpendingPlannerState(state: SpendingPlannerState): void {
  if (typeof window === 'undefined') return

  try {
    const updated = {
      ...state,
      lastUpdated: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save spending planner state to localStorage:', error)
  }
}

/**
 * Clear spending planner state from localStorage.
 */
export function clearSpendingPlannerState(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear spending planner state from localStorage:', error)
  }
}

/**
 * Validate stored state has all required fields with correct types.
 */
function validateStoredState(state: unknown): SpendingPlannerState {
  const defaultState = getDefaultState()

  if (!state || typeof state !== 'object') {
    return defaultState
  }

  const s = state as Partial<SpendingPlannerState>

  // Validate incomes array
  if (!Array.isArray(s.incomes) || !s.incomes.every(isValidIncome)) {
    return defaultState
  }

  // Validate stone breakdown
  if (!isValidStoneBreakdown(s.stoneIncomeBreakdown)) {
    return defaultState
  }

  // Validate events array
  if (!Array.isArray(s.events) || !s.events.every(isValidEvent)) {
    return defaultState
  }

  // Validate timeline config
  if (!isValidTimelineConfig(s.timelineConfig)) {
    return defaultState
  }

  // Validate boolean
  if (typeof s.incomePanelCollapsed !== 'boolean') {
    return defaultState
  }

  return s as SpendingPlannerState
}

/**
 * Type guard for CurrencyIncome.
 */
function isValidIncome(value: unknown): value is CurrencyIncome {
  if (!value || typeof value !== 'object') return false

  const v = value as Partial<CurrencyIncome>
  return (
    typeof v.currencyId === 'string' &&
    isValidCurrencyId(v.currencyId) &&
    typeof v.currentBalance === 'number' &&
    typeof v.weeklyIncome === 'number' &&
    typeof v.growthRatePercent === 'number'
  )
}

/**
 * Type guard for StoneIncomeBreakdown.
 */
function isValidStoneBreakdown(value: unknown): value is StoneIncomeBreakdown {
  if (!value || typeof value !== 'object') return false

  const v = value as Partial<StoneIncomeBreakdown>
  return (
    typeof v.weeklyChallenges === 'number' &&
    typeof v.eventStore === 'number' &&
    typeof v.tournamentResults === 'number'
  )
}

/**
 * Type guard for SpendingEvent.
 */
function isValidEvent(value: unknown): value is SpendingEvent {
  if (!value || typeof value !== 'object') return false

  const v = value as Partial<SpendingEvent>
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.currencyId === 'string' &&
    isValidCurrencyId(v.currencyId) &&
    typeof v.amount === 'number' &&
    typeof v.priority === 'number' &&
    (v.durationDays === undefined || typeof v.durationDays === 'number')
  )
}

/**
 * Type guard for TimelineViewConfig.
 */
function isValidTimelineConfig(value: unknown): value is TimelineViewConfig {
  if (!value || typeof value !== 'object') return false

  const v = value as Partial<TimelineViewConfig>
  return (
    typeof v.weeks === 'number' &&
    (v.weeks === 4 || v.weeks === 8 || v.weeks === 12 || v.weeks === 26 || v.weeks === 52)
  )
}
