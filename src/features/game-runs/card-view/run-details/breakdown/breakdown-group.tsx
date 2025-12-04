/**
 * Breakdown Group Component
 *
 * Displays a group of breakdown metrics with a header showing the total,
 * followed by individual breakdown bars for each source.
 */

import type { BreakdownGroupData } from '../types'
import { BreakdownBar } from './breakdown-bar'

interface BreakdownGroupProps {
  data: BreakdownGroupData
}

export function BreakdownGroup({ data }: BreakdownGroupProps) {
  return (
    <div className="rounded-lg bg-muted/10 border border-border/30 p-4 sm:p-5 space-y-4 transition-all duration-200 hover:bg-muted/15 hover:border-border/50">
      {/* Header: number first, then label, inline */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-lg sm:text-xl font-semibold font-mono text-foreground">
          {data.totalDisplayValue}
        </span>
        <h6 className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide font-medium">
          {data.label}
        </h6>
        {data.perHourDisplayValue && (
          <span className="text-xs sm:text-sm text-muted-foreground/70">
            ({data.perHourDisplayValue}/hr)
          </span>
        )}
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2.5 sm:space-y-3">
        {data.items.map(item => (
          <BreakdownBar key={item.fieldName} item={item} />
        ))}
      </div>
    </div>
  )
}
