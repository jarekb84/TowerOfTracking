import { useMemo } from 'react'
import { useData } from '@/shared/domain/use-data'
import { RunTypeValue } from '@/shared/domain/run-types/types'
import { filterRunsByType } from './filter-runs-by-type'

/**
 * Hook for getting runs filtered by type with data context access.
 * Extracts run filtering logic from route components.
 */
export function useFilteredRuns(runType: RunTypeValue) {
  const { runs, removeRun } = useData()

  const filteredRuns = useMemo(
    () => filterRunsByType(runs, runType),
    [runs, runType]
  )

  return {
    runs: filteredRuns,
    removeRun,
  }
}
