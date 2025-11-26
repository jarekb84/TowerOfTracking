import { useMatchRoute } from '@tanstack/react-router'
import { RUNS_TABS } from '@/features/navigation/runs-navigation/runs-tabs-config'
import { RunType, RunTypeValue } from './types'

/**
 * Hook to determine the default run type based on current URL context.
 * Uses useMatchRoute() to detect which runs route is active (handles basepath automatically).
 * Returns the matching run type, or defaults to RunType.FARM.
 */
export function useRunTypeContext(): RunTypeValue {
  const matchRoute = useMatchRoute()

  // Check each runs tab route to find the active one
  for (const tab of RUNS_TABS) {
    if (matchRoute({ to: tab.route })) {
      return tab.runType
    }
  }

  // Default to farm for all other pages (including non-runs routes)
  return RunType.FARM
}
