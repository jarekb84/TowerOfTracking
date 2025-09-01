import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui'
import { TimeSeriesChart } from '../../features/data-tracking'

export const Route = createFileRoute('/charts/coins')({
  component: CoinsChartPage,
})

function CoinsChartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="space-y-4">
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              💰 Coins Analytics
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-lg -z-10 rounded-lg"></div>
          </div>
          <p className="text-muted-foreground text-lg">
            Track your coin earnings from farming runs over different time periods
          </p>
        </div>

        <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 border-b border-slate-700/50">
            <CardTitle className="text-xl font-medium text-slate-100">Coins Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-8 w-full">
              <TimeSeriesChart 
                metric="coins"
                title="Coins Earned"
                subtitle="Track your coin earnings from farming runs over different time periods"
                defaultPeriod="hourly"
                showFarmingOnly={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}