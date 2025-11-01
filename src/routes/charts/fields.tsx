import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'
import { FieldSelector } from '@/features/analysis/field-analytics/field-selector'
import { useFieldSelector } from '@/features/analysis/field-analytics/use-field-selector'
import { AnalyticsPageHeader } from '@/features/analysis/shared/layout/analytics-page-header'
import { AnalyticsChartCard } from '@/features/analysis/shared/layout/analytics-chart-card'
import { useData } from '@/shared/domain/use-data'
import { formatFieldDisplayName, getFieldFormatter } from '@/shared/domain/fields/field-formatters'
import { getFieldDataType } from '@/shared/domain/fields/field-discovery'

export const Route = createFileRoute('/charts/fields')({
  component: FieldAnalyticsPage,
})

function FieldAnalyticsPage() {
  const { runs } = useData()
  const { selectedField, setSelectedField, availableFields } = useFieldSelector(runs)

  // Generate title from selected field
  const chartTitle = useMemo(() =>
    `${formatFieldDisplayName(selectedField)} Over Time`,
    [selectedField]
  )

  // Get field-specific formatter
  const valueFormatter = useMemo(() => {
    const dataType = getFieldDataType(runs, selectedField)
    return getFieldFormatter(selectedField, dataType)
  }, [runs, selectedField])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <AnalyticsPageHeader
          icon="📊"
          title="Field Analytics"
          description="Analyze trends for any tracked metric. Select a field to visualize performance over time."
          gradientFrom="#818cf8"
          gradientTo="#a78bfa"
        />

        {/* Field Selector */}
        <div className="flex justify-center px-2 sm:px-0">
          <FieldSelector
            selectedField={selectedField}
            onFieldChange={setSelectedField}
            availableFields={availableFields}
          />
        </div>

        {/* Chart Card */}
        <AnalyticsChartCard
          title={formatFieldDisplayName(selectedField)}
          subtitle="Time Series Analysis"
          color="#818cf8"
        >
          {runs.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-slate-400 px-4 text-center">
              <p>No run data available. Import your game data to get started.</p>
            </div>
          ) : (
            <TimeSeriesChart
              metric={selectedField}
              title={chartTitle}
              defaultPeriod="hourly"
              showFarmingOnly={true}
              valueFormatter={valueFormatter}
            />
          )}
        </AnalyticsChartCard>
      </div>
    </div>
  )
}
