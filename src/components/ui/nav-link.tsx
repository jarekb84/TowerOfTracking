import { Link } from '@tanstack/react-router'
import { forwardRef } from 'react'
import { cn } from '../../shared/lib/utils'
import { isExternalUrl, createNavLinkClassName, createActiveNavLinkClassName } from './nav-link-utils'

interface NavLinkProps {
  to: string
  children: React.ReactNode
  onClick?: () => void
  className?: string
  'aria-label'?: string
  title?: string
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, children, onClick, className, ...ariaProps }, ref) => {
    const isExternal = isExternalUrl(to)
    const linkClassName = cn(createNavLinkClassName(), className)

    if (isExternal) {
      return (
        <a
          ref={ref}
          href={to}
          onClick={onClick}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          {...ariaProps}
        >
          {children}
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
          />          
        </a>
      )
    }

    return (
      <Link
        ref={ref}
        to={to}
        onClick={onClick}
        className={linkClassName}
        activeProps={{
          className: cn(createActiveNavLinkClassName())
        }}
        {...ariaProps}
      >
        {children}
      </Link>
    )
  }
)

NavLink.displayName = 'NavLink'