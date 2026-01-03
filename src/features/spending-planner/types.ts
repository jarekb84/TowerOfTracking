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
  /** Short abbreviation for compact display (e.g., "c", "st") */
  abbreviation: string
  /** Tailwind color class for visual distinction */
  color: string
  /** Whether this currency needs a unit selector (K, M, B, T, etc.) */
  hasUnitSelector: boolean
}

// =============================================================================
// Income Configuration
// =============================================================================

/**
 * Income configuration for a single currency.
 * Tracks current balance and weekly income with growth projections.
 */
export interface CurrencyIncome {
  /** Which currency this income belongs to */
  currencyId: CurrencyId
  /** Current balance of this currency */
  currentBalance: number
  /** Weekly income (sum of all sources) */
  weeklyIncome: number
  /** Weekly growth rate as a percentage (e.g., 5 for 5%) */
  growthRatePercent: number
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
 * Timeline view state configuration.
 */
export interface TimelineViewConfig {
  /** Number of weeks to display */
  weeks: TimelineWeeks
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
  /** Planned spending events in priority order */
  events: SpendingEvent[]
  /** Timeline view configuration */
  timelineConfig: TimelineViewConfig
  /** UI state: whether income panel is collapsed */
  incomePanelCollapsed: boolean
  /** Timestamp of last update */
  lastUpdated: number
}
