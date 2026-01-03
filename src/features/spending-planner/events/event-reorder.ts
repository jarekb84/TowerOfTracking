/**
 * Event Reorder Logic
 *
 * Pure functions for reordering spending events.
 */

import type { SpendingEvent } from '../types'

/**
 * Reorder events by moving an item from one index to another.
 * Also updates priority values to match the new order.
 */
export function reorderEvents(
  events: SpendingEvent[],
  fromIndex: number,
  toIndex: number
): SpendingEvent[] {
  // Validate indices
  if (
    fromIndex < 0 ||
    fromIndex >= events.length ||
    toIndex < 0 ||
    toIndex >= events.length
  ) {
    return events
  }

  // No-op if indices are the same
  if (fromIndex === toIndex) {
    return events
  }

  // Create new array with reordered items
  const result = [...events]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)

  // Update priorities to match new order
  return result.map((event, index) => ({
    ...event,
    priority: index,
  }))
}

/**
 * Add a new event to the queue at the end.
 */
export function addEvent(
  events: SpendingEvent[],
  newEvent: Omit<SpendingEvent, 'priority'>
): SpendingEvent[] {
  const eventWithPriority: SpendingEvent = {
    ...newEvent,
    priority: events.length,
  }
  return [...events, eventWithPriority]
}

/**
 * Remove an event from the queue by ID.
 * Updates priorities of remaining events.
 */
export function removeEvent(
  events: SpendingEvent[],
  eventId: string
): SpendingEvent[] {
  const filtered = events.filter((e) => e.id !== eventId)
  // Re-index priorities
  return filtered.map((event, index) => ({
    ...event,
    priority: index,
  }))
}

/**
 * Update an existing event.
 */
export function updateEvent(
  events: SpendingEvent[],
  eventId: string,
  updates: Partial<Omit<SpendingEvent, 'id' | 'priority'>>
): SpendingEvent[] {
  return events.map((event) =>
    event.id === eventId ? { ...event, ...updates } : event
  )
}

/**
 * Sort events by priority.
 */
export function sortByPriority(events: SpendingEvent[]): SpendingEvent[] {
  return [...events].sort((a, b) => a.priority - b.priority)
}

/**
 * Clone an existing event with a new ID.
 * The cloned event is inserted right after the original.
 */
export function cloneEvent(
  events: SpendingEvent[],
  eventId: string
): SpendingEvent[] {
  const sourceIndex = events.findIndex((e) => e.id === eventId)
  if (sourceIndex === -1) return events

  const source = events[sourceIndex]
  const cloned: SpendingEvent = {
    ...source,
    id: generateEventId(),
    name: `${source.name} (copy)`,
    priority: source.priority + 1,
  }

  // Insert after the source and re-index priorities
  const result = [
    ...events.slice(0, sourceIndex + 1),
    cloned,
    ...events.slice(sourceIndex + 1),
  ]

  return result.map((event, index) => ({
    ...event,
    priority: index,
  }))
}

/**
 * Generate a unique ID for a new event.
 */
export function generateEventId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
