/**
 * Plain Fields Group Component
 *
 * Displays a group of plain fields without percentage bars.
 * Used for fields that don't sum to a meaningful total.
 */

import type { PlainFieldsData } from '../types'
import { formatFieldDisplayName } from '@/shared/domain/fields/field-formatters'

interface PlainFieldsGroupProps {
  data: PlainFieldsData
}

export function PlainFieldsGroup({ data }: PlainFieldsGroupProps) {
  if (data.items.length === 0) {
    return null
  }

  // Use styled container when group has a label (consistent with BreakdownGroup)
  const containerClass = data.label
    ? "rounded-lg bg-muted/10 border border-border/30 p-4 sm:p-5 space-y-3 sm:space-y-4 transition-all duration-200 hover:bg-muted/15 hover:border-border/50"
    : "space-y-3 sm:space-y-4"

  // Calculate rows for column-first ordering (first half in col1, second half in col2)
  const rowCount = Math.ceil(data.items.length / 2)

  return (
    <div className={containerClass}>
      {/* Optional header label - matches BreakdownGroup styling */}
      {data.label && (
        <h6 className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide font-medium">
          {data.label}
        </h6>
      )}

      {/* Fields in column-first grid: first half in col1, second half in col2 */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 sm:gap-y-2 sm:grid-flow-col"
        style={{ gridTemplateRows: `repeat(${rowCount}, auto)` }}
      >
        {data.items.map(item => (
          <div
            key={item.fieldName}
            className="group flex items-center justify-between gap-2 py-1.5 sm:py-2 px-2 rounded-sm hover:bg-muted/30 transition-colors duration-200"
          >
            <span
              className="text-xs sm:text-sm text-muted-foreground truncate transition-colors duration-200 group-hover:text-foreground/80"
              title={formatFieldDisplayName(item.fieldName)}
            >
              {item.displayName}
            </span>
            <span className="text-xs sm:text-sm font-mono font-medium text-foreground flex-shrink-0">
              {item.displayValue}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
