import { Link, useMatchRoute } from '@tanstack/react-router'
import { cn } from '@/shared/lib/utils'

export interface TabConfig {
  value: string
  route: string
  label: string
  shortLabel: string
  activeClassName: string
}

interface TabsNavigationProps {
  tabs: TabConfig[]
  ariaLabel: string
  maxWidth?: string
  columns?: number
  renderTabContent?: (tab: TabConfig, isActive: boolean) => React.ReactNode
}

/**
 * Shared route-based tabs navigation component.
 * Renders a grid of Link components that navigate to different routes.
 */
export function TabsNavigation({
  tabs,
  ariaLabel,
  maxWidth = 'max-w-5xl',
  columns = tabs.length,
  renderTabContent,
}: TabsNavigationProps) {
  // useMatchRoute handles basepath automatically, matching how Link's activeProps works
  const matchRoute = useMatchRoute()

  // Determine grid columns class based on count
  const getGridColsClass = () => {
    switch (columns) {
      case 3:
        return 'grid-cols-3'
      case 4:
        return 'grid-cols-2 sm:grid-cols-4'
      case 7:
        return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7'
      case 8:
        return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8'
      case 9:
        return 'grid-cols-3 sm:grid-cols-3 lg:grid-cols-9'
      default:
        return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8'
    }
  }

  return (
    <div className="flex justify-center mb-8">
      <div
        className={cn(
          'grid w-full gap-1 p-1.5 rounded-xl',
          'bg-slate-800/60 backdrop-blur-sm border border-slate-700/30',
          'shadow-lg shadow-slate-950/20',
          getGridColsClass(),
          maxWidth
        )}
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const isActive = !!matchRoute({ to: tab.route })

          return (
            <Link
              key={tab.value}
              to={tab.route}
              role="tab"
              aria-selected={isActive}
              data-active={isActive}
              className={cn(
                'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800',
                'focus:z-10',
                isActive
                  ? 'shadow-md shadow-slate-950/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:shadow-sm',
                tab.activeClassName
              )}
            >
              {renderTabContent ? (
                renderTabContent(tab, isActive)
              ) : (
                <>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
