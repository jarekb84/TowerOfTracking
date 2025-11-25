import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'
import { FieldSelector } from '@/features/analysis/field-analytics/field-selector'
import { useFieldSelector } from '@/features/analysis/field-analytics/use-field-selector'
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
    <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10 border-b border-slate-700/50">
        <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-full shadow-lg shadow-indigo-500/30"></div>
          Field Analytics
          <span className="text-sm font-normal text-slate-400 ml-auto">Custom Metric Analysis</span>
        </CardTitle>
        <p className="text-slate-400 text-sm mt-2">
          Analyze trends for any tracked metric. Select a field below to visualize performance over time across different periods.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-8 w-full space-y-6">
          {/* Field Selector */}
          <div className="flex justify-center">
            <FieldSelector
              selectedField={selectedField}
              onFieldChange={setSelectedField}
              availableFields={availableFields}
            />
          </div>

          {/* Time Series Chart */}
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
        </div>
      </CardContent>
    </Card>
  )
}
