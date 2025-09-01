import { cn } from '../../shared/lib/utils'

interface NavSectionProps {
  id: string
  label: string
  isCollapsed: boolean
  showDivider?: boolean
  children: React.ReactNode
  className?: string
}

export function NavSection({ 
  id, 
  label, 
  isCollapsed, 
  showDivider = false, 
  children, 
  className 
}: NavSectionProps) {
  return (
    <div className={cn("mb-6 animate-in fade-in-0 slide-in-from-left-2 duration-300", className)}>
      {/* Section header - only shown when expanded */}
      {!isCollapsed && (
        <h3 
          className="px-4 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          id={`section-${id}`}
        >
          {label}
        </h3>
      )}
      
      {/* Subtle divider for collapsed mode */}
      {isCollapsed && showDivider && (
        <div className="px-3 mb-3" aria-hidden="true">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent"></div>
        </div>
      )}

      {/* Navigation items */}
      <ul 
        className="space-y-1 px-2" 
        role="group"
        aria-labelledby={!isCollapsed ? `section-${id}` : undefined}
      >
        {children}
      </ul>
    </div>
  )
}