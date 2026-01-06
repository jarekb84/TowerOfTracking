/**
 * Event Queue Panel Component
 *
 * Panel displaying the draggable queue of spending events.
 */

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { EventPill } from './event-pill'
import { AddEventDialog } from './add-event-dialog'
import { EditEventDialog } from './edit-event-dialog'
import type { SpendingEvent, CurrencyId } from '../types'
import { getEnabledCurrenciesInOrder, getCurrencyConfig } from '../currencies/currency-config'
import type { CurrencyConfig } from '../types'
import { isChainedEvent, canChainEvent, groupEventsIntoChains, sortByPriority } from './event-reorder'

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
  enabledCurrencies: CurrencyId[]
  draggedIndex: number | null
  draggedOverIndex: number | null
  onDragStart: (index: number) => void
  onDragEnter: (index: number) => void
  onDragEnd: () => void
  onAddEvent: (data: AddEventData) => void
  onRemoveEvent: (eventId: string) => void
  onEditEvent: (data: EditEventData) => void
  onCloneEvent: (eventId: string) => void
  onToggleChain: (eventId: string) => void
}

/* eslint-disable-next-line max-lines-per-function */
export function EventQueuePanel({
  events,
  enabledCurrencies,
  draggedIndex,
  draggedOverIndex,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onAddEvent,
  onRemoveEvent,
  onEditEvent,
  onCloneEvent,
  onToggleChain,
}: EventQueuePanelProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<SpendingEvent | null>(null)

  // Get enabled currency configs in order
  const enabledCurrencyConfigs = useMemo((): CurrencyConfig[] => {
    return getEnabledCurrenciesInOrder(enabledCurrencies).map(getCurrencyConfig)
  }, [enabledCurrencies])

  // Group events into chains for rendering
  const eventGroups = useMemo(() => groupEventsIntoChains(events), [events])

  // Map event IDs to their index in the sorted array (for drag handlers)
  const eventIndexMap = useMemo(() => {
    const sorted = sortByPriority(events)
    return new Map(sorted.map((e, i) => [e.id, i]))
  }, [events])

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
            {eventGroups.map((group) => (
              <div
                key={group.events[0].id}
                className="inline-flex"
              >
                {group.events.map((event, groupIndex) => {
                  const index = eventIndexMap.get(event.id) ?? 0
                  // Events that are not the last in a chain have a chained dependent
                  const hasChainedDependent = group.isChain && groupIndex < group.events.length - 1
                  return (
                    <EventPill
                      key={event.id}
                      event={event}
                      index={index}
                      isDragging={draggedIndex === index}
                      isDraggedOver={draggedOverIndex === index && draggedIndex !== index}
                      isChained={isChainedEvent(event)}
                      canChain={canChainEvent(events, event.id)}
                      hasChainedDependent={hasChainedDependent}
                      onDragStart={onDragStart}
                      onDragEnter={onDragEnter}
                      onDragEnd={onDragEnd}
                      onRemove={onRemoveEvent}
                      onEdit={handleEditClick}
                      onClone={onCloneEvent}
                      onToggleChain={onToggleChain}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hint */}
      {events.length > 0 && (
        <div className="px-4 pb-3 text-xs text-slate-500">
          Hover and click the left handle to chain events together. Chained events trigger consecutively.
        </div>
      )}

      {/* Add Event Dialog */}
      <AddEventDialog
        isOpen={isAddDialogOpen}
        currencies={enabledCurrencyConfigs}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddEvent}
      />

      {/* Edit Event Dialog */}
      <EditEventDialog
        event={editingEvent}
        currencies={enabledCurrencyConfigs}
        isOpen={editingEvent !== null}
        onClose={() => setEditingEvent(null)}
        onSave={handleEditSave}
      />
    </div>
  )
}
