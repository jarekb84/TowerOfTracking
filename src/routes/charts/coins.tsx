import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ChartPageLayout } from '@/shared/layouts'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'
import { RunType } from '@/shared/domain/run-types/types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'

export const Route = createFileRoute('/charts/coins')({
  component: CoinsChartPage,
})

function CoinsChartPage() {
  const [runTypeFilter, setRunTypeFilter] = useState<RunTypeFilter>(RunType.FARM)

  return (
    <ChartPageLayout
      accentColor="emerald"
      title="Coins Analysis"
      description="Track your coin earnings over different time periods"
    >
      <TimeSeriesChart
        metric="coinsEarned"
        tooltipLabel="Coins Earned"
        defaultPeriod="hourly"
        runTypeFilter={runTypeFilter}
        onRunTypeChange={setRunTypeFilter}
      />
    </ChartPageLayout>
  )
}
