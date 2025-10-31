import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui'
import { TierTrendsAnalysis } from '../../features/analysis/tier-trends/tier-trends-analysis'

export const Route = createFileRoute('/charts/tier-trends')({
  component: TierTrendsPage,
})

function TierTrendsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="space-y-4">
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              📈 Tier Trends
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-600/20 to-yellow-600/20 blur-lg -z-10 rounded-lg"></div>
          </div>
          <p className="text-muted-foreground text-lg">
            Compare statistical changes across your recent farm runs for the same tier. Identify performance improvements and upgrade impacts.
          </p>
        </div>

        <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50">
          <CardHeader className="bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 border-b border-slate-700/50">
            <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-lg shadow-orange-500/30"></div>
              Statistical Trends Analysis
              <span className="text-sm font-normal text-muted-foreground ml-auto">Recent Run Comparison</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-0 md:p-8 w-full">
              <TierTrendsAnalysis />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}