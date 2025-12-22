import * as React from "react"
import { cn } from "../../shared/lib/utils"

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Width constraint for the select */
  width?: 'auto' | 'full' | 'sm' | 'md' | 'lg'
  /** Size variant matching Button component sizes */
  size?: 'default' | 'sm' | 'compact'
  /** Native HTML size attribute for multi-select */
  htmlSize?: number
}

const widthClasses = {
  auto: 'w-auto',
  full: 'w-full',
  sm: 'w-24',
  md: 'w-32',
  lg: 'w-40'
} as const

const sizeClasses = {
  default: 'h-9 min-h-[44px] px-3 py-1.5 text-sm',
  sm: 'h-9 min-h-[44px] px-3 py-1.5 text-sm',
  compact: 'h-8 min-h-0 px-2.5 py-1 text-sm [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:min-h-[44px]',
} as const

/**
 * Styled select component with consistent dark theme styling.
 *
 * Provides consistent appearance across the application for native
 * HTML select elements with proper focus states and dark theme support.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, width = 'auto', size = 'default', htmlSize, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        size={htmlSize}
        className={cn(
          // Base styles
          "flex rounded-md border border-input bg-background",
          // Size variant
          sizeClasses[size],
          // Typography
          "text-foreground",
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
