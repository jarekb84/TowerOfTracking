import * as React from 'react'
import { cn } from '../../shared/lib/utils'

export interface LoadingStateProps extends React.ComponentProps<'div'> {
  /**
   * Number of skeleton rows to display
   */
  rows?: number
  /**
   * Height of the loading area
   */
  height?: string
}

export function LoadingState({
  rows = 3,
  height = '400px',
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{ height }}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      {...props}
    >
      <div className="space-y-4 w-full max-w-4xl px-6">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-slate-700/30 via-slate-600/40 to-slate-700/30 bg-[length:200%_100%] animate-shimmer rounded-lg h-16 border border-slate-600/30"
            style={{
              animation: `shimmer 2s ease-in-out infinite`,
              animationDelay: `${index * 0.15}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Compact loading skeleton for inline use
 */
export function LoadingStateSkeleton({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-slate-700/30 via-slate-600/40 to-slate-700/30 rounded-lg animate-pulse',
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}
