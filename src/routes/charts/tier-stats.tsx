import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { TierStatsTable } from '@/features/analysis/tier-stats/tier-stats-table'

export const Route = createFileRoute('/charts/tier-stats')({
  component: TierStatsPage,
})

function TierStatsPage() {
  return (
    <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 border-b border-slate-700/50">
        <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-500/30"></div>
          Tier Performance Statistics
          <span className="text-sm font-normal text-slate-400 ml-auto">Maximum Values per Tier</span>
        </CardTitle>
        <p className="text-slate-400 text-sm mt-2">
          See your best performance metrics for each tier. Shows maximum wave, duration, coins, cells, and hourly rates achieved.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-8 w-full">
          <TierStatsTable />
        </div>
      </CardContent>
    </Card>
  )
}