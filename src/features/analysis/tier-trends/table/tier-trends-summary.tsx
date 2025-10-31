import type { TierTrendsData } from '@/features/data-tracking/types/game-run.types'

interface TierTrendsSummaryProps {
  trendsData: TierTrendsData
}

export function TierTrendsSummary({ trendsData }: TierTrendsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/50 rounded-lg p-4 backdrop-blur-sm">
        <div className="text-sm text-slate-400 mb-1">Fields Changed</div>
        <div className="text-2xl font-bold text-slate-100">{trendsData.summary.fieldsChanged}</div>
      </div>
      <div className="bg-gradient-to-br from-emerald-800/20 to-emerald-700/10 border border-emerald-600/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="text-sm text-emerald-400 mb-1">Top Gainers</div>
        <div className="text-2xl font-bold text-emerald-300">{trendsData.summary.topGainers.length}</div>
      </div>
      <div className="bg-gradient-to-br from-red-800/20 to-red-700/10 border border-red-600/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="text-sm text-red-400 mb-1">Top Decliners</div>
        <div className="text-2xl font-bold text-red-300">{trendsData.summary.topDecliners.length}</div>
      </div>
    </div>
  )
}