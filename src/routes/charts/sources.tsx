import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { SourceAnalysis } from '@/features/analysis/source-analysis/source-analysis'

export const Route = createFileRoute('/charts/sources')({
  component: SourceAnalysisPage,
})

function SourceAnalysisPage() {
  return (
    <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 border-b border-slate-700/50">
        <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full shadow-lg shadow-purple-500/30"></div>
          Source Analysis
          <span className="text-sm font-normal text-slate-400 ml-auto">Understand Your Aggregate Metric Breakdowns</span>
        </CardTitle>
        <p className="text-slate-400 text-sm mt-2">
          See which sources contribute to your damage dealt and coin income totals, and track how those proportions change over time.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-8 w-full">
          <SourceAnalysis />
        </div>
      </CardContent>
    </Card>
  )
}
