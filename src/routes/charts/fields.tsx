import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ChartPageLayout } from '@/shared/layouts'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'
import { FieldSelector } from '@/features/analysis/field-analytics/field-selector'
import { useFieldSelector } from '@/features/analysis/field-analytics/use-field-selector'
import { useData } from '@/shared/domain/use-data'
import { formatFieldDisplayName, getFieldFormatter } from '@/shared/domain/fields/field-formatters'
import { getFieldDataType } from '@/shared/domain/fields/field-discovery'
import { RunType } from '@/shared/domain/run-types/types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'

export const Route = createFileRoute('/charts/fields')({
  component: FieldAnalyticsPage,
})

function FieldAnalyticsPage() {
  const { runs } = useData()
  const { selectedField, setSelectedField, availableFields } = useFieldSelector(runs)
  const [runTypeFilter, setRunTypeFilter] = useState<RunTypeFilter>(RunType.FARM)

  // Get field display name for tooltip
  const tooltipLabel = useMemo(() =>
    formatFieldDisplayName(selectedField),
    [selectedField]
  )

  // Get field-specific formatter
  const valueFormatter = useMemo(() => {
    const dataType = getFieldDataType(runs, selectedField)
    return getFieldFormatter(selectedField, dataType)
  }, [runs, selectedField])

  return (
    <ChartPageLayout
      accentColor="indigo"
      title="Field Analytics"
      description="Analyze trends for any tracked metric. Select a field below to visualize performance over time across different periods."
      contentClassName="space-y-4"
    >
      {/* Field Selector */}
      <div className="flex justify-center">
        <FieldSelector
          selectedField={selectedField}
          onFieldChange={setSelectedField}
          availableFields={availableFields}
        />
      </div>

      {/* Time Series Chart with integrated filters */}
      {runs.length === 0 ? (
        <div className="h-[400px] flex items-center justify-center text-slate-400 px-4 text-center">
          <p>No run data available. Import your game data to get started.</p>
        </div>
      ) : (
        <TimeSeriesChart
          metric={selectedField}
          tooltipLabel={tooltipLabel}
          defaultPeriod="hourly"
          runTypeFilter={runTypeFilter}
          onRunTypeChange={setRunTypeFilter}
          valueFormatter={valueFormatter}
        />
      )}
    </ChartPageLayout>
  )
}
