/**
 * Custom Tooltip Component for Time Series Chart
 *
 * Shows enhanced run context (tier, wave, duration, date/time) for per-run data points.
 * Falls back to simple label display for aggregated data (daily, weekly, etc).
 *
 * Also exports a Recharts-compatible wrapper for easy integration with chart components.
 */

import type { RunInfo, ChartDataPoint, PeriodInfo } from './chart-types'
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
  /** Optional period info for weekly/monthly daily averages */
  periodInfo?: PeriodInfo
  /** Formatter function for daily average */
  formatter?: (value: number) => string
  /** Accent color for styling */
  accentColor?: string
  /** Moving average value at this data point (null if insufficient data) */
  trendValue?: number | null
}

function TimeSeriesTooltip({
  periodLabel,
  dateLabel,
  formattedValue,
  metricLabel,
  runInfo,
  periodInfo,
  formatter,
  accentColor,
  trendValue,
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

      {/* Moving average row - only when enabled and value exists */}
      {trendValue !== undefined && trendValue !== null && formatter && (
        <div className="flex items-baseline justify-between gap-4 mt-2 pt-2 border-t border-slate-700/30">
          <span className="text-xs flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-orange-500/70 rounded-full" style={{ borderStyle: 'dashed' }} />
            <span className="text-slate-400">Moving Avg</span>
          </span>
          <span className="text-orange-400/80 text-xs tabular-nums font-medium">
            {formatter(trendValue)}
          </span>
        </div>
      )}

      {/* Daily Average row - only for weekly/monthly */}
      {periodInfo && formatter && (
        <div className="flex items-baseline justify-between gap-4 mt-2 pt-2 border-t border-slate-700/30">
          <span className="text-slate-500 text-xs">Daily Avg</span>
          <span className="text-slate-400 text-xs tabular-nums">
            {formatter(periodInfo.dailyAverage)}
            <span className="text-slate-500 ml-0.5">/day</span>
          </span>
        </div>
      )}
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
  /** Whether to show moving average value in tooltip */
  showTrendLine?: boolean
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
  showTrendLine = false,
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
      periodInfo={dataPoint.periodInfo}
      formatter={formatter}
      accentColor={accentColor}
      trendValue={showTrendLine ? dataPoint.movingAverage : undefined}
    />
  )
}
