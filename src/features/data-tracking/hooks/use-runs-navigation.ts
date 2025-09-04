import { useUrlSearchParam } from '../../navigation/hooks/use-url-search-param'

export type RunsTabType = 'farming' | 'tournament' | 'milestone'

interface RunsSearchParams extends Record<string, unknown> {
  type?: RunsTabType
}

/**
 * Hook for managing runs tab navigation via URL parameters
 */
export function useRunsNavigation() {
  const { search, updateSearch } = useUrlSearchParam<RunsSearchParams>(
    '/runs', 
    { type: 'farming' }
  )

  const activeTab = search.type || 'farming'

  const setActiveTab = (type: RunsTabType) => {
    updateSearch({ type })
  }

  return {
    activeTab,
    setActiveTab
  }
}