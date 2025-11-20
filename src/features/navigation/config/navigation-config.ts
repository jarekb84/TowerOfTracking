import { NavigationSection } from '../types'

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    id: 'game-runs',
    label: 'Game Runs',
    items: [
      {
        id: 'farm-runs',
        label: 'Farm Runs',
        href: '/runs?type=farm',
        icon: 'farming'
      },
      {
        id: 'tournament-runs', 
        label: 'Tournament Runs',
        href: '/runs?type=tournament',
        icon: 'tournament'
      },
      {
        id: 'milestone-runs',
        label: 'Milestone Runs', 
        href: '/runs?type=milestone',
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
        href: '/charts?chart=coins',
        icon: 'coins'
      },
      {
        id: 'cell-analytics',
        label: 'Cell Analytics',
        href: '/charts?chart=cells',
        icon: 'cells'
      },
      {
        id: 'field-analytics',
        label: 'Field Analytics',
        href: '/charts?chart=fields',
        icon: 'field-analytics'
      },
      {
        id: 'death-analytics',
        label: 'Death Analytics',
        href: '/charts?chart=deaths',
        icon: 'deaths'
      },
      {
        id: 'tier-stats',
        label: 'Tier Stats',
        href: '/charts?chart=tiers',
        icon: 'tier-stats'
      },
      {
        id: 'tier-trends',
        label: 'Tier Trends',
        href: '/charts?chart=trends',
        icon: 'tier-trends'
      },
      {
        id: 'totals-analytics',
        label: 'Totals Analysis',
        href: '/charts?chart=totals',
        icon: 'field-analytics'
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      {
        id: 'theme-settings',
        label: 'Theme Settings',
        href: '/settings#theme',
        icon: 'settings'
      },
      {
        id: 'bulk-import',
        label: 'Bulk Import',
        href: '/settings#import',
        icon: 'data-management'
      },
      {
        id: 'bulk-export',
        label: 'Bulk Export', 
        href: '/settings#export',
        icon: 'data-management'
      },
      {
        id: 'delete-data',
        label: 'Delete Data',
        href: '/settings#delete',
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