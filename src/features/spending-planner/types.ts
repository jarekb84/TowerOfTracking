/**
 * Spending Planner Types
 *
 * Core type definitions for the spending planner feature.
 * Supports planning tower upgrades across multiple currencies.
 */

// =============================================================================
// Currency System
// =============================================================================

/**
 * Supported currency identifiers.
 * Extensible enum - add new currencies here when needed.
 * Using enum instead of union type for better type safety and refactoring support.
 */
export enum CurrencyId {
  Coins = 'coins',
  Stones = 'stones',
  RerollShards = 'rerollShards',
  Gems = 'gems',
}

/**
 * Configuration for a currency type.
 * Each currency has unique display and input characteristics.
 */
export interface CurrencyConfig {
  /** Unique identifier for the currency */
  id: CurrencyId
  /** Human-readable name (e.g., "Coins", "Stones") */
  displayName: string
  /** Shorter name for timeline display where space is limited (defaults to displayName) */
  timelineName?: string
  /** Short abbreviation for compact display (e.g., "c", "st") */
  abbreviation: string
  /** Tailwind color class for visual distinction */
  color: string
  /** Whether this currency needs a unit selector (K, M, B, T, etc.) */
  hasUnitSelector: boolean
  /** Whether income can be derived from run data (true for Coins, RerollShards) */
  isDerivable: boolean
}

// =============================================================================
// Income Configuration
// =============================================================================

/**
 * Source of income/growth rate value.
 * - 'derived': Automatically calculated from run data
 * - 'manual': Manually entered by user
 */
export type IncomeSource = 'derived' | 'manual'

/**
 * Lookback period for derived calculations.
 * Controls how much historical data is used for growth rate calculation.
 */
export type LookbackPeriod = '3mo' | '6mo' | 'all'

/**
 * Income configuration for a single currency.
 * Tracks current balance and weekly income with growth projections.
 */
export interface CurrencyIncome {
  /** Which currency this income belongs to */
  currencyId: CurrencyId
  /** Current balance of this currency */
  currentBalance: number
  /** Weekly income (sum of all sources) - active value used for projections */
  weeklyIncome: number
  /** Weekly growth rate as a percentage (e.g., 5 for 5%) - active value used for projections */
  growthRatePercent: number
  /** Source of weekly income value ('derived' or 'manual') */
  weeklyIncomeSource: IncomeSource
  /** Source of growth rate value ('derived' or 'manual') */
  growthRateSource: IncomeSource
  /** Derived weekly income from run data (stored separately from active value) */
  derivedWeeklyIncome: number | null
  /** Derived growth rate from run data (stored separately from active value) */
  derivedGrowthRate: number | null
}

/**
 * Breakdown of stone income sources.
 * Stones come from multiple fixed sources per week.
 */
export interface StoneIncomeBreakdown {
  /** Stones from weekly challenges (per week) */
  weeklyChallenges: number
  /** Stones from event store (per week) */
  eventStore: number
  /** Stones from tournament results (per week) */
  tournamentResults: number
  /** Stones purchased with real money (per week average) */
  purchasedWithMoney: number
}

/**
 * Breakdown of gem income sources.
 * Gems come from various in-game activities.
 */
export interface GemIncomeBreakdown {
  /** Gems from watching ads */
  adGems: number
  /** Floating gems (Bob) collected during runs */
  floatingGems: number
  /** Free daily gems from store */
  storeDailyGems: number
  /** Free weekly gems from store (web) */
  storeWeeklyGems: number
  /** Gems from daily mission completion */
  missionsDailyCompletion: number
  /** Gems from weekly mission chests */
  missionsWeeklyChests: number
  /** Gems from tournament participation */
  tournaments: number
  /** Gems from biweekly event shop */
  biweeklyEventShop: number
  /** Gems from guild weekly chests */
  guildWeeklyChests: number
  /** Gems from guild seasonal store */
  guildSeasonalStore: number
  /** Gems from offer walls/TapJoy */
  offerWalls: number
  /** Gems purchased with real money */
  purchasedWithMoney: number
}

