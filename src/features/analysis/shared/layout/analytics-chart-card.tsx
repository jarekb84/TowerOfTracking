import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { cn } from '@/shared/lib/utils'

interface AnalyticsChartCardProps {
  title: string
  subtitle?: string
  color: string
  children: ReactNode
  headerActions?: ReactNode
  className?: string
}

export function AnalyticsChartCard({
  title,
  subtitle,
  color,
  children,
  headerActions,
  className
}: AnalyticsChartCardProps) {
  return (
    <Card className={cn(
      "chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl transition-all duration-300",
      className
    )}
    style={{
      // @ts-expect-error - CSS custom property
      '--hover-shadow-color': `${color}1a`
    }}
    >
      <CardHeader
        className="border-b border-slate-700/50 p-4 sm:p-6"
        style={{
          backgroundImage: `linear-gradient(to right, ${color}1a, transparent, ${color}1a)`
        }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-100 flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div
              className="w-1.5 sm:w-2 h-6 sm:h-8 rounded-full shadow-lg shrink-0"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${color}cc, ${color})`,
                boxShadow: `0 4px 12px ${color}30`
              }}
            />
            <span className="truncate">{title}</span>
            {subtitle && (
              <span className="hidden sm:inline text-sm font-normal text-muted-foreground ml-auto">
                {subtitle}
              </span>
            )}
          </CardTitle>
          {headerActions && (
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {headerActions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 sm:p-6 md:p-8 w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
