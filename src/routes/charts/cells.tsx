import { createFileRoute } from '@tanstack/react-router'
import { ChartPageLayout } from '@/shared/layouts'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'
import { Duration } from '@/shared/domain/filters/types'
import { RunType } from '@/shared/domain/run-types/types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import { usePersistedPageState } from '@/shared/persistence'

const PAGE_SCOPE = 'charts/cells'

export const Route = createFileRoute('/charts/cells')({
  component: CellsChartPage,
})

function CellsChartPage() {
  const [runTypeFilter, setRunTypeFilter] = usePersistedPageState<RunTypeFilter>(
    PAGE_SCOPE, 'runType', RunType.FARM
  )

  return (
    <ChartPageLayout
      accentColor="pink"
      title="Cells Analysis"
      description="Track your cell earnings over different time periods"
    >
      <TimeSeriesChart
        metric="cellsEarned"
        tooltipLabel="Cells Earned"
        defaultPeriod={Duration.HOURLY}
        runTypeFilter={runTypeFilter}
        onRunTypeChange={setRunTypeFilter}
        pageScope={PAGE_SCOPE}
      />
    </ChartPageLayout>
  )
}
