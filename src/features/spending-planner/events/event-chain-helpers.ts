/**
 * Event Chain Helper Functions
 *
 * Pure functions for managing event chains in the spending planner.
 * Events can be chained together, meaning they must wait for their predecessor.
 */

import type { SpendingEvent } from '../types'
import { sortByPriority } from './event-reorder'

/**
 * Check if an event is chained to another event.
 */
export function isChainedEvent(event: SpendingEvent): boolean {
  return event.lockedToEventId !== null
}

/**
 * Check if an event is a chain head (has dependents but is not itself chained).
 */
export function isChainHead(events: SpendingEvent[], eventId: string): boolean {
  const event = events.find((e) => e.id === eventId)
  if (!event) return false

  // Must not be chained itself
  if (event.lockedToEventId !== null) return false

  // Must have at least one dependent
  return events.some((e) => e.lockedToEventId === eventId)
}

/**
 * Get all events in a chain starting from the head.
 * Returns events in priority order.
 */
export function getChainFromHead(events: SpendingEvent[], headId: string): SpendingEvent[] {
  const chain: SpendingEvent[] = []
  const head = events.find((e) => e.id === headId)
  if (!head) return chain

  chain.push(head)

  // Sort once before walking the chain (O(n log n) instead of O(n^2 log n))
  const sorted = sortByPriority(events)

  // Walk down the chain following dependencies
  let currentId = headId
  let foundNext = true
  while (foundNext) {
    foundNext = false
    // Find the next event in priority order that is chained to current
    for (const event of sorted) {
      if (event.lockedToEventId === currentId) {
        chain.push(event)
        currentId = event.id
        foundNext = true
        break
      }
    }
  }

  return chain
}

/**
 * Walk up the chain to find the head event.
 * Returns the event itself if it's not chained.
 */
export function getChainHead(events: SpendingEvent[], eventId: string): SpendingEvent | null {
  const event = events.find((e) => e.id === eventId)
  if (!event) return null

  // If not chained, this is the head
  if (event.lockedToEventId === null) return event

  // Walk up the chain
  return getChainHead(events, event.lockedToEventId)
}

/**
 * Toggle the chain state of an event.
 * - If currently free-floating: chain to the event immediately before it
 * - If currently chained: make it free-floating
 * Returns null if the event cannot be toggled (e.g., first event).
 */
export function toggleEventChain(
  events: SpendingEvent[],
  eventId: string
): SpendingEvent[] | null {
  const sorted = sortByPriority(events)
  const eventIndex = sorted.findIndex((e) => e.id === eventId)

  if (eventIndex === -1) return null

  const event = sorted[eventIndex]

  // First event cannot be chained (nothing to chain to)
  if (eventIndex === 0) return null

  const previousEvent = sorted[eventIndex - 1]

  // Toggle chain state
  const newLockedToEventId = event.lockedToEventId === null
    ? previousEvent.id  // Chain to previous
    : null              // Make free-floating

  return events.map((e) =>
    e.id === eventId
      ? { ...e, lockedToEventId: newLockedToEventId }
      : e
  )
}

/**
 * Check if an event can be chained (not the first event).
 */
export function canChainEvent(events: SpendingEvent[], eventId: string): boolean {
  const sorted = sortByPriority(events)
  const eventIndex = sorted.findIndex((e) => e.id === eventId)
  return eventIndex > 0
}

/**
 * A group of events for rendering - either a single free-floating event
 * or a chain head with its dependents.
 */
interface EventGroup {
  /** Events in this group, in priority order */
  events: SpendingEvent[]
  /** Whether this group is a chain (has more than one event) */
  isChain: boolean
}

/**
 * Group events into chains for rendering.
 * Each chain head starts a new group containing itself and all dependents.
 * Free-floating events (not chained and no dependents) are their own group.
 * Returns groups in priority order.
 */
export function groupEventsIntoChains(events: SpendingEvent[]): EventGroup[] {
  const sorted = sortByPriority(events)
  const groups: EventGroup[] = []
  const processedIds = new Set<string>()

  for (const event of sorted) {
    // Skip if already processed as part of a chain
    if (processedIds.has(event.id)) continue

    // Skip chained events - they'll be included with their head
    if (event.lockedToEventId !== null) continue

    // This is either a chain head or a free-floating event
    const chain = getChainFromHead(events, event.id)
    chain.forEach((e) => processedIds.add(e.id))

    groups.push({
      events: chain,
      isChain: chain.length > 1,
    })
  }

  return groups
}
