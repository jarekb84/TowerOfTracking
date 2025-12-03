import { createFileRoute } from '@tanstack/react-router'
import { ChartPageLayout } from '@/shared/layouts'
import { TierStatsTable } from '@/features/analysis/tier-stats/tier-stats-table'

export const Route = createFileRoute('/charts/tier-stats')({
  component: TierStatsPage,
})

function TierStatsPage() {
  return (
    <ChartPageLayout
      accentColor="blue"
      title="Tier Performance Statistics"
      description="See your best performance metrics for each tier. Customize columns and aggregation method below."
    >
      <TierStatsTable />
    </ChartPageLayout>
  )
}
