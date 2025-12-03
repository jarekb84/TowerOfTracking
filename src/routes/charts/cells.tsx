import { createFileRoute } from '@tanstack/react-router'
import { ChartPageLayout } from '@/shared/layouts'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'

export const Route = createFileRoute('/charts/cells')({
  component: CellsChartPage,
})

function CellsChartPage() {
  return (
    <ChartPageLayout
      accentColor="pink"
      title="Cells Analysis"
      description="Track your cell earnings from farm runs over different time periods"
    >
      <TimeSeriesChart
        metric="cellsEarned"
        tooltipLabel="Cells Earned"
        defaultPeriod="hourly"
        showFarmingOnly={true}
      />
    </ChartPageLayout>
  )
}