// =============================================================================
// Spending Events
// =============================================================================

/**
 * A planned spending event (upgrade, unlock, etc.).
 * Events are processed in priority order.
 */
export interface SpendingEvent {
  /** Unique identifier for the event */
  id: string
  /** User-defined name (e.g., "Unlock Damage Mastery") */
  name: string
  /** Which currency this event costs */
  currencyId: CurrencyId
  /** Cost amount in the specified currency */
  amount: number
  /** Optional duration in days (for labs) */
  durationDays?: number
  /** Priority order (lower = higher priority) */
  priority: number
}

// =============================================================================
// Timeline Results
// =============================================================================

/**
 * Result of timeline calculation for a single event.
 * Indicates when an event can be afforded and executed.
 */
export interface TimelineEvent {
  /** The original spending event */
  event: SpendingEvent
  /** Week number when the event triggers (0 = current week) */
  triggerWeek: number
  /** Calculated date when the event triggers */
  triggerDate: Date
  /** End date for events with duration (labs) */
  endDate?: Date
  /** Balance of the relevant currency at trigger time */
  balanceAtTrigger: number
}

/**
 * Complete timeline calculation result.
 * Contains projected balances and scheduled events.
 */
export interface TimelineData {
  /** Timeline events with trigger dates */
  events: TimelineEvent[]
  /** Projected balance per week for each currency */
  balancesByWeek: Map<CurrencyId, number[]>
  /** Projected income per week for each currency (with growth applied) */
  incomeByWeek: Map<CurrencyId, number[]>
  /** Total expenditure per week for each currency */
  expenditureByWeek: Map<CurrencyId, number[]>
  /** Events that cannot be afforded within the timeline */
  unaffordableEvents: SpendingEvent[]
}

// =============================================================================
// Timeline View Configuration
// =============================================================================

/**
 * Available timeline duration options in weeks.
 */
export type TimelineWeeks = 4 | 8 | 12 | 26 | 52

/**
 * Timeline layout modes for displaying data.
 * - 'columns': 3 sub-columns per week (Inc, Exp, Balance), currencies as rows
 * - 'rows': Currencies as headers with sub-rows (Prior Balance, +Income, -Spending, =Balance)
 */
export type TimelineLayoutMode = 'columns' | 'rows'

/**
 * Timeline view state configuration.
 */
export interface TimelineViewConfig {
  /** Number of weeks to display */
  weeks: TimelineWeeks
  /** Layout mode for displaying timeline data */
  layoutMode: TimelineLayoutMode
}

// =============================================================================
// Derived Income Preferences
// =============================================================================

/**
 * User preferences for derived income calculations.
 */
export interface IncomeDerivedPreferences {
  /** Lookback period for growth rate calculation */
  lookbackPeriod: LookbackPeriod
}

// =============================================================================
// Persisted State
// =============================================================================

/**
 * Complete spending planner state for persistence.
 * This is what gets saved to localStorage.
 */
export interface SpendingPlannerState {
  /** Income configuration per currency */
  incomes: CurrencyIncome[]
  /** Stone income breakdown (manual entry) */
  stoneIncomeBreakdown: StoneIncomeBreakdown
  /** Gem income breakdown (manual entry) */
  gemIncomeBreakdown: GemIncomeBreakdown
  /** Planned spending events in priority order */
  events: SpendingEvent[]
  /** Timeline view configuration */
  timelineConfig: TimelineViewConfig
  /** UI state: whether income panel is collapsed */
  incomePanelCollapsed: boolean
  /** Which currencies are enabled for tracking */
  enabledCurrencies: CurrencyId[]
  /** Preferences for derived income calculations */
  incomeDerivedPreferences: IncomeDerivedPreferences
  /** Timestamp of last update */
  lastUpdated: number
}
