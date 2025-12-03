import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { getAccentColorClasses, type AccentColor } from './accent-colors'

interface ChartPageLayoutProps {
  /** The accent color theme for the chart page */
  accentColor: AccentColor
  /** The main title displayed in the card header */
  title: string
  /** Description text shown below the title */
  description: ReactNode
  /** The chart/content to render inside the card */
  children: ReactNode
  /**
   * Whether to use responsive padding (no horizontal padding on mobile).
   * Default is false (standard px-8 padding).
   */
  responsivePadding?: boolean
  /**
   * Additional classes for the content wrapper div.
   * Useful for adding space-y-* or other layout utilities.
   */
  contentClassName?: string
}

/**
 * Common layout component for all chart analytics pages.
 * Provides consistent card styling with color-themed header and accent bar.
 *
 * @example
 * <ChartPageLayout
 *   accentColor="emerald"
 *   title="Coins Analysis"
 *   description="Track your coin earnings over time"
 * >
 *   <TimeSeriesChart metric="coinsEarned" />
 * </ChartPageLayout>
 */
export function ChartPageLayout({
  accentColor,
  title,
  description,
  children,
  responsivePadding = false,
  contentClassName = '',
}: ChartPageLayoutProps) {
  const colors = getAccentColorClasses(accentColor)

  const paddingClasses = responsivePadding
    ? 'px-0 pb-8 pt-4 md:px-8'
    : 'px-8 pb-8 pt-4'

  return (
    <Card className={`chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 shadow-2xl ${colors.hoverShadow} transition-all duration-300`}>
      <CardHeader className={`${colors.headerGradient} border-b border-slate-700/50`}>
        <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
          <div className={`w-2 h-8 ${colors.accentBar} rounded-full shadow-lg ${colors.accentBarShadow}`}></div>
          {title}
        </CardTitle>
        <p className="text-slate-400 text-sm mt-2">
          {description}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`${paddingClasses} w-full ${contentClassName}`.trim()}>
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
