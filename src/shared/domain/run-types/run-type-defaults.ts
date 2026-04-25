import { RunType, RunTypeValue, isRunTypeValue } from './types'
import { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'

/**
 * Maps URL parameter values to internal run type values. Unknown inputs
 * (including `undefined`, empty string, and legacy values like `'farming'`)
 * default to FARM, preserving prior behavior.
 */
export function mapUrlTypeToRunType(urlType: string | undefined): RunTypeValue {
  if (!urlType) return RunType.FARM
  return isRunTypeValue(urlType) ? urlType : RunType.FARM
}

/**
 * Validates and normalizes run type filter values to internal run type values.
 * Delegates to `mapUrlTypeToRunType` for consistent mapping logic. Returns
 * FARM for the `'all'` marker and for any invalid input.
 */
export function normalizeRunTypeFilter(filterValue: RunTypeFilter): RunTypeValue {
  if (filterValue === 'all') {
    return RunType.FARM
  }

  return mapUrlTypeToRunType(filterValue)
}
