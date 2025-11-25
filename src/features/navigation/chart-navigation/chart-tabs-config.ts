import { TabConfig } from '../tabs-navigation/tabs-navigation'

/**
 * Configuration for chart analytics tabs.
 * Each tab represents a different analytics view accessible via route-based navigation.
 */
export const CHART_TABS: TabConfig[] = [
  {
    value: 'coins',
    route: '/charts/coins',
    label: 'Coins Analytics',
    shortLabel: 'Coins',
    activeClassName: 'data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-100 hover:bg-emerald-500/10',
  },
  {
    value: 'cells',
    route: '/charts/cells',
    label: 'Cells Analytics',
    shortLabel: 'Cells',
    activeClassName: 'data-[active=true]:bg-pink-500/15 data-[active=true]:text-pink-100 hover:bg-pink-500/10',
  },
  {
    value: 'fields',
    route: '/charts/fields',
    label: 'Field Analytics',
    shortLabel: 'Fields',
    activeClassName: 'data-[active=true]:bg-indigo-500/15 data-[active=true]:text-indigo-100 hover:bg-indigo-500/10',
  },
  {
    value: 'deaths',
    route: '/charts/deaths',
    label: 'Deaths Analysis',
    shortLabel: 'Deaths',
    activeClassName: 'data-[active=true]:bg-red-500/15 data-[active=true]:text-red-100 hover:bg-red-500/10',
  },
  {
    value: 'tier-stats',
    route: '/charts/tier-stats',
    label: 'Tier Stats',
    shortLabel: 'Stats',
    activeClassName: 'data-[active=true]:bg-blue-500/15 data-[active=true]:text-blue-100 hover:bg-blue-500/10',
  },
  {
    value: 'tier-trends',
    route: '/charts/tier-trends',
    label: 'Tier Trends',
    shortLabel: 'Trends',
    activeClassName: 'data-[active=true]:bg-orange-500/15 data-[active=true]:text-orange-100 hover:bg-orange-500/10',
  },
  {
    value: 'sources',
    route: '/charts/sources',
    label: 'Source Analysis',
    shortLabel: 'Sources',
    activeClassName: 'data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-100 hover:bg-purple-500/10',
  },
]

/**
 * Get all valid chart routes for route validation.
 */
export function getValidChartRoutes(): string[] {
  return CHART_TABS.map(tab => tab.route)
}
