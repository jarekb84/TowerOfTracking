import * as React from "react"
import { cn } from "../../shared/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Width constraint for the select */
  width?: 'auto' | 'full' | 'sm' | 'md' | 'lg'
}

const widthClasses = {
  auto: 'w-auto',
  full: 'w-full',
  sm: 'w-24',
  md: 'w-32',
  lg: 'w-40'
} as const

/**
 * Styled select component with consistent dark theme styling.
 *
 * Provides consistent appearance across the application for native
 * HTML select elements with proper focus states and dark theme support.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, width = 'auto', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          // Base styles - min-h-[44px] matches Button component for consistent vertical alignment
          "flex h-9 min-h-[44px] rounded-md border border-input bg-background px-3 py-1.5",
          // Typography
          "text-sm text-foreground",
          // Focus and interaction states
          "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          // Hover state
          "hover:border-accent/50",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Custom cursor
          "cursor-pointer",
          // Width
          widthClasses[width],
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = "Select"
