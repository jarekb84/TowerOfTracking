/**
 * Custom Tooltip Component for Time Series Chart
 *
 * Shows enhanced run context (tier, wave, duration, date/time) for per-run data points.
 * Falls back to simple label display for aggregated data (daily, weekly, etc).
 *
 * Also exports a Recharts-compatible wrapper for easy integration with chart components.
 */

import type { RunInfo, ChartDataPoint } from './chart-types'
import { RunInfoHeader } from '@/features/analysis/shared/tooltips/run-info-header'

interface TimeSeriesTooltipProps {
  /** Period label (e.g., "Per Run", "Daily") */
  periodLabel: string
  /** Date label from chart (e.g., "Nov 30") */
  dateLabel: string
  /** Formatted value string */
  formattedValue: string
  /** Metric label (e.g., "Total Damage") */
  metricLabel: string
  /** Optional run info for per-run data points */
  runInfo?: RunInfo
  /** Accent color for styling */
  accentColor?: string
}

function TimeSeriesTooltip({
  periodLabel,
  dateLabel,
  formattedValue,
  metricLabel,
  runInfo,
  accentColor,
}: TimeSeriesTooltipProps) {
  return (
    <div
      className="bg-slate-900/95 border border-slate-600/80 rounded-lg p-3 shadow-xl backdrop-blur-sm min-w-[200px]"
      style={{
        borderColor: accentColor
          ? `color-mix(in srgb, ${accentColor} 50%, rgb(71 85 105))`
          : undefined,
      }}
    >
      {/* Header section - shows run context for per-run mode */}
      <div className="mb-2.5 pb-2.5 border-b border-slate-700/50">
        {runInfo ? (
          <RunInfoHeader runInfo={runInfo} accentColor={accentColor} />
        ) : (
          <div className="text-slate-200 font-medium text-sm">
            {periodLabel}: {dateLabel}
          </div>
        )}
      </div>

      {/* Value section */}
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-slate-400 text-sm">{metricLabel}</span>
        <span
          className="font-semibold tabular-nums"
          style={{ color: accentColor ?? 'rgb(241 245 249)' }}
        >
          {formattedValue}
        </span>
      </div>
    </div>
  )
}

/**
 * Props for the Recharts-compatible tooltip wrapper
 */
interface TimeSeriesChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: ChartDataPoint
  }>
  label?: string
  periodLabel: string
  metricLabel: string
  formatter: (value: number) => string
  isHourlyPeriod: boolean
  accentColor: string
}

/**
 * Recharts-compatible tooltip wrapper component.
 * Extracts data from Recharts payload and renders TimeSeriesTooltip.
 */
export function TimeSeriesChartTooltip({
  active,
  payload,
  label,
  periodLabel,
  metricLabel,
  formatter,
  isHourlyPeriod,
  accentColor,
}: TimeSeriesChartTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const dataPoint = payload[0].payload
  const value = payload[0].value
  const formattedValue = formatter(value) + (isHourlyPeriod ? '/hour' : '')

  return (
    <TimeSeriesTooltip
      periodLabel={periodLabel}
      dateLabel={label || ''}
      formattedValue={formattedValue}
      metricLabel={metricLabel}
      runInfo={dataPoint.runInfo}
      accentColor={accentColor}
    />
  )
}
