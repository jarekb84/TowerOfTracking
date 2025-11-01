import type { FieldTrendData, ComparisonColumn, TrendsAggregation } from '@/features/data-tracking/types/game-run.types'
import { TierTrendsMobileCard } from '../mobile/tier-trends-mobile-card'
import { useViewport } from '@/shared/hooks/use-viewport'
import { formatNumber } from '@/features/analysis/shared/parsing/data-parser'
import { formatFieldDisplayName, generateSparklinePath } from '../calculations/tier-trends-calculations'
import { getTrendChangeColor, getTrendChangeIcon, getTrendSparklineColor } from './trend-indicators'
import { parseColumnHeader, getHeaderLineClasses } from './column-header-renderer'
import { formatTrendValue } from './trend-value-formatting'

interface TierTrendsTableProps {
  trends: FieldTrendData[]
  comparisonColumns: ComparisonColumn[]
  sortField: 'fieldName' | 'change'
  sortDirection: 'asc' | 'desc'
  onSort: (field: 'fieldName' | 'change') => void
  searchTerm?: string
  isSearchActive?: boolean
  hasMatches?: boolean
  changeThreshold?: number
  aggregationType?: TrendsAggregation
}

export function TierTrendsTable({
  trends,
  comparisonColumns,
  sortField,
  sortDirection,
  onSort,
  searchTerm,
  isSearchActive,
  hasMatches,
  changeThreshold = 0,
  aggregationType
}: TierTrendsTableProps) {
  const viewportSize = useViewport({ breakpoint: 'md' });
  
  if (trends.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        {!hasMatches && isSearchActive && searchTerm
          ? `No fields match "${searchTerm}". Try a different search term.`
          : changeThreshold === 0 
            ? "No data available for the selected filters."
            : `No changes found above ${changeThreshold}% threshold. Try lowering the change threshold.`
        }
      </div>
    )
  }

  return (
    <>
      {viewportSize === 'desktop' ? (
        /* Desktop Table View - Non-Virtualized for Reliability */
        <div className="overflow-hidden rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm shadow-sm">
          <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border/50 bg-background/95 backdrop-blur-sm">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    <button 
                      onClick={() => onSort('fieldName')}
                      className="flex items-center gap-1 hover:text-foreground/90 transition-colors"
                    >
                      Field Name
                      {sortField === 'fieldName' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                    Trend
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                    <button 
                      onClick={() => onSort('change')}
                      className="flex items-center gap-1 hover:text-foreground/90 transition-colors ml-auto"
                    >
                      Change %
                      {sortField === 'change' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                    Value Change
                  </th>
                  {comparisonColumns.map((column, index) => {
                    const headerData = parseColumnHeader(column.header);
                    return (
                      <th key={index} className="px-3 py-4 text-center text-sm font-semibold text-foreground min-w-[80px]">
                        <div className="flex flex-col">
                          {headerData.isMultiLine ? (
                            <div className="flex flex-col">
                              {headerData.lines.map((line, lineIndex) => (
                                <div 
                                  key={lineIndex}
                                  className={getHeaderLineClasses(lineIndex, headerData.lines.length)}
                                >
                                  {line}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="whitespace-nowrap">{column.header}</div>
                          )}
                          {column.subHeader && (
                            <div className="text-xs text-muted-foreground font-normal">{column.subHeader}</div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {trends.map((trend, index) => (
                  <SimpleTrendRow
                    key={trend.fieldName}
                    trend={trend}
                    index={index}
                    comparisonColumns={comparisonColumns}
                    aggregationType={aggregationType}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mobile Card View */
        <div className="px-2 py-4 space-y-4 max-w-none">
          <div className="space-y-4">
            {trends.map((trend) => (
              <TierTrendsMobileCard
                key={trend.fieldName}
                trend={trend}
                comparisonColumns={comparisonColumns}
                aggregationType={aggregationType}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

interface SimpleTrendRowProps {
  trend: FieldTrendData;
  index: number;
  comparisonColumns: ComparisonColumn[];
  aggregationType?: TrendsAggregation;
}

function SimpleTrendRow({ trend, index, comparisonColumns, aggregationType }: SimpleTrendRowProps) {
  const isEven = index % 2 === 0;
  const rowBg = isEven 
    ? 'bg-gradient-to-r from-muted/15 via-muted/8 to-muted/15' 
    : 'bg-gradient-to-r from-muted/25 via-muted/12 to-muted/25';
  
  const sparklinePath = generateSparklinePath(trend.values, 60, 20);

  return (
    <tr className={`border-b border-border/40 transition-all duration-200 hover:bg-gradient-to-r hover:from-orange-500/8 hover:via-orange-500/4 hover:to-orange-500/8 hover:border-orange-500/30 ${rowBg}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-sm"></div>
          <span className="font-medium text-foreground">{formatFieldDisplayName(trend.fieldName, trend.displayName)}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex justify-center">
          {sparklinePath && (
            <svg width="60" height="20" className="opacity-80 transition-opacity duration-200 hover:opacity-100">
              <path
                d={sparklinePath}
                stroke={getTrendSparklineColor(trend.change.direction)}
                strokeWidth="2"
                fill="none"
              />
            </svg>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center gap-1.5 justify-end">
          <span className={`font-mono text-base font-semibold ${getTrendChangeColor(trend.change)}`}>
            {trend.change.percent > 0 ? '+' : ''}
            {Math.abs(trend.change.percent) >= 1000 
              ? `${(trend.change.percent / 1000).toFixed(1)}K` 
              : trend.change.percent.toFixed(1)}%
          </span>
          <span className={`text-base ${getTrendChangeColor(trend.change)}`}>
            {getTrendChangeIcon(trend.change.direction)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`font-mono text-sm font-medium ${getTrendChangeColor(trend.change)}`}>
          {trend.change.absolute > 0 ? '+' : ''}{formatNumber(trend.change.absolute)}
        </span>
      </td>
      {comparisonColumns.map((column, index) => (
        <td key={index} className="px-3 py-4 text-center">
          <span className="font-mono text-sm text-foreground font-medium">
            {formatTrendValue(column.values[trend.fieldName] || 0, aggregationType)}
          </span>
        </td>
      ))}
    </tr>
  );
}