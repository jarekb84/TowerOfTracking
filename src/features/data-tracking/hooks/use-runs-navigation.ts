import { useUrlSearchParam } from '../../navigation/hooks/use-url-search-param'
import { RunType, RunTypeValue } from '../types/game-run.types'

export type RunsTabType = RunTypeValue

interface RunsSearchParams extends Record<string, unknown> {
  type?: RunsTabType
}

/**
 * Hook for managing runs tab navigation via URL parameters
 */
export function useRunsNavigation() {
  const { search, updateSearch } = useUrlSearchParam<RunsSearchParams>(
    '/runs',
    { type: RunType.FARM }
  )

  const activeTab = search.type || RunType.FARM

  const setActiveTab = (type: RunsTabType) => {
    updateSearch({ type })
  }

  return {
    activeTab,
    setActiveTab
  }
}