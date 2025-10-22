import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../shared/lib/utils'

export interface RemovableBadgeProps {
  children: React.ReactNode
  onRemove: () => void
  subtitle?: string
  className?: string
  'aria-label'?: string
}

export function RemovableBadge({
  children,
  onRemove,
  subtitle,
  className,
  'aria-label': ariaLabel,
}: RemovableBadgeProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200',
        'bg-slate-700/50 border-slate-600/50',
        'hover:border-slate-500 hover:bg-slate-700/70 hover:shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm text-slate-200 truncate">{children}</span>
        {subtitle && (
          <span className="text-xs text-slate-400 shrink-0">{subtitle}</span>
        )}
      </div>
      <button
        onClick={onRemove}
        aria-label={ariaLabel || `Remove ${children}`}
        className={cn(
          'shrink-0 rounded p-0.5 transition-all duration-200',
          'text-slate-400 hover:text-red-400 hover:bg-red-400/10',
          'opacity-0 group-hover:opacity-100',
          'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50'
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
