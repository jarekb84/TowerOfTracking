/**
 * Event Pill Component
 *
 * Draggable pill displaying a spending event in the queue.
 * Supports event chaining with visual snapping.
 */

import { cn } from '@/shared/lib/utils'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import type { SpendingEvent } from '../types'
import { getCurrencyConfig, getCurrencyVisualStyles } from '../currencies/currency-config'
import { EventPillActions } from './event-pill-actions'
import { createEventDragHandlers, createEventActionHandlers } from './event-pill-handlers'
import { ChainIcon } from './chain-icon'

interface DragHandleIconProps {
  className?: string
}

/** Drag handle SVG icon */
function DragHandleIcon({ className }: DragHandleIconProps) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="currentColor" viewBox="0 0 20 20">
      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
    </svg>
  )
}

interface EventPillHandleProps {
  isChained: boolean
  canChain: boolean
  onChainClick: () => void
}

/** Handle/chain icon for the left side of the pill */
function EventPillHandle({ isChained, canChain, onChainClick }: EventPillHandleProps) {
  // Shared base styles for the handle area
  const baseStyles = cn(
    'flex items-center justify-center w-8',
    'border-r border-slate-600/30',
    'transition-all duration-150'
  )

  if (isChained) {
    return (
      <button
        type="button"
        onClick={onChainClick}
        className={cn(
          baseStyles,
          'cursor-pointer',
          'hover:bg-orange-500/10',
          'group'
        )}
        title="Click to unchain this event"
      >
        <ChainIcon active className="group-hover:text-orange-400" />
      </button>
    )
  }

  if (canChain) {
    return (
      <button
        type="button"
        onClick={onChainClick}
        className={cn(
          baseStyles,
          'cursor-pointer',
          'text-slate-500',
          'hover:bg-slate-700/50 hover:text-slate-400',
          'group'
        )}
        title="Click to chain to previous event"
      >
        {/* Show chain icon on hover to hint at chaining capability */}
        <DragHandleIcon className="group-hover:hidden" />
        <ChainIcon active={false} className="hidden group-hover:block" />
      </button>
    )
  }

  // First event: cannot chain, only drag
  return (
    <div
      className={cn(
        baseStyles,
        'cursor-grab active:cursor-grabbing',
        'text-slate-500 hover:text-slate-400'
      )}
      title="Drag to reorder"
    >
      <DragHandleIcon />
    </div>
  )
}

interface EventPillProps {
  event: SpendingEvent
  index: number
  isDragging: boolean
  isDraggedOver: boolean
  /** Whether this event is chained to the previous event */
  isChained: boolean
  /** Whether this event can be chained (not the first event) */
  canChain: boolean
  /** Whether this event has a dependent chained to it (chain head with followers) */
  hasChainedDependent: boolean
  onDragStart: (index: number) => void
  onDragEnter: (index: number) => void
  onDragEnd: () => void
  onRemove: (eventId: string) => void
  onEdit: (event: SpendingEvent) => void
  onClone: (eventId: string) => void
  onToggleChain: (eventId: string) => void
}

export function EventPill({
  event,
  index,
  isDragging,
  isDraggedOver,
  isChained,
  canChain,
  hasChainedDependent,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onRemove,
  onEdit,
  onClone,
  onToggleChain,
}: EventPillProps) {
  const config = getCurrencyConfig(event.currencyId)
  const visualStyles = getCurrencyVisualStyles(event.currencyId)
  const formattedAmount = formatLargeNumber(event.amount)

  const dragHandlers = createEventDragHandlers(index, onDragStart, onDragEnter)
  const actionHandlers = createEventActionHandlers(event, onEdit, onClone, onRemove)

  // Chained events cannot be dragged individually
  const isDraggable = !isChained

  const handleChainClick = () => {
    onToggleChain(event.id)
  }

  return (
    <div
      draggable={isDraggable}
      onDragStart={isDraggable ? dragHandlers.onDragStart : undefined}
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
        isDraggedOver && 'border-orange-500/70 bg-slate-700/70',
        // Horizontal snapping for chained events: remove left border/rounded corners, add top accent
        isChained && 'border-l-0 rounded-l-none -ml-px border-t-orange-500/50',
        // Chain heads with dependents: square right border for continuous chain appearance
        hasChainedDependent && 'rounded-r-none'
      )}
    >
      {/* Left side: Chain icon, chain toggle, or drag handle */}
      <EventPillHandle
        isChained={isChained}
        canChain={canChain}
        onChainClick={handleChainClick}
      />

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
