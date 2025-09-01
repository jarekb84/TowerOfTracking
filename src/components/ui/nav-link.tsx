import { Link } from '@tanstack/react-router'
import { forwardRef } from 'react'
import { cn } from '../../shared/lib/utils'

interface NavLinkProps {
  to: string
  children: React.ReactNode
  onClick?: () => void
  isCollapsed?: boolean
  className?: string
  'aria-label'?: string
  title?: string
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, children, onClick, className, ...ariaProps }, ref) => {
    return (
      <Link
        ref={ref}
        to={to}
        onClick={onClick}
        className={cn(
          // Base styles - subtle and harmonious
          "group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-out",
          // Unselected state - subtle presence
          "text-slate-300 hover:text-slate-100",
          // Enhanced hover states with subtle background coordination
          "hover:bg-slate-800/60 hover:shadow-sm",
          // Enhanced focus styles for accessibility and keyboard navigation
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:bg-slate-800/60",
          // Subtle border enhancement on hover with smooth transition
          "hover:border-l-2 hover:border-slate-600/50 hover:pl-2.5",
          // Skip link support for screen readers
          "focus:z-10",
          className
        )}
        activeProps={{
          className: cn(
            // Selected state - noticeable but not overwhelming
            "bg-orange-500/15 text-orange-100 border-l-2 border-orange-400/80 pl-2.5",
            // Coordinated hover state for selected items
            "hover:bg-orange-500/20 hover:border-orange-400",
            // Enhanced focus for active items
            "focus-visible:ring-orange-300 focus-visible:bg-orange-500/20",
            // Subtle shadow enhancement for selected state
            "shadow-sm shadow-orange-500/10",
            // Screen reader indication
            "aria-current:page"
          )
        }}
        {...ariaProps}
      >
        {children}
      </Link>
    )
  }
)

NavLink.displayName = 'NavLink'