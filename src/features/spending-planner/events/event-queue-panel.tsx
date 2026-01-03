/**
 * Event Queue Panel Component
 *
 * Panel displaying the draggable queue of spending events.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EventPill } from './event-pill'
import { AddEventDialog } from './add-event-dialog'
import { EditEventDialog } from './edit-event-dialog'
import type { SpendingEvent, CurrencyId } from '../types'

export interface AddEventData {
  name: string
  currencyId: CurrencyId
  amount: number
  durationDays?: number
}

export interface EditEventData extends AddEventData {
  eventId: string
}

interface EventQueuePanelProps {
  events: SpendingEvent[]
  draggedIndex: number | null
  draggedOverIndex: number | null
  onDragStart: (index: number) => void
  onDragEnter: (index: number) => void
  onDragEnd: () => void
  onAddEvent: (data: AddEventData) => void
  onRemoveEvent: (eventId: string) => void
  onEditEvent: (data: EditEventData) => void
  onCloneEvent: (eventId: string) => void
}

export function EventQueuePanel({
  events,
  draggedIndex,
  draggedOverIndex,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onAddEvent,
  onRemoveEvent,
  onEditEvent,
  onCloneEvent,
}: EventQueuePanelProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<SpendingEvent | null>(null)

  const handleEditClick = (event: SpendingEvent) => {
    setEditingEvent(event)
  }

  const handleEditSave = (data: EditEventData) => {
    onEditEvent(data)
    setEditingEvent(null)
  }

  const handleAddEvent = (name: string, currencyId: CurrencyId, amount: number, durationDays?: number) => {
    onAddEvent({ name, currencyId, amount, durationDays })
  }

  return (
    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-200">Event Queue</h2>
        <Button
          size="compact"
          variant="outline"
          onClick={() => setIsAddDialogOpen(true)}
        >
          + Add Event
        </Button>
      </div>

      {/* Events */}
      <div className="p-4">
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No events planned yet.</p>
            <p className="text-xs mt-1">Click &ldquo;+ Add Event&rdquo; to start planning.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {events.map((event, index) => (
              <EventPill
                key={event.id}
                event={event}
                index={index}
                isDragging={draggedIndex === index}
                isDraggedOver={draggedOverIndex === index && draggedIndex !== index}
                onDragStart={onDragStart}
                onDragEnter={onDragEnter}
                onDragEnd={onDragEnd}
                onRemove={onRemoveEvent}
                onEdit={handleEditClick}
                onClone={onCloneEvent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hint */}
      {events.length > 0 && (
        <div className="px-4 pb-3 text-xs text-slate-500">
          Drag to reorder priorities. Events trigger when balance is sufficient.
        </div>
      )}

      {/* Add Event Dialog */}
      <AddEventDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddEvent}
      />

      {/* Edit Event Dialog */}
      <EditEventDialog
        event={editingEvent}
        isOpen={editingEvent !== null}
        onClose={() => setEditingEvent(null)}
        onSave={handleEditSave}
      />
    </div>
  )
}
