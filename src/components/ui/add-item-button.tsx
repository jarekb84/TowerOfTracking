import * as React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '../../shared/lib/utils'

export interface AddItemButtonProps extends React.ComponentProps<'button'> {
  children: React.ReactNode
  icon?: React.ReactNode
}

export function AddItemButton({
  children,
  icon = <Plus className="w-4 h-4" />,
  className,
  ...props
}: AddItemButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'group flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-200',
        'bg-slate-700/30 border-slate-600/30',
        'hover:bg-slate-700/50 hover:border-slate-500/50 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:border-orange-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-700/30 disabled:hover:border-slate-600/30',
        className
      )}
      {...props}
    >
      <span className="shrink-0 text-slate-400 group-hover:text-orange-400 transition-colors">
        {icon}
      </span>
      <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors truncate">
        {children}
      </span>
    </button>
  )
}
