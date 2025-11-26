import { TabConfig } from '../tabs-navigation/tabs-navigation'

/**
 * Configuration for settings tabs.
 * Each tab represents a different settings section accessible via route-based navigation.
 */
export const SETTINGS_TABS: TabConfig[] = [
  {
    value: 'import',
    route: '/settings/import',
    label: 'Import Data',
    shortLabel: 'Import',
    activeClassName: 'data-[active=true]:bg-blue-500/15 data-[active=true]:text-blue-100 hover:bg-blue-500/10',
  },
  {
    value: 'export',
    route: '/settings/export',
    label: 'Export Data',
    shortLabel: 'Export',
    activeClassName: 'data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-100 hover:bg-emerald-500/10',
  },
  {
    value: 'delete',
    route: '/settings/delete',
    label: 'Delete Data',
    shortLabel: 'Delete',
    activeClassName: 'data-[active=true]:bg-red-500/15 data-[active=true]:text-red-100 hover:bg-red-500/10',
  },
]

/**
 * Get all valid settings routes for route validation.
 */
export function getValidSettingsRoutes(): string[] {
  return SETTINGS_TABS.map(tab => tab.route)
}
