import { createFileRoute } from '@tanstack/react-router'
import { ChartPageLayout } from '@/shared/layouts'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'
import { Duration } from '@/shared/domain/filters/types'
import { RunType } from '@/shared/domain/run-types/types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import { usePersistedPageState } from '@/shared/persistence'

const PAGE_SCOPE = 'charts/coins'

export const Route = createFileRoute('/charts/coins')({
  component: CoinsChartPage,
})

function CoinsChartPage() {
  const [runTypeFilter, setRunTypeFilter] = usePersistedPageState<RunTypeFilter>(
    PAGE_SCOPE, 'runType', RunType.FARM
  )

  return (
    <ChartPageLayout
      accentColor="emerald"
      title="Coins Analysis"
      description="Track your coin earnings over different time periods"
    >
      <TimeSeriesChart
        metric="coinsEarned"
        tooltipLabel="Coins Earned"
        defaultPeriod={Duration.HOURLY}
        runTypeFilter={runTypeFilter}
        onRunTypeChange={setRunTypeFilter}
        pageScope={PAGE_SCOPE}
      />
    </ChartPageLayout>
  )
}
