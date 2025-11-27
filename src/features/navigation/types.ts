interface NavigationItem {
  id: string
  label: string
  icon?: 'runs' | 'farming' | 'tournament' | 'milestone' | 'coins' | 'cells' | 'deaths' | 'tier-stats' | 'tier-trends' | 'field-analytics' | 'settings' | 'data-management' | 'locale' | 'discord' | 'github'
  href?: string
  children?: NavigationItem[]
}

export interface NavigationSection {
  id: string
  label: string
  items: NavigationItem[]
}