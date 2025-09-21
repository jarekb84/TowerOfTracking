import { cn } from '../../shared/lib/utils'

interface NavCollapseButtonProps {
  isCollapsed: boolean
  onClick: () => void
  className?: string
}

export function NavCollapseButton({ isCollapsed, onClick, className }: NavCollapseButtonProps) {
  return (
    <div className={cn("border-t border-slate-700/30", className)}>
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200",          
          "text-slate-400 hover:text-slate-100",
          // Enhanced hover state
          "hover:bg-slate-800/40 hover:shadow-sm",
          // Focus accessibility
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:bg-slate-800/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        )}
        aria-label={isCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
      >
        <svg 
          className={cn(
            "w-4 h-4 transition-all duration-300 flex-shrink-0",
            isCollapsed ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
          )}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7" 
          />
        </svg>
        
        {!isCollapsed && (
          <span className="truncate transition-opacity duration-200">
            Collapse
          </span>
        )}
      </button>
    </div>
  )
}