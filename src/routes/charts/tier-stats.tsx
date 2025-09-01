import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui'
import { TierStatsTable } from '../../features/data-tracking'

export const Route = createFileRoute('/charts/tier-stats')({
  component: TierStatsPage,
})

function TierStatsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="space-y-4">
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              🏆 Tier Stats
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 blur-lg -z-10 rounded-lg"></div>
          </div>
          <p className="text-slate-400 text-lg">
            See your best performance metrics for each tier. Shows maximum wave, duration, coins, cells, and hourly rates achieved.
          </p>
        </div>

        <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 border-b border-slate-700/50">
            <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-500/30"></div>
              Tier Performance Statistics
              <span className="text-sm font-normal text-slate-400 ml-auto">Maximum Values per Tier</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-8 w-full">
              <TierStatsTable />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}