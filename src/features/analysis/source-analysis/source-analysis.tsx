/**
 * Source Analysis Main Component
 *
 * Displays source breakdown analysis with timeline chart, pie chart, and bar chart.
 * Supports cross-chart hover highlighting and filtering by category, run type, tier, and time period.
 */

import { useData } from '@/shared/domain/use-data'
import { useSourceAnalysis } from './use-source-analysis'
import { SourceAnalysisFiltersComponent } from './filters/source-analysis-filters'
import { SourceTimelineChart } from './charts/source-timeline-chart'
import { SourcePieChart } from './charts/source-pie-chart'
import { SourceBarChart } from './charts/source-bar-chart'
import { getQuantityLabel, type SourceDuration } from './types'
import { formatLargeNumber } from '@/features/analysis/shared/formatting/chart-formatters'

/** Purple theme color for Source Analysis */
const PURPLE_ACCENT = '#a855f7'

function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[32rem] px-4 py-8">
      <div className="max-w-lg text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border border-purple-500/30">
            <svg
              className="w-12 h-12 text-purple-400"
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
            Import your game data to analyze source breakdowns.
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
  categoryName,
  runType,
  tier,
  duration,
  quantity,
  periodCount,
  total,
}: {
  categoryName: string
  runType: string
  tier: number | 'all'
  duration: SourceDuration
  quantity: number
  periodCount: number
  total: number
}) {
  const parts: string[] = []

  if (runType !== 'all') {
    parts.push(`${runType} runs only`)
  }

  if (tier !== 'all') {
    parts.push(`Tier ${tier}`)
  }

  const periodLabel = getQuantityLabel(duration, quantity)

  return (
    <div className="text-sm text-slate-400">
      <span className="text-slate-200 font-medium">{categoryName}</span>
      {' '}&middot;{' '}
      {periodLabel}
      {parts.length > 0 && (
        <>
          {' '}&middot;{' '}
          {parts.join(' \u00B7 ')}
        </>
      )}
      {periodCount > 0 && (
        <>
          {' '}&middot;{' '}
          <span className="text-slate-300">{periodCount} periods</span>
          {' '}&middot;{' '}
          <span className="text-purple-400">{formatLargeNumber(total)} total</span>
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
    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 hover:border-slate-600/60">
      <div
        className="px-4 py-3 border-b border-slate-700/50"
        style={{
          backgroundImage: `linear-gradient(to right, ${PURPLE_ACCENT}0d, transparent, ${PURPLE_ACCENT}0d)`
        }}
      >
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <div
            className="w-1 h-4 rounded-full"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${PURPLE_ACCENT}cc, ${PURPLE_ACCENT})`,
              boxShadow: `0 2px 8px ${PURPLE_ACCENT}30`
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

export function SourceAnalysis() {
  const { runs } = useData()

  const {
    filters,
    setCategory,
    setRunType,
    setTier,
    setDuration,
    setQuantity,
    analysisData,
    hasData,
    highlightedSource,
    setHighlightedSource,
    availableTiers,
    availableDurations,
  } = useSourceAnalysis({ runs })

  // Show empty state if no runs at all
  if (runs.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <SourceAnalysisFiltersComponent
        filters={filters}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        onCategoryChange={setCategory}
        onRunTypeChange={setRunType}
        onTierChange={setTier}
        onDurationChange={setDuration}
        onQuantityChange={setQuantity}
      />

      {/* Filter Summary */}
      {analysisData && (
        <FilterSummary
          categoryName={analysisData.category.name}
          runType={filters.runType}
          tier={filters.tier}
          duration={filters.duration}
          quantity={filters.quantity}
          periodCount={analysisData.summary.periodCount}
          total={analysisData.summary.totalValue}
        />
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
          <ChartCard title="Source Proportions Over Time">
            <SourceTimelineChart
              periods={analysisData.periods}
              sortedSources={analysisData.summary.sources}
              highlightedSource={highlightedSource}
              onSourceHover={setHighlightedSource}
            />
          </ChartCard>

          {/* Summary Charts Row - 1/3 pie chart, 2/3 bar chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Overall Breakdown">
              <div className="flex items-center justify-center" style={{ height: Math.max(224, analysisData.summary.sources.length * 32 + 40) }}>
                <SourcePieChart
                  sources={analysisData.summary.sources}
                  highlightedSource={highlightedSource}
                  onSourceHover={setHighlightedSource}
                />
              </div>
            </ChartCard>

            {/* Bar Chart - takes 2/3 width */}
            <div className="lg:col-span-2">
              <ChartCard title="Source Ranking">
                <SourceBarChart
                  sources={analysisData.summary.sources}
                  highlightedSource={highlightedSource}
                  onSourceHover={setHighlightedSource}
                />
              </ChartCard>
            </div>
          </div>

          {/* Limited Data Notice */}
          {analysisData.periods.length <= 2 && (
            <div className="text-center text-sm text-slate-400 py-2">
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Add more runs for detailed trend analysis.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
