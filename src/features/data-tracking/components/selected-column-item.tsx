import { X, GripVertical } from 'lucide-react'
import { ToggleSwitch } from '../../../components/ui/toggle-switch'
import type { TierStatsColumnConfig } from '../types/tier-stats-config.types'

interface SelectedColumnItemProps {
  column: TierStatsColumnConfig
  index: number
  isDragging: boolean
  isDraggedOver: boolean
  canHaveHourly: boolean
  displayName: string
  onDragStart: (index: number) => void
  onDragEnter: (index: number) => void
  onDrop: () => void
  onDragEnd: () => void
  onToggleHourlyRate: (fieldName: string) => void
  onRemove: (fieldName: string) => void
}

export function SelectedColumnItem({
  column,
  index,
  isDragging,
  isDraggedOver,
  canHaveHourly,
  displayName,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
  onToggleHourlyRate,
  onRemove
}: SelectedColumnItemProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      role="listitem"
      aria-label={`${displayName} column - drag to reorder`}
      className={`flex items-center justify-between gap-4 bg-slate-700/30 border border-slate-600/40 rounded-lg px-4 py-3 group hover:border-slate-500/60 transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isDraggedOver && !isDragging ? 'border-orange-500/60 bg-orange-500/10' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors shrink-0" aria-hidden="true" />
        <span className="text-sm text-slate-200 font-medium truncate">{displayName}</span>
        {column.showHourlyRate && (
          <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30 whitespace-nowrap">
            + /hour
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {canHaveHourly && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Show /hour:</span>
            <ToggleSwitch
              checked={column.showHourlyRate}
              onCheckedChange={() => onToggleHourlyRate(column.fieldName)}
              aria-label={`Toggle hourly rate for ${displayName}`}
            />
          </div>
        )}
        <button
          onClick={() => onRemove(column.fieldName)}
          className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded hover:bg-red-500/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Remove ${displayName} column`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
