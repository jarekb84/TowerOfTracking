/**
 * Mini Coverage Report Component
 *
 * Compact coverage report for run details.
 * Displays 9 coverage metrics in a two-column layout (Economic / Combat).
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { MetricCoverage } from '@/features/analysis/coverage-report/types'
import { useMiniCoverageReport } from './use-mini-coverage-report'
import { CoverageBar } from './mini-coverage-bar'

interface MiniCoverageReportProps {
  run: ParsedGameRun
}

interface CoverageColumnProps {
  title: string
  subtitle: string
  metrics: MetricCoverage[]
}

function CoverageColumn({ title, subtitle, metrics }: CoverageColumnProps) {
  if (metrics.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <h6 className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {title}
        </h6>
        <p className="text-[11px] text-muted-foreground/50">{subtitle}</p>
      </div>
      <div className="space-y-2.5">
        {metrics.map((metric) => (
          <CoverageBar key={metric.fieldName} metric={metric} />
        ))}
      </div>
    </div>
  )
}

export function MiniCoverageReport({ run }: MiniCoverageReportProps) {
  const coverageData = useMiniCoverageReport(run)

  // Don't render if no valid coverage data
  if (!coverageData) {
    return null
  }

  const { economicMetrics, combatMetrics } = coverageData

  return (
    <div className="space-y-4">
      <div className="border-b border-border/40 pb-2">
        <h5 className="font-semibold text-base text-primary">
          Coverage Report
        </h5>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          Percentage of enemies affected by each mechanic
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <CoverageColumn
          title="Economic"
          subtitle="Tagged, killed in range, or summoned"
          metrics={economicMetrics}
        />
        <CoverageColumn
          title="Combat"
          subtitle="Kills (or Hits where specified)"
          metrics={combatMetrics}
        />
      </div>
    </div>
  )
}
