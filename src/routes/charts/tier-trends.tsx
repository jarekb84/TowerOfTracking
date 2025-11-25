import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { TierTrendsAnalysis } from '@/features/analysis/tier-trends/tier-trends-analysis'

export const Route = createFileRoute('/charts/tier-trends')({
  component: TierTrendsPage,
})

function TierTrendsPage() {
  return (
    <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 shadow-2xl hover:shadow-orange-500/10 transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 border-b border-slate-700/50">
        <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-lg shadow-orange-500/30"></div>
          Statistical Trends Analysis
          <span className="text-sm font-normal text-slate-400 ml-auto">Recent Run Comparison</span>
        </CardTitle>
        <p className="text-slate-400 text-sm mt-2">
          Compare statistical changes across your recent farming runs for the same tier. Identify performance improvements and upgrade impacts.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-0 md:p-8 w-full">
          <TierTrendsAnalysis />
        </div>
      </CardContent>
    </Card>
  )
}