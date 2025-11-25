import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { DeathsRadarChart } from '@/features/analysis/deaths-radar/deaths-radar-chart'

export const Route = createFileRoute('/charts/deaths')({
  component: DeathsChartPage,
})

function DeathsChartPage() {
  return (
    <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 shadow-2xl hover:shadow-red-500/10 transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 border-b border-slate-700/50">
        <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-lg shadow-red-500/30"></div>
          Death Causes by Tier
          <span className="text-sm font-normal text-slate-400 ml-auto">Spider/Radar Analysis</span>
        </CardTitle>
        <p className="text-slate-400 text-sm mt-2">
          Analyze what&apos;s killing you across different tiers. Toggle tiers on/off to compare death patterns.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-8 w-full">
          <DeathsRadarChart />
        </div>
      </CardContent>
    </Card>
  )
}