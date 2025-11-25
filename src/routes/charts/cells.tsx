import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'

export const Route = createFileRoute('/charts/cells')({
  component: CellsChartPage,
})

function CellsChartPage() {
  return (
    <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 shadow-2xl hover:shadow-pink-500/10 transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-pink-500/10 via-transparent to-pink-500/10 border-b border-slate-700/30">
        <CardTitle className="text-xl font-semibold text-slate-100 flex items-center gap-3">
          <div className="w-2 h-6 bg-gradient-to-b from-pink-400 to-pink-600 rounded-full shadow-lg shadow-pink-500/30"></div>
          Cells Analysis
        </CardTitle>
        <p className="text-slate-400 text-sm mt-2">
          Track your cell earnings from farm runs over different time periods
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-8 w-full">
          <TimeSeriesChart
            metric="cellsEarned"
            title="Cells Earned"
            subtitle="Track your cell earnings from farming runs over different time periods"
            defaultPeriod="hourly"
            showFarmingOnly={true}
          />
        </div>
      </CardContent>
    </Card>
  )
}