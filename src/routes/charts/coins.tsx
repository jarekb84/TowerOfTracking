import { createFileRoute } from '@tanstack/react-router'
import { ChartPageLayout } from '@/shared/layouts'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'

export const Route = createFileRoute('/charts/coins')({
  component: CoinsChartPage,
})

function CoinsChartPage() {
  return (
    <ChartPageLayout
      accentColor="emerald"
      title="Coins Analysis"
      description="Track your coin earnings from farm runs over different time periods"
    >
      <TimeSeriesChart
        metric="coinsEarned"
        tooltipLabel="Coins Earned"
        defaultPeriod="hourly"
        showFarmingOnly={true}
      />
    </ChartPageLayout>
  )
}
