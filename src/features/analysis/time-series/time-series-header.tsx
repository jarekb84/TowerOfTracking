import type { TimePeriodConfig } from './chart-types'
import { FarmingOnlyIndicator } from '@/shared/domain/run-types/farming-only-indicator'

interface TimeSeriesHeaderProps {
  title: string
  subtitle?: string
  currentConfig: TimePeriodConfig
  dataPointCount: number
  showFarmingOnly: boolean
}

/**
 * Header section for TimeSeriesChart displaying title, subtitle, and metadata.
 * Extracted from TimeSeriesChart to reduce component complexity.
 */
export function TimeSeriesHeader({
  title,
  subtitle,
  currentConfig,
  dataPointCount,
  showFarmingOnly
}: TimeSeriesHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
          <div
            className="w-2 h-8 rounded-full shadow-lg animate-pulse"
            style={{
              background: `linear-gradient(to bottom, ${currentConfig.color}CC, ${currentConfig.color})`,
              boxShadow: `0 4px 12px ${currentConfig.color}30`
            }}
          />
          {title}
          <span className="text-sm font-normal text-slate-400 ml-auto">
            {currentConfig.label}
            {dataPointCount > 0 && (
              <span className="ml-2 text-xs px-2 py-1 bg-slate-700/50 rounded-md">
                {dataPointCount} points
              </span>
            )}
          </span>
        </h3>
        {showFarmingOnly && <FarmingOnlyIndicator />}
      </div>
      {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
    </div>
  )
}
