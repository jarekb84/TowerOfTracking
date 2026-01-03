/**
 * Timeline Event Pill Component
 *
 * Compact pill showing an event in the timeline grid.
 * Supports duration spans for labs.
 */

import { cn } from '@/shared/lib/utils'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import type { TimelineEvent } from '../types'
import { getCurrencyConfig } from '../currencies/currency-config'
import { durationToWeeks } from './timeline-utils'

interface TimelineEventPillProps {
  timelineEvent: TimelineEvent
  /** Number of weeks this event spans (1 for instant, more for labs) */
  weekSpan?: number
}

export function TimelineEventPill({ timelineEvent, weekSpan = 1 }: TimelineEventPillProps) {
  const { event } = timelineEvent
  const config = getCurrencyConfig(event.currencyId)
  const formattedAmount = formatLargeNumber(event.amount)

  // Check if this event spans multiple weeks (for styling purposes)
  const isSpanning = weekSpan > 1 || (event.durationDays ? durationToWeeks(event.durationDays) > 1 : false)

  return (
    <div
      className={cn(
        'flex flex-col p-1.5 rounded border text-xs h-full',
        'bg-slate-700/60 border-slate-600/50',
        'hover:bg-slate-600/60 transition-colors',
        isSpanning && 'relative overflow-hidden'
      )}
      title={`${event.name}: ${formattedAmount} ${config.abbreviation}${event.durationDays ? ` (${event.durationDays} days)` : ''}`}
    >
      {/* Event name */}
      <span className="text-slate-200 font-medium truncate text-[11px] leading-tight">
        {event.name}
      </span>

      {/* Cost */}
      <span className={cn('text-[10px] leading-tight', config.color)}>
        -{formattedAmount}
      </span>

      {/* Duration indicator for spanning events */}
      {isSpanning && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500/50 to-orange-500/20" />
      )}
    </div>
  )
}
