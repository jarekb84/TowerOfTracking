/**
 * Coverage Report Main Component
 *
 * Displays coverage percentage analysis with timeline chart and summary chart.
 * Supports cross-chart hover highlighting and filtering by metrics, run type, tier, and time period.
 */

import { useData } from '@/shared/domain/use-data'
import { useCoverageReport } from './use-coverage-report'
import { CoverageReportFiltersComponent } from './filters/coverage-report-filters'
import { CoverageTimelineChart } from './charts/coverage-timeline-chart'
import { CoverageSummaryChart } from './charts/coverage-summary-chart'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import { Duration, PERIOD_UNIT_LABELS } from '@/shared/domain/filters'

const CYAN_ACCENT = '#22d3ee'

function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[32rem] px-4 py-8">
      <div className="max-w-lg text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center border border-cyan-500/30">
            <svg
              className="w-12 h-12 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-100">
            No Data Available
          </h3>
          <p className="text-slate-400">
            Import your game data to analyze coverage metrics.
            Head to the Data tab to get started.
          </p>
        </div>
      </div>
    </div>
  )
}

function NoFilteredDataState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-[20rem] px-4 py-8">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-600">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-slate-200">
            No Data Matches Filters
          </h3>
          <p className="text-slate-400 text-sm">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}

function FilterSummary({
  metricCount,
  runType,
  tier,
  duration,
  periodCount,
  totalRuns,
  totalEnemies,
}: {
  metricCount: number
  runType: string
  tier: number | 'all'
  duration: Duration
  periodCount: number
  totalRuns: number
  totalEnemies: number
}) {
  const parts: string[] = []

  if (runType !== 'all') {
    parts.push(`${runType} runs only`)
  }

  if (tier !== 'all') {
    parts.push(`Tier ${tier}`)
  }

  const unitLabel = PERIOD_UNIT_LABELS[duration].plural.toLowerCase()

  return (
    <div className="text-sm text-slate-400">
      <span className="text-slate-200 font-medium">{metricCount} metrics</span>
      {' '}&middot;{' '}
      Last {periodCount} {unitLabel}
      {parts.length > 0 && (
        <>
          {' '}&middot;{' '}
          {parts.join(' \u00B7 ')}
        </>
      )}
      {totalRuns > 0 && (
        <>
          {' '}&middot;{' '}
          <span className="text-slate-300">{totalRuns} runs</span>
          {' '}&middot;{' '}
          <span className="text-cyan-400">{formatLargeNumber(totalEnemies)} enemies</span>
        </>
      )}
    </div>
  )
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5 hover:border-slate-600/60">
      <div
        className="px-4 py-3 border-b border-slate-700/50"
        style={{
          backgroundImage: `linear-gradient(to right, ${CYAN_ACCENT}0d, transparent, ${CYAN_ACCENT}0d)`
        }}
      >
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <div
            className="w-1 h-4 rounded-full"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${CYAN_ACCENT}cc, ${CYAN_ACCENT})`,
              boxShadow: `0 2px 8px ${CYAN_ACCENT}30`
            }}
          />
          {title}
        </h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

function YAxisToggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-0"
      />
      <span>Scale Y-axis to data</span>
    </label>
  )
}

function LimitedDataNotice() {
  return (
    <div className="text-center text-sm text-slate-400 py-2">
      <span className="inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Add more runs for detailed trend analysis.
      </span>
    </div>
  )
}

export function CoverageReport() {
  const { runs } = useData()

  const {
    filters,
    toggleMetric,
    setRunType,
    setTier,
    setDuration,
    setPeriodCount,
    analysisData,
    hasData,
    highlightedMetric,
    setHighlightedMetric,
    useRelativeYAxis,
    setUseRelativeYAxis,
    yAxisMax,
    availableTiers,
    availableDurations,
  } = useCoverageReport({ runs })

  // Show empty state if no runs at all
  if (runs.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <CoverageReportFiltersComponent
        filters={filters}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        onToggleMetric={toggleMetric}
        onRunTypeChange={setRunType}
        onTierChange={setTier}
        onDurationChange={setDuration}
        onPeriodCountChange={setPeriodCount}
      />

      {/* Filter Summary & Y-Axis Toggle */}
      {analysisData && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <FilterSummary
            metricCount={filters.selectedMetrics.size}
            runType={filters.runType}
            tier={filters.tier}
            duration={filters.duration}
            periodCount={analysisData.periods.length}
            totalRuns={analysisData.summary.totalRuns}
            totalEnemies={analysisData.summary.totalEnemies}
          />
          <YAxisToggle checked={useRelativeYAxis} onChange={setUseRelativeYAxis} />
        </div>
      )}

      {/* No filtered data state */}
      {!hasData && (
        <NoFilteredDataState
          message="Try expanding the time period or adjusting tier/run type filters."
        />
      )}

      {/* Charts */}
      {hasData && analysisData && (
        <div className="space-y-6">
          {/* Timeline Chart */}
          <ChartCard title="Coverage Percentages Over Time">
            <CoverageTimelineChart
              periods={analysisData.periods}
              highlightedMetric={highlightedMetric}
              onMetricHover={setHighlightedMetric}
              yAxisMax={yAxisMax}
            />
          </ChartCard>

          {/* Summary Chart */}
          <ChartCard title="Overall Coverage by Metric">
            <CoverageSummaryChart
              metrics={analysisData.summary.metrics}
              highlightedMetric={highlightedMetric}
              onMetricHover={setHighlightedMetric}
              yAxisMax={yAxisMax}
            />
          </ChartCard>

          {/* Limited Data Notice */}
          {analysisData.periods.length <= 2 && <LimitedDataNotice />}
        </div>
      )}
    </div>
  )
}
