/**
 * Timeline Events Grid Component
 *
 * Grid-based layout for rendering events that can span multiple weeks.
 * Uses CSS Grid to position events across columns.
 */

import { useMemo } from 'react'
import type { TimelineEvent } from '../types'
import { TimelineEventPill } from './timeline-event-pill'
import { calculateEventPositions } from './event-positioning'

interface TimelineEventsGridProps {
  events: TimelineEvent[]
  weeks: number
  labelWidth: number
  columnWidth: number
  startingColumnWidth: number
}

export function TimelineEventsGrid({
  events,
  weeks,
  labelWidth,
  columnWidth,
  startingColumnWidth,
}: TimelineEventsGridProps) {
  const positionedEvents = useMemo(
    () => calculateEventPositions(events, weeks),
    [events, weeks]
  )

  const maxRows = useMemo(() => {
    if (positionedEvents.length === 0) return 1
    return Math.max(...positionedEvents.map((e) => e.row)) + 1
  }, [positionedEvents])

  if (events.length === 0) {
    return (
      <div className="flex border-t border-slate-700/50">
        <div
          className="shrink-0 border-r border-slate-700/50 px-2 py-2 text-xs text-slate-400 font-medium"
          style={{ width: labelWidth }}
        >
          Events
        </div>
        {/* Starting column spacer - only show if startingColumnWidth > 0 (columns mode) */}
        {startingColumnWidth > 0 && (
          <div
            className="shrink-0 border-r-2 border-slate-600/50 bg-slate-800/30"
            style={{ width: startingColumnWidth }}
          />
        )}
        <div className="flex-1 p-2 text-xs text-slate-500 italic">
          No events scheduled
        </div>
      </div>
    )
  }

  return (
    <div className="flex border-t border-slate-700/50">
      {/* Events label */}
      <div
        className="shrink-0 border-r border-slate-700/50 px-2 py-2 text-xs text-slate-400 font-medium"
        style={{ width: labelWidth }}
      >
        Events
      </div>

      {/* Starting column spacer - only show if startingColumnWidth > 0 (columns mode) */}
      {startingColumnWidth > 0 && (
        <div
          className="shrink-0 border-r-2 border-slate-600/50 bg-slate-800/30"
          style={{ width: startingColumnWidth }}
        />
      )}

      {/* Events grid - uses CSS Grid matching the week columns above */}
      <div
        className="relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${weeks}, ${columnWidth}px)`,
          gridTemplateRows: `repeat(${maxRows}, auto)`,
          gap: '4px 0', /* vertical gap only, columns are flush */
          padding: '4px 0',
          minHeight: maxRows * 40,
        }}
      >
        {positionedEvents.map(({ event, startWeek, spanWeeks, row }) => (
          <div
            key={event.event.id}
            className="px-0.5" /* small horizontal padding within each cell */
            style={{
              gridColumn: `${startWeek + 1} / span ${spanWeeks}`,
              gridRow: row + 1,
            }}
          >
            <TimelineEventPill
              timelineEvent={event}
              weekSpan={spanWeeks}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
