/**
 * Metric Toggle Selector Component
 *
 * Two-column multi-select for coverage metrics.
 */

import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'
import type { CoverageFieldName, CoverageMetricDefinition } from '../types'
import { getEconomicMetrics, getCombatMetrics } from '../coverage-config'

interface MetricToggleSelectorProps {
  selectedMetrics: Set<CoverageFieldName>
  onToggleMetric: (fieldName: CoverageFieldName) => void
}

interface MetricColumnProps {
  title: string
  metrics: CoverageMetricDefinition[]
  selectedMetrics: Set<CoverageFieldName>
  onToggleMetric: (fieldName: CoverageFieldName) => void
}

function MetricColumn({
  title,
  metrics,
  selectedMetrics,
  onToggleMetric,
}: MetricColumnProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        {title}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {metrics.map((metric) => {
          const isSelected = selectedMetrics.has(metric.fieldName)
          const isLastSelected = isSelected && selectedMetrics.size === 1

          return (
            <Button
              key={metric.fieldName}
              variant={isSelected && !isLastSelected ? 'outline-selected-cyan' : 'outline'}
              size="sm"
              onClick={() => onToggleMetric(metric.fieldName)}
              disabled={isLastSelected}
              title={isLastSelected ? 'At least one metric must be selected' : undefined}
              className={cn(
                'whitespace-nowrap shrink-0 gap-1.5',
                isLastSelected && 'border-cyan-500/50 bg-cyan-500/5 text-foreground/70 cursor-not-allowed'
              )}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: metric.color }}
              />
              {metric.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export function MetricToggleSelector({
  selectedMetrics,
  onToggleMetric,
}: MetricToggleSelectorProps) {
  const economicMetrics = getEconomicMetrics()
  const combatMetrics = getCombatMetrics()

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
      <MetricColumn
        title="Economic"
        metrics={economicMetrics}
        selectedMetrics={selectedMetrics}
        onToggleMetric={onToggleMetric}
      />
      <MetricColumn
        title="Combat"
        metrics={combatMetrics}
        selectedMetrics={selectedMetrics}
        onToggleMetric={onToggleMetric}
      />
    </div>
  )
}
