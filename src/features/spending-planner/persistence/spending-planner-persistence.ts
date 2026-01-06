/**
 * Spending Planner Persistence
 *
 * Handles loading, saving, and validating spending planner state
 * to/from localStorage.
 */

/* eslint-disable max-statements */
import type {
  SpendingPlannerState,
  CurrencyIncome,
  SpendingEvent,
  StoneIncomeBreakdown,
  GemIncomeBreakdown,
  TimelineViewConfig,
  IncomeDerivedPreferences,
  IncomeSource,
} from '../types'
import { CurrencyId } from '../types'
import {
  CURRENCY_ORDER,
  createDefaultIncome,
  createDefaultStoneBreakdown,
  createDefaultGemBreakdown,
  isValidCurrencyId,
  getDefaultIncomeSource,
} from '../currencies/currency-config'

const STORAGE_KEY = 'tower-tracking-spending-planner'

/**
 * Create default income derived preferences.
 */
function createDefaultIncomeDerivedPreferences(): IncomeDerivedPreferences {
  return {
    lookbackPeriod: '3mo',
  }
}

/**
 * Create default spending planner state.
 */
export function getDefaultState(): SpendingPlannerState {
  return {
    incomes: CURRENCY_ORDER.map(createDefaultIncome),
    stoneIncomeBreakdown: createDefaultStoneBreakdown(),
    gemIncomeBreakdown: createDefaultGemBreakdown(),
    events: [],
    timelineConfig: { weeks: 12, layoutMode: 'columns' },
    incomePanelCollapsed: false,
    enabledCurrencies: [...CURRENCY_ORDER],
    incomeDerivedPreferences: createDefaultIncomeDerivedPreferences(),
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

  // Migrate incomes to ensure all currencies are present
  const migratedIncomes = migrateIncomes(s.incomes)

  // Validate stone breakdown (with migration for new purchasedWithMoney field)
  const stoneBreakdown = migrateStoneBreakdown(s.stoneIncomeBreakdown)
  if (!stoneBreakdown) {
    return defaultState
  }

  // Validate gem breakdown (with migration for missing field)
  const gemBreakdown = migrateGemBreakdown(s.gemIncomeBreakdown)

  // Validate events array
  if (!Array.isArray(s.events) || !s.events.every(isValidEvent)) {
    return defaultState
  }

  // Migrate events to include lockedToEventId field
  const migratedEvents = migrateEvents(s.events)

  // Migrate timeline config (adds layoutMode if missing)
  const timelineConfig = migrateTimelineConfig(s.timelineConfig)
  if (!timelineConfig) {
    return defaultState
  }

  // Validate boolean
  if (typeof s.incomePanelCollapsed !== 'boolean') {
    return defaultState
  }

  // Migrate enabledCurrencies: default all to enabled if missing
  const enabledCurrencies = migrateEnabledCurrencies(s.enabledCurrencies)

  // Migrate incomeDerivedPreferences: add default if missing
  const incomeDerivedPreferences = migrateIncomeDerivedPreferences(s.incomeDerivedPreferences)

  return {
    ...s,
    incomes: migratedIncomes,
    stoneIncomeBreakdown: stoneBreakdown,
    gemIncomeBreakdown: gemBreakdown,
    events: migratedEvents,
    timelineConfig,
    enabledCurrencies,
    incomeDerivedPreferences,
  } as SpendingPlannerState
}

/**
 * Migrate incomeDerivedPreferences or create default if missing/invalid.
 */
function migrateIncomeDerivedPreferences(value: unknown): IncomeDerivedPreferences {
  if (!value || typeof value !== 'object') {
    return createDefaultIncomeDerivedPreferences()
  }

  const v = value as Partial<IncomeDerivedPreferences>

  // Validate lookbackPeriod
  const validPeriods = ['3mo', '6mo', 'all'] as const
  const lookbackPeriod = validPeriods.includes(v.lookbackPeriod as typeof validPeriods[number])
    ? v.lookbackPeriod!
    : '3mo'

  return { lookbackPeriod }
}

/**
 * Migrate enabledCurrencies or create default if missing/invalid.
 * Ensures all values are valid CurrencyIds and defaults to all enabled.
 */
function migrateEnabledCurrencies(value: unknown): CurrencyId[] {
  if (!Array.isArray(value)) {
    // Missing or invalid - default all currencies to enabled
    return [...CURRENCY_ORDER]
  }

  // Filter to only valid currency IDs
  const validCurrencies = value.filter(
    (id): id is CurrencyId => typeof id === 'string' && isValidCurrencyId(id)
  )

  // If empty after filtering, return all currencies enabled
  if (validCurrencies.length === 0) {
    return [...CURRENCY_ORDER]
  }

  return validCurrencies
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
 * Migrate a single income object to include new derived income fields.
 */
function migrateIncomeFields(income: Partial<CurrencyIncome>): CurrencyIncome {
  const currencyId = income.currencyId as CurrencyId
  const defaultSource = getDefaultIncomeSource(currencyId)

  return {
    currencyId,
    currentBalance: income.currentBalance ?? 0,
    weeklyIncome: income.weeklyIncome ?? 0,
    growthRatePercent: income.growthRatePercent ?? 0,
    // New fields - default to derived for derivable currencies, manual for others
    weeklyIncomeSource: (income.weeklyIncomeSource as IncomeSource) ?? defaultSource,
    growthRateSource: (income.growthRateSource as IncomeSource) ?? defaultSource,
    derivedWeeklyIncome: income.derivedWeeklyIncome ?? null,
    derivedGrowthRate: income.derivedGrowthRate ?? null,
  }
}

/**
 * Migrate incomes array to ensure all currencies are present.
 * Adds missing currencies with default values and migrates existing incomes
 * to include new derived income fields.
 */
function migrateIncomes(incomes: CurrencyIncome[]): CurrencyIncome[] {
  const existingCurrencyIds = new Set(incomes.map((i) => i.currencyId))

  // Migrate existing incomes to include new fields
  const migratedExisting = incomes.map(migrateIncomeFields)

  // Add missing currencies
  const missingIncomes = CURRENCY_ORDER
    .filter((id) => !existingCurrencyIds.has(id))
    .map(createDefaultIncome)

  // Return in CURRENCY_ORDER for consistent ordering
  const allIncomes = [...migratedExisting, ...missingIncomes]
  return CURRENCY_ORDER.map(
    (id) => allIncomes.find((i) => i.currencyId === id)!
  )
}

/**
 * Migrate stone breakdown to include purchasedWithMoney field.
 * Returns null if the base structure is invalid.
 */
function migrateStoneBreakdown(value: unknown): StoneIncomeBreakdown | null {
  if (!value || typeof value !== 'object') return null

  const v = value as Partial<StoneIncomeBreakdown>

  // Check required base fields
  if (
    typeof v.weeklyChallenges !== 'number' ||
    typeof v.eventStore !== 'number' ||
    typeof v.tournamentResults !== 'number'
  ) {
    return null
  }

  // Migrate: add purchasedWithMoney if missing
  return {
    weeklyChallenges: v.weeklyChallenges,
    eventStore: v.eventStore,
    tournamentResults: v.tournamentResults,
    purchasedWithMoney: typeof v.purchasedWithMoney === 'number' ? v.purchasedWithMoney : 0,
  }
}

/** Helper to safely extract a number field with default */
function getNumberField(obj: Record<string, unknown>, field: string, defaultValue = 0): number {
  const value = obj[field]
  return typeof value === 'number' ? value : defaultValue
}

/**
 * Migrate gem breakdown or create default if missing/invalid.
 */
function migrateGemBreakdown(value: unknown): GemIncomeBreakdown {
  if (!value || typeof value !== 'object') {
    return createDefaultGemBreakdown()
  }

  const v = value as Record<string, unknown>

  // Return migrated structure with defaults for missing fields
  return {
    adGems: getNumberField(v, 'adGems'),
    floatingGems: getNumberField(v, 'floatingGems'),
    storeDailyGems: getNumberField(v, 'storeDailyGems'),
    storeWeeklyGems: getNumberField(v, 'storeWeeklyGems'),
    missionsDailyCompletion: getNumberField(v, 'missionsDailyCompletion'),
    missionsWeeklyChests: getNumberField(v, 'missionsWeeklyChests'),
    tournaments: getNumberField(v, 'tournaments'),
    biweeklyEventShop: getNumberField(v, 'biweeklyEventShop'),
    guildWeeklyChests: getNumberField(v, 'guildWeeklyChests'),
    guildSeasonalStore: getNumberField(v, 'guildSeasonalStore'),
    offerWalls: getNumberField(v, 'offerWalls'),
    purchasedWithMoney: getNumberField(v, 'purchasedWithMoney'),
  }
}

/**
 * Type guard for SpendingEvent (base validation, migration adds lockedToEventId).
 */
/* eslint-disable-next-line complexity */
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
    (v.durationDays === undefined || typeof v.durationDays === 'number') &&
    // lockedToEventId can be null, undefined (for migration), or string
    (v.lockedToEventId === null || v.lockedToEventId === undefined || typeof v.lockedToEventId === 'string')
  )
}

