import { createFileRoute } from '@tanstack/react-router'
import { ChartPageLayout } from '@/shared/layouts'
import { DeathsRadarChart } from '@/features/analysis/deaths-radar/deaths-radar-chart'

export const Route = createFileRoute('/charts/deaths')({
  component: DeathsChartPage,
})

function DeathsChartPage() {
  return (
    <ChartPageLayout
      accentColor="red"
      title="Death Causes by Tier"
      description="Analyze what's killing you across different tiers. Toggle tiers on/off to compare death patterns."
    >
      <DeathsRadarChart />
    </ChartPageLayout>
  )
}
