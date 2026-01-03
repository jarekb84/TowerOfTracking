import { describe, it, expect } from 'vitest'
import {
  reorderEvents,
  addEvent,
  removeEvent,
  updateEvent,
  sortByPriority,
  generateEventId,
} from './event-reorder'
import { CurrencyId } from '../types'
import type { SpendingEvent } from '../types'

describe('event-reorder', () => {
  const createTestEvents = (): SpendingEvent[] => [
    { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0 },
    { id: '2', name: 'Event B', currencyId: CurrencyId.Stones, amount: 200, priority: 1 },
    { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2 },
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
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2 },
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0 },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Stones, amount: 200, priority: 1 },
      ]
      const result = sortByPriority(events)

      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
      expect(result[2].id).toBe('3')
    })

    it('should not mutate original array', () => {
      const events: SpendingEvent[] = [
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 300, priority: 2 },
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 100, priority: 0 },
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
})
