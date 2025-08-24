import { useMemo, useState } from 'react'
import { useData } from '../hooks/use-data'
import { prepareTierStatsData, formatLargeNumber, TierStatsData } from '../utils/chart-data'
import { formatDuration } from '../utils/data-parser'
import { FarmingOnlyIndicator } from './farming-only-indicator'

type SortField = keyof TierStatsData
type SortDirection = 'asc' | 'desc'

export function TierStatsTable() {
  const { runs } = useData()
  
  const baseTierStats = useMemo(() => prepareTierStatsData(runs, 'farming'), [runs])
  const [sortField, setSortField] = useState<SortField>('tier')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  const tierStats = useMemo(() => {
    return [...baseTierStats].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [baseTierStats, sortField, sortDirection])
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  if (tierStats.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No tier data available. Import some game runs to see the analysis.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Performance by Tier</h3>
          <FarmingOnlyIndicator />
        </div>
        <p className="text-slate-400 text-sm">
          Maximum values achieved across farming runs for each tier. Rates calculated as per-hour metrics.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-sm text-slate-400 mb-1">Total Tiers</div>
          <div className="text-2xl font-bold text-slate-100">{tierStats.length}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-800/20 to-emerald-700/10 border border-emerald-600/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-sm text-emerald-400 mb-1">Highest Coins</div>
          <div className="text-2xl font-bold text-emerald-300">
            {tierStats.length > 0 ? formatLargeNumber(Math.max(...tierStats.map(t => t.maxCoins))) : '0'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-800/20 to-pink-700/10 border border-pink-600/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-sm text-pink-400 mb-1">Highest Cells</div>
          <div className="text-2xl font-bold text-pink-300">
            {tierStats.length > 0 ? formatLargeNumber(Math.max(...tierStats.map(t => t.maxCells))) : '0'}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-gradient-to-r from-slate-700/20 via-slate-600/10 to-slate-700/20">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                  <button 
                    onClick={() => handleSort('tier')}
                    className="flex items-center gap-1 hover:text-slate-100 transition-colors"
                  >
                    Tier
                    {sortField === 'tier' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">
                  <button 
                    onClick={() => handleSort('maxWave')}
                    className="flex items-center gap-1 hover:text-slate-100 transition-colors ml-auto"
                  >
                    Wave
                    {sortField === 'maxWave' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">
                  <button 
                    onClick={() => handleSort('maxDuration')}
                    className="flex items-center gap-1 hover:text-slate-100 transition-colors ml-auto"
                  >
                    Duration
                    {sortField === 'maxDuration' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">
                  <button 
                    onClick={() => handleSort('maxCoins')}
                    className="flex items-center gap-1 hover:text-slate-100 transition-colors ml-auto"
                  >
                    Coins
                    {sortField === 'maxCoins' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">
                  <button 
                    onClick={() => handleSort('maxCoinsPerHour')}
                    className="flex items-center gap-1 hover:text-slate-100 transition-colors ml-auto"
                  >
                    Coins/Hour
                    {sortField === 'maxCoinsPerHour' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">
                  <button 
                    onClick={() => handleSort('maxCells')}
                    className="flex items-center gap-1 hover:text-slate-100 transition-colors ml-auto"
                  >
                    Cells
                    {sortField === 'maxCells' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">
                  <button 
                    onClick={() => handleSort('maxCellsPerHour')}
                    className="flex items-center gap-1 hover:text-slate-100 transition-colors ml-auto"
                  >
                    Cells/Hour
                    {sortField === 'maxCellsPerHour' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tierStats.map((tier, index) => {
                // Alternate row colors with subtle gradients
                const isEven = index % 2 === 0
                const rowBg = isEven 
                  ? 'bg-gradient-to-r from-slate-800/20 via-slate-700/10 to-slate-800/20' 
                  : 'bg-gradient-to-r from-slate-700/20 via-slate-600/10 to-slate-700/20'
                
                return (
                  <tr 
                    key={tier.tier} 
                    className={`border-b border-slate-700/30 transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-500/10 hover:via-pink-500/5 hover:to-purple-500/10 ${rowBg}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full shadow-sm"></div>
                        <span className="font-medium text-slate-100">Tier {tier.tier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-slate-200 bg-slate-700/30 px-2 py-1 rounded">
                        {tier.maxWave.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-slate-200 bg-slate-700/30 px-2 py-1 rounded">
                        {formatDuration(tier.maxDuration)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        {formatLargeNumber(tier.maxCoins)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        {formatLargeNumber(Math.round(tier.maxCoinsPerHour))}/h
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-pink-300 bg-pink-500/10 px-2 py-1 rounded border border-pink-500/20">
                        {formatLargeNumber(tier.maxCells)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-pink-300 bg-pink-500/10 px-2 py-1 rounded border border-pink-500/20">
                        {formatLargeNumber(Math.round(tier.maxCellsPerHour))}/h
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}