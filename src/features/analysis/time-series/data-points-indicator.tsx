import { FarmingOnlyIndicator } from '@/shared/domain/run-types/farming-only-indicator'

interface DataPointsIndicatorProps {
  dataPointCount: number
  showFarmingOnly: boolean
}

/**
 * Displays data point count and farming-only indicator when no title is present.
 * Extracted from TimeSeriesChart to reduce component complexity.
 */
export function DataPointsIndicator({ dataPointCount, showFarmingOnly }: DataPointsIndicatorProps) {
  if (dataPointCount === 0 && !showFarmingOnly) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      {dataPointCount > 0 && (
        <span className="text-xs text-slate-400 px-2 py-1 bg-slate-700/50 rounded-md">
          {dataPointCount} points
        </span>
      )}
      {showFarmingOnly && <FarmingOnlyIndicator />}
    </div>
  )
}
