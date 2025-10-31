import { RunType, RunTypeValue } from '../types/game-run.types'
import { RunTypeFilter } from '@/features/analysis/shared/run-type-filter'

/**
 * Maps URL parameter values to internal run type values
 * Normalizes URL params to match RunType enum values
 */
export function mapUrlTypeToRunType(urlType: string | undefined): RunTypeValue {
  switch (urlType) {
    case RunType.FARM:
      return RunType.FARM
    case RunType.TOURNAMENT:
      return RunType.TOURNAMENT
    case RunType.MILESTONE:
      return RunType.MILESTONE
    default:
      return RunType.FARM // Default fallback
  }
}

/**
 * Validates and normalizes run type filter values to internal run type values
 * Delegates to mapUrlTypeToRunType for consistent mapping logic
 * Returns 'farm' for invalid or 'all' values
 */
export function normalizeRunTypeFilter(filterValue: RunTypeFilter): RunTypeValue {
  if (filterValue === 'all') {
    return RunType.FARM
  }

  // Delegate to the canonical URL-to-RunType mapper for consistency
  return mapUrlTypeToRunType(filterValue)
}
