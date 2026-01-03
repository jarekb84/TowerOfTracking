/**
 * Timeline Calculator
 *
 * Calculate when spending events can be triggered based on income projections.
 */

import type {
  CurrencyIncome,
  SpendingEvent,
  TimelineEvent,
  TimelineData,
  CurrencyId,
} from '../types'
import { projectBalances, projectIncomes } from './income-projection'
import { sortByPriority } from '../events/event-reorder'

/**
 * Initialize balance projections for all currencies.
 */
function initializeBalances(
  incomes: CurrencyIncome[],
  weeks: number
): Map<CurrencyId, number[]> {
  const balances = new Map<CurrencyId, number[]>()
  for (const income of incomes) {
    balances.set(income.currencyId, projectBalances(income, weeks))
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
 * Process a single event and return the timeline event if affordable.
 *
 * @param minTriggerWeek - Earliest week this event can trigger (enforces queue sequence)
 */
function processEvent(
  event: SpendingEvent,
  balances: Map<CurrencyId, number[]>,
  startDate: Date,
  minTriggerWeek: number
): TimelineEvent | null {
  const currencyBalances = balances.get(event.currencyId)
  if (!currencyBalances) return null

  // Find trigger week, but no earlier than minTriggerWeek (respects queue order)
  const triggerWeek = findTriggerWeek(currencyBalances, event.amount, minTriggerWeek)
  if (triggerWeek === -1) return null

  const triggerDate = addWeeks(startDate, triggerWeek)
  const endDate = event.durationDays && event.durationDays > 0
    ? addDays(triggerDate, event.durationDays)
    : undefined

  subtractFromBalances(currencyBalances, triggerWeek, event.amount)

  return {
    event,
    triggerWeek,
    triggerDate,
    endDate,
    balanceAtTrigger: currencyBalances[triggerWeek] + event.amount,
  }
}

/**
 * Calculate timeline for all spending events.
 */
export function calculateTimeline(
  incomes: CurrencyIncome[],
  events: SpendingEvent[],
  weeks: number,
  startDate: Date = new Date()
): TimelineData {
  const sortedEvents = sortByPriority(events)
  const runningBalances = initializeBalances(incomes, weeks)
  const incomeByWeek = initializeIncomes(incomes, weeks)

  const timelineEvents: TimelineEvent[] = []
  const unaffordableEvents: SpendingEvent[] = []

  // Track the latest trigger week to enforce queue sequence
  // Later events in queue cannot trigger before earlier events
  let minTriggerWeek = 0

  for (const event of sortedEvents) {
    const result = processEvent(event, runningBalances, startDate, minTriggerWeek)
    if (result) {
      timelineEvents.push(result)
      // Update minimum trigger week for subsequent events
      minTriggerWeek = result.triggerWeek
    } else {
      unaffordableEvents.push(event)
    }
  }

  return { events: timelineEvents, balancesByWeek: runningBalances, incomeByWeek, unaffordableEvents }
}

/**
 * Find the first week where balance can cover the amount.
 *
 * @param startWeek - Earliest week to consider (for queue sequence enforcement)
 */
function findTriggerWeek(balances: number[], amount: number, startWeek: number = 0): number {
  for (let week = startWeek; week < balances.length; week++) {
    if (balances[week] >= amount) {
      return week
    }
  }
  return -1
}

/**
 * Subtract an amount from balances starting at a specific week.
 * Modifies the balances array in place.
 */
function subtractFromBalances(
  balances: number[],
  fromWeek: number,
  amount: number
): void {
  for (let week = fromWeek; week < balances.length; week++) {
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
