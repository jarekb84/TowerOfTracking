import { describe, it, expect } from 'vitest'
import {
  reorderEvents,
  addEvent,
  removeEvent,
  updateEvent,
  sortByPriority,
  generateEventId,
  isChainedEvent,
  isChainHead,
  getChainFromHead,
  getChainHead,
  toggleEventChain,
  canChainEvent,
} from './event-reorder'
import { CurrencyId } from '../types'
import type { SpendingEvent } from '../types'

describe('event-reorder', () => {
  const createTestEvents = (): SpendingEvent[] => [
    { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
    { id: '2', name: 'Event B', currencyId: CurrencyId.Stones, amount: 200, priority: 1, lockedToEventId: null },
    { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2, lockedToEventId: null },
  ]

  describe('reorderEvents', () => {
    it('should move event from front to back', () => {
      const events = createTestEvents()
      const result = reorderEvents(events, 0, 2)

      expect(result[0].id).toBe('2')
      expect(result[1].id).toBe('3')
      expect(result[2].id).toBe('1')
    })

    it('should move event from back to front', () => {
      const events = createTestEvents()
      const result = reorderEvents(events, 2, 0)

      expect(result[0].id).toBe('3')
      expect(result[1].id).toBe('1')
      expect(result[2].id).toBe('2')
    })

    it('should move event to middle', () => {
      const events = createTestEvents()
      const result = reorderEvents(events, 0, 1)

      expect(result[0].id).toBe('2')
      expect(result[1].id).toBe('1')
      expect(result[2].id).toBe('3')
    })

    it('should update priorities after reorder', () => {
      const events = createTestEvents()
      const result = reorderEvents(events, 2, 0)

      expect(result[0].priority).toBe(0)
      expect(result[1].priority).toBe(1)
      expect(result[2].priority).toBe(2)
    })

    it('should return same array if indices are equal', () => {
      const events = createTestEvents()
      const result = reorderEvents(events, 1, 1)

      expect(result).toEqual(events)
    })

    it('should return same array if fromIndex is out of bounds', () => {
      const events = createTestEvents()
      const result = reorderEvents(events, -1, 1)

      expect(result).toEqual(events)
    })

    it('should return same array if toIndex is out of bounds', () => {
      const events = createTestEvents()
      const result = reorderEvents(events, 0, 10)

      expect(result).toEqual(events)
    })

    it('should not mutate original array', () => {
      const events = createTestEvents()
      const originalOrder = events.map((e) => e.id)
      reorderEvents(events, 0, 2)

      expect(events.map((e) => e.id)).toEqual(originalOrder)
    })
  })

  describe('addEvent', () => {
    it('should add event with correct priority', () => {
      const events = createTestEvents()
      const newEvent = { id: '4', name: 'Event D', currencyId: CurrencyId.Coins, amount: 400 }
      const result = addEvent(events, newEvent)

      expect(result).toHaveLength(4)
      expect(result[3].id).toBe('4')
      expect(result[3].priority).toBe(3)
    })

    it('should handle empty array', () => {
      const events: SpendingEvent[] = []
      const newEvent = { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100 }
      const result = addEvent(events, newEvent)

      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe(0)
    })

    it('should not mutate original array', () => {
      const events = createTestEvents()
      const newEvent = { id: '4', name: 'Event D', currencyId: CurrencyId.Coins, amount: 400 }
      addEvent(events, newEvent)

      expect(events).toHaveLength(3)
    })
  })

  describe('removeEvent', () => {
    it('should remove event by ID', () => {
      const events = createTestEvents()
      const result = removeEvent(events, '2')

      expect(result).toHaveLength(2)
      expect(result.find((e) => e.id === '2')).toBeUndefined()
    })

    it('should update priorities after removal', () => {
      const events = createTestEvents()
      const result = removeEvent(events, '1')

      expect(result[0].priority).toBe(0)
      expect(result[1].priority).toBe(1)
    })

    it('should handle non-existent ID', () => {
      const events = createTestEvents()
      const result = removeEvent(events, 'non-existent')

      expect(result).toHaveLength(3)
    })

    it('should not mutate original array', () => {
      const events = createTestEvents()
      removeEvent(events, '2')

      expect(events).toHaveLength(3)
    })
  })

  describe('updateEvent', () => {
    it('should update event properties', () => {
      const events = createTestEvents()
      const result = updateEvent(events, '2', { name: 'Updated Name', amount: 999 })

      expect(result[1].name).toBe('Updated Name')
      expect(result[1].amount).toBe(999)
    })

    it('should preserve other properties', () => {
      const events = createTestEvents()
      const result = updateEvent(events, '2', { name: 'Updated Name' })

      expect(result[1].amount).toBe(200)
      expect(result[1].currencyId).toBe(CurrencyId.Stones)
      expect(result[1].priority).toBe(1)
    })

    it('should not change other events', () => {
      const events = createTestEvents()
      const result = updateEvent(events, '2', { name: 'Updated Name' })

      expect(result[0]).toEqual(events[0])
      expect(result[2]).toEqual(events[2])
    })

    it('should handle non-existent ID', () => {
      const events = createTestEvents()
      const result = updateEvent(events, 'non-existent', { name: 'Test' })

      expect(result).toEqual(events)
    })
  })

  describe('sortByPriority', () => {
    it('should sort events by priority', () => {
      const events: SpendingEvent[] = [
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2, lockedToEventId: null },
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Stones, amount: 200, priority: 1, lockedToEventId: null },
      ]
      const result = sortByPriority(events)

      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
      expect(result[2].id).toBe('3')
    })

    it('should not mutate original array', () => {
      const events: SpendingEvent[] = [
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2, lockedToEventId: null },
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
      ]
      sortByPriority(events)

      expect(events[0].id).toBe('3')
    })
  })

  describe('generateEventId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateEventId())
      }
      expect(ids.size).toBe(100)
    })

    it('should start with event- prefix', () => {
      const id = generateEventId()
      expect(id.startsWith('event-')).toBe(true)
    })
  })

  // =============================================================================
  // Chain Helper Functions
  // =============================================================================

  describe('isChainedEvent', () => {
    it('should return false for free-floating events', () => {
      const event: SpendingEvent = {
        id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null,
      }
      expect(isChainedEvent(event)).toBe(false)
    })

    it('should return true for chained events', () => {
      const event: SpendingEvent = {
        id: '2', name: 'Event B', currencyId: CurrencyId.Coins, amount: 100, priority: 1, lockedToEventId: '1',
      }
      expect(isChainedEvent(event)).toBe(true)
    })
  })

  describe('isChainHead', () => {
    it('should return false for event with no dependents', () => {
      const events = createTestEvents()
      expect(isChainHead(events, '1')).toBe(false)
    })

    it('should return true for event with dependents', () => {
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Coins, amount: 200, priority: 1, lockedToEventId: '1' },
      ]
      expect(isChainHead(events, '1')).toBe(true)
    })

    it('should return false for chained event even if it has dependents', () => {
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Coins, amount: 200, priority: 1, lockedToEventId: '1' },
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2, lockedToEventId: '2' },
      ]
      expect(isChainHead(events, '2')).toBe(false)
    })

    it('should return false for non-existent event', () => {
      const events = createTestEvents()
      expect(isChainHead(events, 'non-existent')).toBe(false)
    })
  })

  describe('getChainFromHead', () => {
    it('should return single event for event with no dependents', () => {
      const events = createTestEvents()
      const chain = getChainFromHead(events, '1')
      expect(chain).toHaveLength(1)
      expect(chain[0].id).toBe('1')
    })

    it('should return all events in a chain', () => {
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Coins, amount: 200, priority: 1, lockedToEventId: '1' },
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2, lockedToEventId: '2' },
      ]
      const chain = getChainFromHead(events, '1')
      expect(chain).toHaveLength(3)
      expect(chain[0].id).toBe('1')
      expect(chain[1].id).toBe('2')
      expect(chain[2].id).toBe('3')
    })

    it('should return empty array for non-existent event', () => {
      const events = createTestEvents()
      const chain = getChainFromHead(events, 'non-existent')
      expect(chain).toHaveLength(0)
    })
  })

  describe('getChainHead', () => {
    it('should return the event itself if not chained', () => {
      const events = createTestEvents()
      const head = getChainHead(events, '1')
      expect(head?.id).toBe('1')
    })

    it('should walk up to find the head of a chain', () => {
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Coins, amount: 200, priority: 1, lockedToEventId: '1' },
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2, lockedToEventId: '2' },
      ]
      const head = getChainHead(events, '3')
      expect(head?.id).toBe('1')
    })

    it('should return null for non-existent event', () => {
      const events = createTestEvents()
      const head = getChainHead(events, 'non-existent')
      expect(head).toBeNull()
    })
  })

  describe('toggleEventChain', () => {
    it('should chain event to previous when free-floating', () => {
      const events = createTestEvents()
      const result = toggleEventChain(events, '2')

      expect(result).not.toBeNull()
      expect(result!.find((e) => e.id === '2')?.lockedToEventId).toBe('1')
    })

    it('should make event free-floating when chained', () => {
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Coins, amount: 200, priority: 1, lockedToEventId: '1' },
      ]
      const result = toggleEventChain(events, '2')

      expect(result).not.toBeNull()
      expect(result!.find((e) => e.id === '2')?.lockedToEventId).toBeNull()
    })

    it('should return null for first event (cannot chain)', () => {
      const events = createTestEvents()
      const result = toggleEventChain(events, '1')
      expect(result).toBeNull()
    })

    it('should return null for non-existent event', () => {
      const events = createTestEvents()
      const result = toggleEventChain(events, 'non-existent')
      expect(result).toBeNull()
    })
  })

  describe('canChainEvent', () => {
    it('should return false for first event', () => {
      const events = createTestEvents()
      expect(canChainEvent(events, '1')).toBe(false)
    })

    it('should return true for non-first events', () => {
      const events = createTestEvents()
      expect(canChainEvent(events, '2')).toBe(true)
      expect(canChainEvent(events, '3')).toBe(true)
    })
  })

  describe('reorderEvents with chains', () => {
    it('should prevent chained events from being dragged individually', () => {
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Coins, amount: 200, priority: 1, lockedToEventId: '1' },
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2, lockedToEventId: null },
      ]
      // Try to drag chained event (index 1) - should be prevented
      const result = reorderEvents(events, 1, 2)

      // Should return original array unchanged
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
      expect(result[2].id).toBe('3')
    })

    it('should move chain head with its entire chain', () => {
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Coins, amount: 200, priority: 1, lockedToEventId: '1' },
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2, lockedToEventId: null },
      ]
      // Drag chain head (index 0) to after free event (index 2)
      const result = reorderEvents(events, 0, 2)

      // Chain (1, 2) should move together after event 3
      expect(result[0].id).toBe('3')
      expect(result[1].id).toBe('1')
      expect(result[2].id).toBe('2')
    })
  })

  describe('removeEvent with chains', () => {
    it('should make dependents free-floating when anchor is deleted', () => {
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Coins, amount: 200, priority: 1, lockedToEventId: '1' },
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2, lockedToEventId: '2' },
      ]
      const result = removeEvent(events, '1')

      expect(result).toHaveLength(2)
      // Event 2 should now be free-floating
      expect(result[0].lockedToEventId).toBeNull()
      // Event 3 should still be chained to event 2
      expect(result[1].lockedToEventId).toBe('2')
    })
  })

  describe('addEvent with chains', () => {
    it('should add new event as free-floating', () => {
      const events = createTestEvents()
      const newEvent = { id: '4', name: 'Event D', currencyId: CurrencyId.Coins, amount: 400 }
      const result = addEvent(events, newEvent)

      expect(result[3].lockedToEventId).toBeNull()
    })
  })
})
