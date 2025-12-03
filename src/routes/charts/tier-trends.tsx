import { createFileRoute } from '@tanstack/react-router'
import { ChartPageLayout } from '@/shared/layouts'
import { TierTrendsAnalysis } from '@/features/analysis/tier-trends/tier-trends-analysis'

export const Route = createFileRoute('/charts/tier-trends')({
  component: TierTrendsPage,
})

function TierTrendsPage() {
  return (
    <ChartPageLayout
      accentColor="orange"
      title="Statistical Trends Analysis"
      description="Compare statistical changes across your recent runs. Identify performance improvements and upgrade impacts."
      responsivePadding={true}
    >
      <TierTrendsAnalysis />
    </ChartPageLayout>
  )
}