/**
 * Migrate events to include lockedToEventId field.
 * Defaults missing field to null (free-floating).
 */
function migrateEvents(events: SpendingEvent[]): SpendingEvent[] {
  return events.map((event) => ({
    ...event,
    lockedToEventId: event.lockedToEventId ?? null,
  }))
}

/**
 * Type guard for TimelineViewConfig base structure (weeks only).
 * layoutMode is handled by migration.
 */
function isValidTimelineConfigBase(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false

  const v = value as Partial<TimelineViewConfig>
  return (
    typeof v.weeks === 'number' &&
    (v.weeks === 4 || v.weeks === 8 || v.weeks === 12 || v.weeks === 26 || v.weeks === 52)
  )
}

/**
 * Migrate TimelineViewConfig to ensure layoutMode is present.
 * Adds default 'columns' layout if missing.
 */
function migrateTimelineConfig(value: unknown): TimelineViewConfig | null {
  if (!isValidTimelineConfigBase(value)) return null

  const v = value as Partial<TimelineViewConfig>

  // Validate layoutMode if present, default to 'columns' if missing
  const layoutMode = v.layoutMode === 'columns' || v.layoutMode === 'rows'
    ? v.layoutMode
    : 'columns'

  return {
    weeks: v.weeks!,
    layoutMode,
  }
}
