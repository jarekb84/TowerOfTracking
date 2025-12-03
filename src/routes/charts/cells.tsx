import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ChartPageLayout } from '@/shared/layouts'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'
import { RunType } from '@/shared/domain/run-types/types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'

export const Route = createFileRoute('/charts/cells')({
  component: CellsChartPage,
})

function CellsChartPage() {
  const [runTypeFilter, setRunTypeFilter] = useState<RunTypeFilter>(RunType.FARM)

  return (
    <ChartPageLayout
      accentColor="pink"
      title="Cells Analysis"
      description="Track your cell earnings over different time periods"
    >
      <TimeSeriesChart
        metric="cellsEarned"
        tooltipLabel="Cells Earned"
        defaultPeriod="hourly"
        runTypeFilter={runTypeFilter}
        onRunTypeChange={setRunTypeFilter}
      />
    </ChartPageLayout>
  )
}
