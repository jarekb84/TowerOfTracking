import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { CoverageReport } from '@/features/analysis/coverage-report/coverage-report'

export const Route = createFileRoute('/charts/coverage')({
  component: CoverageReportPage,
})

function CoverageReportPage() {
  return (
    <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 border-b border-slate-700/50">
        <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full shadow-lg shadow-cyan-500/30"></div>
          Coverage Report
          <span className="text-sm font-normal text-slate-400 ml-auto">Analyze Mechanic Coverage Percentages</span>
        </CardTitle>
        <p className="text-slate-400 text-sm mt-2">
          Coverage shows what percentage of enemies are affected by each mechanic.
          For example: <span className="text-slate-300">enemies destroyed in spotlight ÷ total enemies = spotlight coverage %</span>.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-8 w-full">
          <CoverageReport />
        </div>
      </CardContent>
    </Card>
  )
}
