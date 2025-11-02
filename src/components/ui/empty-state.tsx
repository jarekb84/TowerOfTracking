import * as React from 'react'
import { cn } from '../../shared/lib/utils'

interface EmptyStateProps extends React.ComponentProps<'div'> {
  /**
   * The empty state message to display
   */
  children: React.ReactNode
  /**
   * Optional icon to display above the message
   */
  icon?: React.ReactNode
}

export function EmptyState({
  children,
  icon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-slate-700/30 border border-slate-600/30 rounded-lg p-4',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex justify-center mb-2">
          <div className="text-slate-500">
            {icon}
          </div>
        </div>
      )}
      <p className="text-sm text-slate-400 text-center">
        {children}
      </p>
    </div>
  )
}
