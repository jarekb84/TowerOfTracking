import { RunType, RunTypeValue } from '@/shared/domain/run-types/types'
import { TabConfig } from '../tabs-navigation/tabs-navigation'

/**
 * Extended tab config for runs tabs, which includes run type for filtering.
 */
export interface RunsTabConfig extends TabConfig {
  runType: RunTypeValue
}

/**
 * Configuration for runs tabs.
 * Each tab represents a different run type accessible via route-based navigation.
 */
export const RUNS_TABS: RunsTabConfig[] = [
  {
    value: 'farm',
    route: '/runs/farm',
    label: 'Farm Runs',
    shortLabel: 'Farm',
    runType: RunType.FARM,
    activeClassName: 'data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-100 hover:bg-emerald-500/10',
  },
  {
    value: 'tournament',
    route: '/runs/tournament',
    label: 'Tournament Runs',
    shortLabel: 'Tournament',
    runType: RunType.TOURNAMENT,
    activeClassName: 'data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-100 hover:bg-amber-500/10',
  },
  {
    value: 'milestone',
    route: '/runs/milestone',
    label: 'Milestone Runs',
    shortLabel: 'Milestone',
    runType: RunType.MILESTONE,
    activeClassName: 'data-[active=true]:bg-violet-500/15 data-[active=true]:text-violet-100 hover:bg-violet-500/10',
  },
]

/**
 * Get all valid runs routes for route validation.
 */
export function getValidRunsRoutes(): string[] {
  return RUNS_TABS.map(tab => tab.route)
}
