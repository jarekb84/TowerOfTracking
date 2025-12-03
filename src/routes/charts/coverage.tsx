import { createFileRoute } from '@tanstack/react-router'
import { ChartPageLayout } from '@/shared/layouts'
import { CoverageReport } from '@/features/analysis/coverage-report/coverage-report'

export const Route = createFileRoute('/charts/coverage')({
  component: CoverageReportPage,
})

function CoverageReportPage() {
  return (
    <ChartPageLayout
      accentColor="cyan"
      title="Coverage Report"
      description={
        <>
          Coverage shows what percentage of enemies are affected by each mechanic.
          For example: <span className="text-slate-300">enemies destroyed in spotlight / total enemies = spotlight coverage %</span>.
        </>
      }
    >
      <CoverageReport />
    </ChartPageLayout>
  )
}
