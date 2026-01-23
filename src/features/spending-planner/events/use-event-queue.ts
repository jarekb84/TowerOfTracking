/**
 * Event Queue Hook
 *
 * Manages event queue state including drag-and-drop reordering.
 */

import { useState, useCallback } from 'react'
import type { SpendingEvent, CurrencyId } from '../types'
import {
  reorderEvents,
  addEvent as addEventFn,
  removeEvent as removeEventFn,
  updateEvent as updateEventFn,
  cloneEvent as cloneEventFn,
  generateEventId,
  toggleEventChain as toggleEventChainFn,
} from './event-reorder'

/** Input for adding a new event */
interface AddEventInput {
  name: string
  currencyId: CurrencyId
  amount: number
  durationDays?: number
}

/** Input for updating an event */
interface UpdateEventInput {
  name: string
  currencyId: CurrencyId
  amount: number
  durationDays?: number
}

interface UseEventQueueReturn {
  /** Current drag state */
  draggedIndex: number | null
  draggedOverIndex: number | null
  isDragging: boolean
  /** Drag handlers */
  handleDragStart: (index: number) => void
  handleDragEnter: (index: number) => void
  handleDragEnd: () => void
  handleDrop: (events: SpendingEvent[]) => SpendingEvent[]
  /** Event operations */
  addEvent: (events: SpendingEvent[], input: AddEventInput) => SpendingEvent[]
  removeEvent: (events: SpendingEvent[], eventId: string) => SpendingEvent[]
  updateEvent: (events: SpendingEvent[], eventId: string, input: UpdateEventInput) => SpendingEvent[]
  cloneEvent: (events: SpendingEvent[], eventId: string) => SpendingEvent[]
  toggleEventChain: (events: SpendingEvent[], eventId: string) => SpendingEvent[] | null
}

/**
 * Hook for managing event queue with drag-and-drop reordering.
 */
export function useEventQueue(): UseEventQueueReturn {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragEnter = useCallback((index: number) => {
    setDraggedOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDraggedOverIndex(null)
  }, [])

  const handleDrop = useCallback(
    (events: SpendingEvent[]): SpendingEvent[] => {
      if (draggedIndex === null || draggedOverIndex === null) {
        return events
      }
      return reorderEvents(events, draggedIndex, draggedOverIndex)
    },
    [draggedIndex, draggedOverIndex]
  )

  const addEvent = useCallback(
    (events: SpendingEvent[], input: AddEventInput): SpendingEvent[] => {
      const newEvent = {
        id: generateEventId(),
        name: input.name,
        currencyId: input.currencyId,
        amount: input.amount,
        durationDays: input.durationDays,
      }
      return addEventFn(events, newEvent)
    },
    []
  )

  const removeEvent = useCallback(
    (events: SpendingEvent[], eventId: string): SpendingEvent[] => {
      return removeEventFn(events, eventId)
    },
    []
  )

  const updateEvent = useCallback(
    (events: SpendingEvent[], eventId: string, input: UpdateEventInput): SpendingEvent[] => {
      return updateEventFn(events, eventId, {
        name: input.name,
        currencyId: input.currencyId,
        amount: input.amount,
        durationDays: input.durationDays,
      })
    },
    []
  )

  const cloneEvent = useCallback(
    (events: SpendingEvent[], eventId: string): SpendingEvent[] => {
      return cloneEventFn(events, eventId)
    },
    []
  )

  const toggleEventChain = useCallback(
    (events: SpendingEvent[], eventId: string): SpendingEvent[] | null => {
      return toggleEventChainFn(events, eventId)
    },
    []
  )

  const isDragging = draggedIndex !== null

  return {
    draggedIndex,
    draggedOverIndex,
    isDragging,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    handleDrop,
    addEvent,
    removeEvent,
    updateEvent,
    cloneEvent,
    toggleEventChain,
  }
}
