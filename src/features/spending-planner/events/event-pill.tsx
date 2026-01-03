/**
 * Event Pill Component
 *
 * Draggable pill displaying a spending event in the queue.
 */

import { cn } from '@/shared/lib/utils'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import type { SpendingEvent } from '../types'
import { getCurrencyConfig, getCurrencyVisualStyles } from '../currencies/currency-config'
import { EventPillActions } from './event-pill-actions'
import { createEventDragHandlers, createEventActionHandlers } from './event-pill-handlers'

interface EventPillProps {
  event: SpendingEvent
  index: number
  isDragging: boolean
  isDraggedOver: boolean
  onDragStart: (index: number) => void
  onDragEnter: (index: number) => void
  onDragEnd: () => void
  onRemove: (eventId: string) => void
  onEdit: (event: SpendingEvent) => void
  onClone: (eventId: string) => void
}

export function EventPill({
  event,
  index,
  isDragging,
  isDraggedOver,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onRemove,
  onEdit,
  onClone,
}: EventPillProps) {
  const config = getCurrencyConfig(event.currencyId)
  const visualStyles = getCurrencyVisualStyles(event.currencyId)
  const formattedAmount = formatLargeNumber(event.amount)

  const dragHandlers = createEventDragHandlers(index, onDragStart, onDragEnter)
  const actionHandlers = createEventActionHandlers(event, onEdit, onClone, onRemove)

  return (
    <div
      draggable
      onDragStart={dragHandlers.onDragStart}
      onDragEnter={dragHandlers.onDragEnter}
      onDragOver={dragHandlers.onDragOver}
      onDrop={dragHandlers.onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'relative flex rounded-lg border',
        'bg-slate-800/50 border-slate-600/50',
        'hover:bg-slate-700/50 hover:border-slate-500/50',
        'transition-all duration-150',
        'min-w-[160px] max-w-[200px]',
        isDragging && 'opacity-50',
        isDraggedOver && 'border-orange-500/70 bg-slate-700/70'
      )}
    >
      {/* Drag handle on left */}
      <div className="flex items-center justify-center px-1.5 border-r border-slate-600/30 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {/* Content area with subtle currency color gradient */}
      <div className={cn(
        'flex-1 flex flex-col py-2 px-2 min-w-0 rounded-r-lg',
        visualStyles.bgGradient
      )}>
        <span className="text-sm text-slate-200 font-medium truncate">{event.name}</span>
        <span className={cn('text-xs mt-0.5', config.color)}>
          -{formattedAmount} {config.abbreviation}
        </span>
        {event.durationDays && (
          <span className="text-xs text-slate-400 mt-0.5">
            {event.durationDays} day{event.durationDays !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <EventPillActions
        eventName={event.name}
        onEdit={actionHandlers.onEdit}
        onClone={actionHandlers.onClone}
        onRemove={actionHandlers.onRemove}
      />
    </div>
  )
}
