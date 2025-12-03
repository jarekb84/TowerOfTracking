import type { TimePeriodConfig } from './chart-types'

interface TimeSeriesHeaderProps {
  title: string
  subtitle?: string
  currentConfig: TimePeriodConfig
}

/**
 * Header section for TimeSeriesChart displaying title and subtitle.
 * Period and data point info moved to filter controls row for better visual grouping.
 */
export function TimeSeriesHeader({
  title,
  subtitle,
  currentConfig
}: TimeSeriesHeaderProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
        <div
          className="w-2 h-8 rounded-full shadow-lg"
          style={{
            background: `linear-gradient(to bottom, ${currentConfig.color}CC, ${currentConfig.color})`,
            boxShadow: `0 4px 12px ${currentConfig.color}30`
          }}
        />
        {title}
      </h3>
      {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
    </div>
  )
}
