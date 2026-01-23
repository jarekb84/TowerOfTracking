/**
 * Event Positioning Logic
 *
 * Pure functions for calculating event positions in the timeline grid.
 */

import type { TimelineEvent } from '../types'
import { durationToWeeks } from './timeline-utils'

interface PositionedEvent {
  event: TimelineEvent
  startWeek: number
  spanWeeks: number
  row: number
}

/**
 * Sort events by trigger week, then by priority (lower priority number = higher priority = appears at top).
 */
function sortEventsByWeekAndPriority(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => {
    if (a.triggerWeek !== b.triggerWeek) {
      return a.triggerWeek - b.triggerWeek
    }
    return a.event.priority - b.event.priority
  })
}

/**
 * Check if a range of weeks is available in a row.
 */
function canPlaceInRow(occupiedWeeks: Set<number>, startWeek: number, spanWeeks: number): boolean {
  for (let week = startWeek; week < startWeek + spanWeeks; week++) {
    if (occupiedWeeks.has(week)) {
      return false
    }
  }
  return true
}

/**
 * Mark weeks as occupied in a row.
 */
function markWeeksOccupied(
  rowOccupancy: Map<number, Set<number>>,
  row: number,
  startWeek: number,
  spanWeeks: number
): void {
  if (!rowOccupancy.has(row)) {
    rowOccupancy.set(row, new Set())
  }
  const rowSet = rowOccupancy.get(row)!
  for (let week = startWeek; week < startWeek + spanWeeks; week++) {
    rowSet.add(week)
  }
}

/**
 * Find the first available row for an event.
 */
function findAvailableRow(
  rowOccupancy: Map<number, Set<number>>,
  startWeek: number,
  spanWeeks: number
): number {
  let row = 0
  while (true) {
    const occupiedWeeks = rowOccupancy.get(row) ?? new Set()
    if (canPlaceInRow(occupiedWeeks, startWeek, spanWeeks)) {
      return row
    }
    row++
  }
}

/**
 * Calculate positioned events with row assignments to avoid overlaps.
 */
export function calculateEventPositions(
  events: TimelineEvent[],
  totalWeeks: number
): PositionedEvent[] {
  const positioned: PositionedEvent[] = []
  const rowOccupancy: Map<number, Set<number>> = new Map()
  const sortedEvents = sortEventsByWeekAndPriority(events)

  for (const event of sortedEvents) {
    const startWeek = event.triggerWeek
    const spanWeeks = Math.min(
      event.event.durationDays ? durationToWeeks(event.event.durationDays) : 1,
      totalWeeks - startWeek
    )

    const row = findAvailableRow(rowOccupancy, startWeek, spanWeeks)
    markWeeksOccupied(rowOccupancy, row, startWeek, spanWeeks)
    positioned.push({ event, startWeek, spanWeeks, row })
  }

  return positioned
}
