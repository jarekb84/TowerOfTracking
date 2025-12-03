import { createFileRoute } from '@tanstack/react-router'
import { ChartPageLayout } from '@/shared/layouts'
import { SourceAnalysis } from '@/features/analysis/source-analysis/source-analysis'

export const Route = createFileRoute('/charts/sources')({
  component: SourceAnalysisPage,
})

function SourceAnalysisPage() {
  return (
    <ChartPageLayout
      accentColor="purple"
      title="Source Analysis"
      description="See which sources contribute to your damage dealt and coin income totals, and track how those proportions change over time."
    >
      <SourceAnalysis />
    </ChartPageLayout>
  )
}
