import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardSection } from '@/components/ui'
import { formatLargeNumber, formatPercentage } from '@/shared/formatting/number-scale'
import { formatFieldDisplayName, generateSparklinePath } from '../calculations/tier-trends-calculations'
import { getTrendChangeColor, getTrendChangeIcon, getTrendSparklineColor } from '../table/trend-indicators'
import { useTierTrendsMobile } from './use-tier-trends-mobile'
import type { FieldTrendData, ComparisonColumn, TrendsAggregation } from '../types'
import { formatTrendValue } from '../table/trend-value-formatting'

interface TierTrendsMobileCardProps {
  trend: FieldTrendData
  comparisonColumns: ComparisonColumn[]
  aggregationType?: TrendsAggregation
}

export function TierTrendsMobileCard({ trend, comparisonColumns, aggregationType }: TierTrendsMobileCardProps) {
  const sparklinePath = generateSparklinePath(trend.values, 60, 20)
  const { useCompact, leftColumns, rightColumns, columnData } = useTierTrendsMobile(trend, comparisonColumns)

  // Format percentage with locale-aware decimal separator
  const formatChangePercent = (percent: number): string => {
    const sign = percent > 0 ? '+' : '';
    if (Math.abs(percent) >= 1000) {
      return `${sign}${formatPercentage(percent / 1000)}`.replace('%', 'K%');
    }
    return `${sign}${formatPercentage(percent)}`;
  };

  return (
    <MobileCard variant="elevated" className="p-4 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
      <MobileCardContent spacing="normal">
        {/* Field Name Header */}
        <MobileCardHeader>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-2 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-sm shrink-0"></div>
            <span className="font-medium text-foreground truncate">
              {formatFieldDisplayName(trend.fieldName, trend.displayName)}
            </span>
          </div>
        </MobileCardHeader>

        {/* Sparkline and Change */}
        <MobileCardSection>
          <div className="flex items-center justify-between gap-4">
            {/* Sparkline */}
            <div className="flex justify-start flex-shrink-0">
              {sparklinePath && (
                <div className="bg-muted/10 rounded-lg p-2 border border-muted/10">
                  <svg width="60" height="20" className="opacity-80">
                    <path
                      d={sparklinePath}
                      stroke={getTrendSparklineColor(trend.change.direction)}
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Change Indicators */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-muted/20 rounded-lg px-3 py-1.5">
                <span className={`font-mono text-base font-semibold ${getTrendChangeColor(trend.change)}`}>
                  {formatChangePercent(trend.change.percent)}
                </span>
                <span className={`text-base ${getTrendChangeColor(trend.change)}`}>
                  {getTrendChangeIcon(trend.change.direction)}
                </span>
              </div>
              <div className="font-mono text-sm text-muted-foreground pl-2 border-l-2 border-muted/30">
                {trend.change.absolute > 0 ? '+' : ''}{formatLargeNumber(trend.change.absolute)}
              </div>
            </div>
          </div>
        </MobileCardSection>

        {/* Comparison Data */}
        <MobileCardSection>
          {useCompact && comparisonColumns.length > 3 ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                {leftColumns.map((column, index) => {
                  const dataItem = columnData.find(d => d.column === column)!
                  return (
                    <div key={index} className="bg-muted/20 hover:bg-muted/30 rounded-lg p-3 transition-all duration-200 border border-muted/10">
                      <div className="text-xs text-muted-foreground font-medium truncate mb-1">
                        {dataItem.headerInfo.display}
                      </div>
                      <div className="font-mono text-sm text-foreground font-semibold">
                        {formatTrendValue(dataItem.value, aggregationType)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="space-y-2">
                {rightColumns.map((column, index) => {
                  const dataItem = columnData.find(d => d.column === column)!
                  return (
                    <div key={index} className="bg-muted/20 hover:bg-muted/30 rounded-lg p-3 transition-all duration-200 border border-muted/10">
                      <div className="text-xs text-muted-foreground font-medium truncate mb-1">
                        {dataItem.headerInfo.display}
                      </div>
                      <div className="font-mono text-sm text-foreground font-semibold">
                        {formatTrendValue(dataItem.value, aggregationType)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {columnData.map((dataItem, index) => (
                <div key={index} className="flex justify-between items-center py-3 px-4 bg-muted/20 hover:bg-muted/30 rounded-lg transition-all duration-200 border border-muted/10 hover:border-muted/20">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm text-foreground font-medium truncate">
                      {dataItem.headerInfo.display}
                    </span>
                    {dataItem.column.subHeader && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {dataItem.column.subHeader}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-sm text-foreground font-semibold ml-3">
                    {formatTrendValue(dataItem.value, aggregationType)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </MobileCardSection>
      </MobileCardContent>
    </MobileCard>
  )
}