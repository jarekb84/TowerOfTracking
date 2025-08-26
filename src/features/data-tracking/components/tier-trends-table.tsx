import { formatNumber } from '../utils/data-parser'
import { formatFieldDisplayName, generateSparklinePath } from '../utils/tier-trends'
import type { FieldTrendData, ComparisonColumn } from '../types/game-run.types'
import { parseColumnHeader, getHeaderLineClasses } from './tier-trends-table/column-header-renderer'

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
  changeThreshold = 0
}: TierTrendsTableProps) {
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
    <div className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-gradient-to-r from-slate-700/20 via-slate-600/10 to-slate-700/20">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                <button 
                  onClick={() => onSort('fieldName')}
                  className="flex items-center gap-1 hover:text-slate-100 transition-colors"
                >
                  Field Name
                  {sortField === 'fieldName' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-200">
                Trend
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">
                <button 
                  onClick={() => onSort('change')}
                  className="flex items-center gap-1 hover:text-slate-100 transition-colors ml-auto"
                >
                  Change %
                  {sortField === 'change' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">
                Value Change
              </th>
              {comparisonColumns.map((column, index) => {
                const headerData = parseColumnHeader(column.header)
                return (
                  <th key={index} className="px-3 py-4 text-center text-sm font-semibold text-slate-200 min-w-[80px]">
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
                        <div className="text-xs text-slate-400 font-normal">{column.subHeader}</div>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {trends.map((trend, index) => (
              <TrendRow 
                key={trend.fieldName} 
                trend={trend} 
                index={index}
                comparisonColumns={comparisonColumns}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface TrendRowProps {
  trend: FieldTrendData
  index: number
  comparisonColumns: ComparisonColumn[]
}

function TrendRow({ trend, index, comparisonColumns }: TrendRowProps) {
  const isEven = index % 2 === 0
  const rowBg = isEven 
    ? 'bg-gradient-to-r from-slate-800/20 via-slate-700/10 to-slate-800/20' 
    : 'bg-gradient-to-r from-slate-700/20 via-slate-600/10 to-slate-700/20'
  
  const sparklinePath = generateSparklinePath(trend.values, 60, 20)
  
  // Color coding based on change direction
  const getChangeColor = (change: FieldTrendData['change']) => {
    if (change.direction === 'up') return 'text-emerald-300'
    if (change.direction === 'down') return 'text-red-300'
    return 'text-slate-300'
  }

  return (
    <tr className={`border-b border-slate-700/30 transition-all duration-200 hover:bg-gradient-to-r hover:from-orange-500/10 hover:via-orange-500/5 hover:to-orange-500/10 ${rowBg}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-sm"></div>
          <span className="font-medium text-slate-100">{formatFieldDisplayName(trend.fieldName, trend.displayName)}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex justify-center">
          {sparklinePath && (
            <svg width="60" height="20" className="opacity-70">
              <path
                d={sparklinePath}
                stroke={trend.change.direction === 'up' ? '#10b981' : trend.change.direction === 'down' ? '#ef4444' : '#64748b'}
                strokeWidth="2"
                fill="none"
              />
            </svg>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center gap-1 justify-end">
          <span className={`font-mono text-lg ${getChangeColor(trend.change)}`}>
            {trend.change.percent > 0 ? '+' : ''}{trend.change.percent.toFixed(1)}%
          </span>
          <span className="text-lg">
            {trend.change.direction === 'up' ? '↗' : trend.change.direction === 'down' ? '↘' : '→'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`font-mono ${getChangeColor(trend.change)}`}>
          {trend.change.absolute > 0 ? '+' : ''}{formatNumber(trend.change.absolute)}
        </span>
      </td>
      {comparisonColumns.map((column, index) => (
        <td key={index} className="px-3 py-4 text-center">
          <span className="font-mono text-sm text-slate-200">
            {formatNumber(column.values[trend.fieldName] || 0)}
          </span>
        </td>
      ))}
    </tr>
  )
}