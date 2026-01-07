/**
 * Timeline Calculator
 *
 * Calculate when spending events can be triggered based on income projections.
 * This is the SINGLE SOURCE OF TRUTH for all balance calculations.
 */

import type {
  CurrencyIncome,
  SpendingEvent,
  TimelineEvent,
  TimelineData,
  WeekDisplayData,
  CurrencyId,
} from '../types'
import { projectBalances, projectIncomes, projectDisplayIncomes } from './income-projection'
import { sortByPriority } from '../events/event-reorder'

/**
 * Initialize balance projections for all currencies.
 */
function initializeBalances(
  incomes: CurrencyIncome[],
  weeks: number,
  week0ProrationFactor: number = 1
): Map<CurrencyId, number[]> {
  const balances = new Map<CurrencyId, number[]>()
  for (const income of incomes) {
    balances.set(income.currencyId, projectBalances(income, weeks, week0ProrationFactor))
  }
  return balances
}

/**
 * Initialize income projections for all currencies.
 */
function initializeIncomes(
  incomes: CurrencyIncome[],
  weeks: number
): Map<CurrencyId, number[]> {
  const result = new Map<CurrencyId, number[]>()
  for (const income of incomes) {
    result.set(income.currencyId, projectIncomes(income, weeks))
  }
  return result
}

/**
 * Initialize expenditure tracking for all currencies (starts at zero).
 */
function initializeExpenditures(
  incomes: CurrencyIncome[],
  weeks: number
): Map<CurrencyId, number[]> {
  const result = new Map<CurrencyId, number[]>()
  for (const income of incomes) {
    result.set(income.currencyId, new Array(weeks).fill(0))
  }
  return result
}

/**
 * Initialize display income projections for all currencies.
 * Display income has proration applied to week 0.
 */
function initializeDisplayIncomes(
  incomes: CurrencyIncome[],
  weeks: number,
  week0ProrationFactor: number
): Map<CurrencyId, number[]> {
  const result = new Map<CurrencyId, number[]>()
  for (const income of incomes) {
    result.set(income.currencyId, projectDisplayIncomes(income, weeks, week0ProrationFactor))
  }
  return result
}

/**
 * Input parameters for building week display data.
 */
interface BuildWeekDisplayDataParams {
  /** Original currency income configurations */
  incomes: CurrencyIncome[]
  /** Running balances after events are processed */
  balances: Map<CurrencyId, number[]>
  /** Prorated income for display (week 0 is prorated) */
  displayIncomes: Map<CurrencyId, number[]>
  /** Expenditure per week */
  expenditures: Map<CurrencyId, number[]>
  /** Number of weeks */
  weeks: number
}

/**
 * Build pre-computed display data for each currency per week.
 *
 * This is the SINGLE SOURCE OF TRUTH for what the display layer should show.
 * The display layer must use these values directly without any recalculation.
 *
 * Balance semantics (mid-week spending model):
 * - balances[N] = starting balance for week N (before income, before spending)
 * - balances[N+1] = ending balance for week N (after income AND spending)
 */
function buildWeekDisplayData(params: BuildWeekDisplayDataParams): Map<CurrencyId, WeekDisplayData[]> {
  const { incomes, balances, displayIncomes, expenditures, weeks } = params
  const result = new Map<CurrencyId, WeekDisplayData[]>()

  for (const income of incomes) {
    const currencyId = income.currencyId
    const currencyBalances = balances.get(currencyId) ?? []
    const currencyDisplayIncomes = displayIncomes.get(currencyId) ?? []
    const currencyExpenditures = expenditures.get(currencyId) ?? []

    const weekData: WeekDisplayData[] = []

    for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
      // Raw ending balance from the timeline calculator (balances[weekIndex + 1])
      const rawEndingBalance = currencyBalances[weekIndex + 1] ?? 0
      const displayIncome = currencyDisplayIncomes[weekIndex] ?? 0
      const expenditure = currencyExpenditures[weekIndex] ?? 0

      // Prior balance = ending balance - income + expenditure
      // This reverses the formula: endingBalance = priorBalance + income - expenditure
      const priorBalance = rawEndingBalance - displayIncome + expenditure

      weekData.push({
        priorBalance,
        income: displayIncome,
        expenditure,
        balance: rawEndingBalance,
      })
    }

    result.set(currencyId, weekData)
  }

  return result
}

interface ProcessEventContext {
  balances: Map<CurrencyId, number[]>
  expenditures: Map<CurrencyId, number[]>
  startDate: Date
}

interface ProcessEventsResult {
  timelineEvents: TimelineEvent[]
  unaffordableEvents: SpendingEvent[]
}

/**
 * Process all events in priority order, respecting chain and same-currency queueing constraints.
 */
function processEvents(
  sortedEvents: SpendingEvent[],
  ctx: ProcessEventContext
): ProcessEventsResult {
  const timelineEvents: TimelineEvent[] = []
  const unaffordableEvents: SpendingEvent[] = []

  // Track trigger weeks for chain constraints
  const triggerWeekMap = new Map<string, number>()

  // Track last trigger week per currency for same-currency queueing
  const currencyLastTriggerWeek = new Map<CurrencyId, number>()

  for (const event of sortedEvents) {
    // Calculate minTriggerWeek based on chain + same-currency queue constraints
    const chainMinWeek = event.lockedToEventId === null
      ? 0
      : (triggerWeekMap.get(event.lockedToEventId) ?? 0)
    const currencyMinWeek = currencyLastTriggerWeek.get(event.currencyId) ?? 0
    const minTriggerWeek = Math.max(chainMinWeek, currencyMinWeek)

    const result = processEvent(event, ctx, minTriggerWeek)
    if (result) {
      timelineEvents.push(result)
      triggerWeekMap.set(event.id, result.triggerWeek)
      currencyLastTriggerWeek.set(event.currencyId, result.triggerWeek)
    } else {
      unaffordableEvents.push(event)
    }
  }

  return { timelineEvents, unaffordableEvents }
}

