import { NavigationSection } from '../types'

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    id: 'game-runs',
    label: 'Game Runs',
    items: [
      {
        id: 'farm-runs',
        label: 'Farm Runs',
        href: '/runs/farm',
        icon: 'farming'
      },
      {
        id: 'tournament-runs',
        label: 'Tournament Runs',
        href: '/runs/tournament',
        icon: 'tournament'
      },
      {
        id: 'milestone-runs',
        label: 'Milestone Runs',
        href: '/runs/milestone',
        icon: 'milestone'
      }
    ]
  },
  {
    id: 'charts',
    label: 'Charts',
    items: [
      {
        id: 'coin-analytics',
        label: 'Coin Analytics',
        href: '/charts/coins',
        icon: 'coins'
      },
      {
        id: 'cell-analytics',
        label: 'Cell Analytics',
        href: '/charts/cells',
        icon: 'cells'
      },
      {
        id: 'field-analytics',
        label: 'Field Analytics',
        href: '/charts/fields',
        icon: 'field-analytics'
      },
      {
        id: 'death-analytics',
        label: 'Death Analytics',
        href: '/charts/deaths',
        icon: 'deaths'
      },
      {
        id: 'tier-stats',
        label: 'Tier Stats',
        href: '/charts/tier-stats',
        icon: 'tier-stats'
      },
      {
        id: 'tier-trends',
        label: 'Tier Trends',
        href: '/charts/tier-trends',
        icon: 'tier-trends'
      },
      {
        id: 'source-analytics',
        label: 'Source Analysis',
        href: '/charts/sources',
        icon: 'field-analytics'
      },
      {
        id: 'coverage-report',
        label: 'Coverage Report',
        href: '/charts/coverage',
        icon: 'field-analytics'
      }
    ]
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      {
        id: 'module-calculator',
        label: 'Module Calculator',
        href: '/tools/module-calculator',
        icon: 'calculator'
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      {
        id: 'locale-settings',
        label: 'Regional Format',
        href: '/settings/locale',
        icon: 'locale'
      },
      {
        id: 'bulk-import',
        label: 'Bulk Import',
        href: '/settings/import',
        icon: 'data-management'
      },
      {
        id: 'bulk-export',
        label: 'Bulk Export',
        href: '/settings/export',
        icon: 'data-management'
      },
      {
        id: 'delete-data',
        label: 'Delete Data',
        href: '/settings/delete',
        icon: 'data-management'
      }
    ]
  },
  {
    id: 'community',
    label: 'Community',
    items: [
      {
        id: 'discord',
        label: 'Join Discord',
        href: 'https://discord.gg/J444xGFbTt',
        icon: 'discord'
      },
      {
        id: 'github',
        label: 'View Source',
        href: 'https://github.com/jarekb84/TowerOfTracking',
        icon: 'github'
      }
    ]
  }
]