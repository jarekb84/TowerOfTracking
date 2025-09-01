import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui'
import { DeathsRadarChart } from '../../features/data-tracking'

export const Route = createFileRoute('/charts/deaths')({
  component: DeathsChartPage,
})

function DeathsChartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="space-y-4">
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
              💀 Deaths Analytics
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-rose-600/20 blur-lg -z-10 rounded-lg"></div>
          </div>
          <p className="text-muted-foreground text-lg">
            Analyze what&apos;s killing you across different tiers. Toggle tiers on/off to compare death patterns.
          </p>
        </div>

        <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-red-500/10 transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 border-b border-slate-700/50">
            <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-lg shadow-red-500/30"></div>
              Death Causes by Tier
              <span className="text-sm font-normal text-muted-foreground ml-auto">Spider/Radar Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-8 w-full">
              <DeathsRadarChart />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}