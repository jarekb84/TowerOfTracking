import { useData } from '@/shared/domain/use-data'
import { RunType } from '@/shared/domain/run-types/types'
import { TierStatsConfigPanel } from './config/tier-stats-config-panel'
import { TierStatsCellTooltip } from './cells/tier-stats-cell-tooltip'
import { useTierStatsConfig } from './config/use-tier-stats-config'
import { useDynamicTierStatsTable } from './use-dynamic-tier-stats-table'
import { filterRunsByType } from '@/features/analysis/shared/filtering/run-type-filter'
import { getTierStatsCellClassName } from './cells/tier-stats-cell-styles'
import { LoadingState } from '@/components/ui/loading-state'
import * as Tooltip from '@radix-ui/react-tooltip'

export function TierStatsTable() {
  const { runs } = useData()

  // Filter to farm runs only
  const farmRuns = filterRunsByType(runs, RunType.FARM)

  // Configuration hook
  const config = useTierStatsConfig(farmRuns)

  // Dynamic table hook
  const table = useDynamicTierStatsTable(farmRuns, config, RunType.FARM)

  // Show loading state while data is initializing
  if (!config.isDataLoaded) {
    return (
      <div className="space-y-4">
        <LoadingState rows={5} height="500px" />
      </div>
    )
  }

  if (farmRuns.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No tier data available. Import some game runs to see the analysis.
      </div>
    )
  }

  if (table.tierStats.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No tier statistics calculated. Ensure you have valid tier data.
      </div>
    )
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="space-y-4">
        {/* ARIA live region for screen reader announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {config.isDataLoaded && config.selectedColumns.length > 0 && (
            `Tier statistics loaded with ${config.selectedColumns.length} columns displayed.`
          )}
        </div>

        {/* Configuration Panel */}
        <TierStatsConfigPanel config={config} />

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/50 rounded-lg p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-500/60 hover:shadow-md">
            <div className="text-sm text-slate-300 font-medium mb-2">Total Tiers</div>
            <div className="text-3xl font-bold text-slate-100">{table.summary.totalTiers}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-800/20 to-emerald-700/10 border border-emerald-600/30 rounded-lg p-5 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/10">
            <div className="text-sm text-emerald-300 font-medium mb-2">Total Runs</div>
            <div className="text-3xl font-bold text-emerald-200">
              {table.summary.totalRuns}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-800/20 to-purple-700/10 border border-purple-600/30 rounded-lg p-5 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/40 hover:shadow-md hover:shadow-purple-500/10">
            <div className="text-sm text-purple-300 font-medium mb-2">Columns Displayed</div>
            <div className="text-3xl font-bold text-purple-200">
              {table.columns.length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-gradient-to-r from-slate-700/20 via-slate-600/10 to-slate-700/20">
                  {/* Tier Column */}
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-slate-200"
                    aria-sort={table.sortField === 'tier' ? (table.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      onClick={() => table.handleSort('tier')}
                      className="flex items-center gap-2 hover:text-slate-100 transition-colors focus-visible:outline-none focus-visible:text-orange-400"
                    >
                      Tier
                      {table.sortField === 'tier' && (
                        <span className="text-xs text-orange-400">{table.sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>

                  {/* Dynamic Columns */}
                  {table.columns.map(column => (
                    <th
                      key={column.id}
                      className="px-6 py-4 text-right text-sm font-semibold text-slate-200"
                      aria-sort={table.sortField === column.id ? (table.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <button
                        onClick={() => table.handleSort(column.id)}
                        className="flex items-center gap-2 hover:text-slate-100 transition-colors ml-auto focus-visible:outline-none focus-visible:text-orange-400"
                      >
                        {column.displayName}
                        {table.sortField === column.id && (
                          <span className="text-xs text-orange-400">{table.sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.tierStats.map((tierStats, index) => {
                  const isEven = index % 2 === 0
                  const rowBg = isEven
                    ? 'bg-gradient-to-r from-slate-800/20 via-slate-700/10 to-slate-800/20'
                    : 'bg-gradient-to-r from-slate-700/20 via-slate-600/10 to-slate-700/20'

                  return (
                    <tr
                      key={tierStats.tier}
                      className={`border-b border-slate-700/30 transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-500/8 hover:via-pink-500/4 hover:to-purple-500/8 hover:border-purple-500/20 ${rowBg}`}
                    >
                      {/* Tier Cell */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-7 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full shadow-sm"></div>
                          <span className="font-semibold text-slate-100">Tier {tierStats.tier}</span>
                        </div>
                      </td>

                      {/* Dynamic Cells */}
                      {table.columns.map(column => {
                        const tooltipData = table.getCellTooltipData(tierStats, column)
                        const displayValue = table.getCellDisplayValue(tierStats, column)
                        const hasData = displayValue.main !== '-'

                        const cellClassName = getTierStatsCellClassName({
                          isHourlyRate: column.showHourlyRate,
                          dataType: column.dataType
                        })

                        return (
                          <td key={column.id} className="px-6 py-3.5 text-right">
                            {hasData && tooltipData ? (
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <button className={cellClassName}>
                                    <span className="flex flex-col items-end gap-0.5">
                                      <span className="font-semibold">{displayValue.main}</span>
                                      {displayValue.hourly && (
                                        <span className="text-xs text-orange-300 opacity-90">{displayValue.hourly}</span>
                                      )}
                                    </span>
                                  </button>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="top"
                                    sideOffset={8}
                                    className="z-50"
                                  >
                                    <TierStatsCellTooltip data={tooltipData} />
                                    <Tooltip.Arrow className="fill-slate-950" />
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            ) : hasData ? (
                              <span className={`${cellClassName} inline-flex`}>
                                <span className="flex flex-col items-end gap-0.5">
                                  <span className="font-semibold">{displayValue.main}</span>
                                  {displayValue.hourly && (
                                    <span className="text-xs text-orange-300 opacity-90">{displayValue.hourly}</span>
                                  )}
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono text-sm">-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  )
}