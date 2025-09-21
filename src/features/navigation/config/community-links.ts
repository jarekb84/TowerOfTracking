/**
 * Configuration for community links displayed in navigation
 */

export interface CommunityLink {
  id: string
  label: string
  href: string
  icon: 'discord' | 'github'
  hoverColor: string
  focusRingColor: string
  ariaLabel: string
  title: string
}

export const COMMUNITY_LINKS: CommunityLink[] = [
  {
    id: 'discord',
    label: 'Join Discord',
    href: 'https://discord.gg/J444xGFbTt',
    icon: 'discord',
    hoverColor: 'hover:text-purple-300',
    focusRingColor: 'focus-visible:ring-purple-400/50',
    ariaLabel: 'Join our Discord community',
    title: 'Join Discord'
  },
  {
    id: 'github',
    label: 'View Source',
    href: 'https://github.com/jarekb84/TowerOfTracking',
    icon: 'github',
    hoverColor: 'hover:text-orange-300',
    focusRingColor: 'focus-visible:ring-orange-400/50',
    ariaLabel: 'View source code on GitHub',
    title: 'View on GitHub'
  }
] as const


export function createCommunityLinkClassName(link: CommunityLink): string {
  // Create coordinated background hover states that match the accent colors
  const backgroundHover = link.id === 'discord' 
    ? 'hover:bg-purple-500/10' 
    : 'hover:bg-orange-500/10'
  
  return [
    'flex items-center justify-center w-9 h-9 text-slate-400',
    link.hoverColor,
    backgroundHover,
    'hover:shadow-sm transition-all duration-200 rounded-lg',
    'focus-visible:outline-none focus-visible:ring-2',
    link.focusRingColor,
    'focus-visible:bg-slate-800/40'
  ].join(' ')
}