/**
 * Process a single event and return the timeline event if affordable.
 * @param minTriggerWeek - Earliest week this event can trigger (based on chain or queue order)
 */
function processEvent(
  event: SpendingEvent,
  ctx: ProcessEventContext,
  minTriggerWeek: number
): TimelineEvent | null {
  const currencyBalances = ctx.balances.get(event.currencyId)
  const currencyExpenditures = ctx.expenditures.get(event.currencyId)
  if (!currencyBalances || !currencyExpenditures) return null

  // Find trigger week, but no earlier than minTriggerWeek
  const triggerWeek = findTriggerWeek(currencyBalances, event.amount, minTriggerWeek)
  if (triggerWeek === -1) return null

  const triggerDate = addWeeks(ctx.startDate, triggerWeek)
  const endDate = event.durationDays && event.durationDays > 0
    ? addDays(triggerDate, event.durationDays)
    : undefined

  subtractFromBalances(currencyBalances, triggerWeek, event.amount)

  // Record expenditure for the trigger week
  currencyExpenditures[triggerWeek] += event.amount

  return {
    event,
    triggerWeek,
    triggerDate,
    endDate,
    // Balance available when purchase is made (ending balance after income, before this spending)
    balanceAtTrigger: currencyBalances[triggerWeek + 1] + event.amount,
  }
}

/**
 * Options for timeline calculation.
 */
interface CalculateTimelineOptions {
  /** Start date for timeline (defaults to current date) */
  startDate?: Date
  /** Proration factor for week 0 income (0 < factor <= 1).
   *  Defaults to 1 (full week). Events will only trigger in week 0 if the
   *  prorated income (not full income) plus starting balance covers the cost. */
  week0ProrationFactor?: number
}

/**
 * Calculate timeline for all spending events.
 *
 * @param incomes - Income configurations for all currencies
 * @param events - Spending events to schedule
 * @param weeks - Number of weeks to project
 * @param options - Optional configuration for timeline calculation
 */
export function calculateTimeline(
  incomes: CurrencyIncome[],
  events: SpendingEvent[],
  weeks: number,
  options: CalculateTimelineOptions = {}
): TimelineData {
  const { startDate = new Date(), week0ProrationFactor = 1 } = options
  const runningBalances = initializeBalances(incomes, weeks, week0ProrationFactor)
  const incomeByWeek = initializeIncomes(incomes, weeks)
  const expenditureByWeek = initializeExpenditures(incomes, weeks)

  // Process events in priority order with chain and same-currency queueing constraints
  const { timelineEvents, unaffordableEvents } = processEvents(
    sortByPriority(events),
    { balances: runningBalances, expenditures: expenditureByWeek, startDate }
  )

  // Build display-ready data (SINGLE SOURCE OF TRUTH for the display layer)
  const displayIncomes = initializeDisplayIncomes(incomes, weeks, week0ProrationFactor)
  const weekDisplayData = buildWeekDisplayData({
    incomes,
    balances: runningBalances,
    displayIncomes,
    expenditures: expenditureByWeek,
    weeks,
  })

  return {
    events: timelineEvents,
    balancesByWeek: runningBalances,
    incomeByWeek,
    expenditureByWeek,
    unaffordableEvents,
    weekDisplayData,
    meta: { week0ProrationFactor, startDate },
  }
}

/**
 * Find the first week where balance can cover the amount.
 *
 * Uses ending balance (starting balance + income) to determine affordability,
 * allowing events to be purchased mid-week after income is received.
 *
 * @param balances - Array where balances[N] is starting balance for week N,
 *                   and balances[N+1] is ending balance for week N
 * @param startWeek - Earliest week to consider (for queue sequence enforcement)
 */
function findTriggerWeek(balances: number[], amount: number, startWeek: number = 0): number {
  // Check ending balance (balances[week + 1]) to allow mid-week purchases
  // Loop until balances.length - 1 to ensure balances[week + 1] is valid
  for (let week = startWeek; week < balances.length - 1; week++) {
    if (balances[week + 1] >= amount) {
      return week
    }
  }
  return -1
}

/**
 * Subtract an amount from balances starting at a specific week.
 * Modifies the balances array in place.
 *
 * Since spending happens mid-week (after income is received), the deduction
 * starts from the ending balance of the trigger week (balances[fromWeek + 1]).
 */
function subtractFromBalances(
  balances: number[],
  fromWeek: number,
  amount: number
): void {
  // Start from fromWeek + 1 because spending happens after income is received
  // This affects the ending balance of fromWeek and all subsequent weeks
  for (let week = fromWeek + 1; week < balances.length; week++) {
    balances[week] -= amount
  }
}

/**
 * Add weeks to a date.
 */
function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + weeks * 7)
  return result
}

/**
 * Add days to a date.
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get the week number for a date relative to a start date.
 */
export function getWeekNumber(date: Date, startDate: Date): number {
  const diffMs = date.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7)
}

/**
 * Get the date for the start of a specific week.
 */
export function getWeekStartDate(weekNumber: number, startDate: Date): Date {
  return addWeeks(startDate, weekNumber)
}
