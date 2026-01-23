/**
 * Event Reorder Logic
 *
 * Pure functions for reordering spending events.
 */

import type { SpendingEvent } from '../types'

/**
 * Reorder events by moving an item from one index to another.
 * Also updates priority values to match the new order.
 *
 * Chain behavior:
 * - Chained events cannot be dragged individually
 * - Chain heads move their entire chain as a unit
 * - Dropping into the middle of a chain redirects to chain head position
 */
/* eslint-disable-next-line complexity, max-statements */
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

  const draggedEvent = events[fromIndex]

  // Chained events cannot be dragged individually
  if (draggedEvent.lockedToEventId !== null) {
    return events
  }

  // Get the chain for the dragged event (if it's a head)
  const chainIds = new Set<string>()
  const collectChain = (eventId: string) => {
    chainIds.add(eventId)
    for (const e of events) {
      if (e.lockedToEventId === eventId) {
        collectChain(e.id)
      }
    }
  }
  collectChain(draggedEvent.id)

  // If dropping onto a chain (either head or member), redirect to chain head position
  // and mark that we're dropping onto a chain to handle insertion correctly
  let adjustedToIndex = toIndex
  let droppingOntoChain = false
  const targetEvent = events[toIndex]

  if (targetEvent.lockedToEventId !== null) {
    // Target is a chain member - find the chain head
    let headEvent = targetEvent
    while (headEvent.lockedToEventId !== null) {
      const parent = events.find((e) => e.id === headEvent.lockedToEventId)
      if (!parent) break
      headEvent = parent
    }
    adjustedToIndex = events.findIndex((e) => e.id === headEvent.id)
    droppingOntoChain = true
  } else {
    // Target might be a chain head (has dependents but is not itself chained)
    const hasDependents = events.some((e) => e.lockedToEventId === targetEvent.id)
    if (hasDependents) {
      droppingOntoChain = true
    }
  }

  // Separate chain members from other events
  const chainEvents = events.filter((e) => chainIds.has(e.id))
  const otherEvents = events.filter((e) => !chainIds.has(e.id))

  // Calculate insertion position in the filtered array
  // When dropping onto a chain: always insert BEFORE the chain (at chain head position)
  // For normal moves:
  //   - Forward moves (fromIndex < toIndex): insert AFTER the target, count up to and including toIndex
  //   - Backward moves (fromIndex > toIndex): insert AT the target, count up to (not including) toIndex
  let insertPosition = 0
  const isMovingForward = fromIndex < adjustedToIndex
  let countLimit: number
  if (droppingOntoChain) {
    // Always insert before the chain head - use backward move logic regardless of direction
    countLimit = adjustedToIndex
  } else {
    countLimit = isMovingForward ? adjustedToIndex + 1 : adjustedToIndex
  }
  for (let i = 0; i < countLimit; i++) {
    if (!chainIds.has(events[i].id)) {
      insertPosition++
    }
  }

  // Insert chain at the new position
  const result = [
    ...otherEvents.slice(0, insertPosition),
    ...chainEvents,
    ...otherEvents.slice(insertPosition),
  ]

  // Update priorities to match new order
  return result.map((event, index) => ({
    ...event,
    priority: index,
  }))
}

/**
 * Add a new event to the queue at the end.
 * New events are always free-floating (not chained).
 */
export function addEvent(
  events: SpendingEvent[],
  newEvent: Omit<SpendingEvent, 'priority' | 'lockedToEventId'>
): SpendingEvent[] {
  const eventWithPriority: SpendingEvent = {
    ...newEvent,
    priority: events.length,
    lockedToEventId: null,
  }
  return [...events, eventWithPriority]
}

/**
 * Remove an event from the queue by ID.
 * Updates priorities of remaining events.
 * Makes any events chained to the removed event free-floating.
 */
export function removeEvent(
  events: SpendingEvent[],
  eventId: string
): SpendingEvent[] {
  const filtered = events.filter((e) => e.id !== eventId)
  // Re-index priorities and unchain any events that were chained to the removed event
  return filtered.map((event, index) => ({
    ...event,
    priority: index,
    lockedToEventId: event.lockedToEventId === eventId ? null : event.lockedToEventId,
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
 * Clones are always free-floating (not chained).
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
    lockedToEventId: null, // Clones are always free-floating
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

// Re-export chain helper functions for backward compatibility
export {
  isChainedEvent,
  isChainHead,
  getChainFromHead,
  getChainHead,
  toggleEventChain,
  canChainEvent,
  groupEventsIntoChains,
} from './event-chain-helpers'
