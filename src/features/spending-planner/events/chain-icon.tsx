/**
 * Chain Icon Component
 *
 * Chain link icon for indicating chained events.
 * Uses lucide-react Link icon with custom styling for active/inactive states.
 */

import { Link } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ChainIconProps {
  className?: string
  /** Whether the chain is active (orange) or inactive (gray) */
  active?: boolean
  /** Size variant for the icon */
  size?: 'sm' | 'default'
}

export function ChainIcon({ className, active = true, size = 'default' }: ChainIconProps) {
  const sizeValue = size === 'sm' ? 14 : 16

  return (
    <Link
      size={sizeValue}
      className={cn(
        'transition-colors duration-150',
        active ? 'text-orange-500' : 'text-slate-500',
        className
      )}
    />
  )
}
