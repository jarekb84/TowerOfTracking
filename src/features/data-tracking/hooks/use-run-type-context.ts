import { useLocation } from '@tanstack/react-router'
import { mapUrlTypeToRunType } from '../utils/run-type-defaults'
import { RunType, RunTypeValue } from '../types/game-run.types'

interface RunsSearchParams {
  type?: RunTypeValue
}

/**
 * Hook to determine the default run type based on current URL context
 * Reads the type parameter from /runs route if available, otherwise defaults to RunType.FARM
 */
export function useRunTypeContext(): RunTypeValue {
  const location = useLocation()

  // Check if we're on the runs page and extract type parameter
  // Use endsWith to support both local (/runs) and production (/TowerOfTracking/runs) paths
  const isRunsPage = location.pathname.endsWith('/runs')

  if (isRunsPage) {
    const searchParams = location.search as RunsSearchParams
    return mapUrlTypeToRunType(searchParams.type)
  }

  // Default to farm for all other pages
  return RunType.FARM
}
