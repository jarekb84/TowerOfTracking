/**
 * Event Pill Handlers
 *
 * Pure functions for creating event pill handlers.
 */

import type { SpendingEvent } from '../types'

interface DragHandlers {
  onDragStart: (e: React.DragEvent) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

interface ActionHandlers {
  onEdit: (e: React.MouseEvent) => void
  onClone: (e: React.MouseEvent) => void
  onRemove: (e: React.MouseEvent) => void
}

export function createEventDragHandlers(
  index: number,
  onDragStart: (index: number) => void,
  onDragEnter: (index: number) => void
): DragHandlers {
  return {
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move'
      onDragStart(index)
    },
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault()
      onDragEnter(index)
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
    },
  }
}

export function createEventActionHandlers(
  event: SpendingEvent,
  onEdit: (event: SpendingEvent) => void,
  onClone: (eventId: string) => void,
  onRemove: (eventId: string) => void
): ActionHandlers {
  return {
    onEdit: (e: React.MouseEvent) => {
      e.stopPropagation()
      onEdit(event)
    },
    onClone: (e: React.MouseEvent) => {
      e.stopPropagation()
      onClone(event.id)
    },
    onRemove: (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove(event.id)
    },
  }
}
