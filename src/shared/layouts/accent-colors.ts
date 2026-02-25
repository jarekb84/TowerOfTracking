/**
 * Supported accent colors for themed components.
 * These correspond to Tailwind color palette names.
 */
export type AccentColor =
  | 'emerald'
  | 'pink'
  | 'indigo'
  | 'blue'
  | 'orange'
  | 'red'
  | 'purple'
  | 'cyan'
  | 'amber'

/**
 * Pre-computed Tailwind classes for each accent color.
 * Using a static mapping because Tailwind cannot process dynamic class names.
 */
interface AccentColorClasses {
  /** Hover shadow effect: hover:shadow-{color}-500/10 */
  hoverShadow: string
  /** Header gradient: bg-gradient-to-r from-{color}-500/10 via-transparent to-{color}-500/10 */
  headerGradient: string
  /** Accent bar gradient: bg-gradient-to-b from-{color}-400 to-{color}-600 */
  accentBar: string
  /** Accent bar shadow: shadow-{color}-500/30 */
  accentBarShadow: string
}

const ACCENT_COLOR_MAP: Record<AccentColor, AccentColorClasses> = {
  emerald: {
    hoverShadow: 'hover:shadow-emerald-500/10',
    headerGradient: 'bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10',
    accentBar: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
    accentBarShadow: 'shadow-emerald-500/30',
  },
  pink: {
    hoverShadow: 'hover:shadow-pink-500/10',
    headerGradient: 'bg-gradient-to-r from-pink-500/10 via-transparent to-pink-500/10',
    accentBar: 'bg-gradient-to-b from-pink-400 to-pink-600',
    accentBarShadow: 'shadow-pink-500/30',
  },
  indigo: {
    hoverShadow: 'hover:shadow-indigo-500/10',
    headerGradient: 'bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10',
    accentBar: 'bg-gradient-to-b from-indigo-400 to-indigo-600',
    accentBarShadow: 'shadow-indigo-500/30',
  },
  blue: {
    hoverShadow: 'hover:shadow-blue-500/10',
    headerGradient: 'bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10',
    accentBar: 'bg-gradient-to-b from-blue-400 to-blue-600',
    accentBarShadow: 'shadow-blue-500/30',
  },
  orange: {
    hoverShadow: 'hover:shadow-orange-500/10',
    headerGradient: 'bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10',
    accentBar: 'bg-gradient-to-b from-orange-400 to-orange-600',
    accentBarShadow: 'shadow-orange-500/30',
  },
  red: {
    hoverShadow: 'hover:shadow-red-500/10',
    headerGradient: 'bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10',
    accentBar: 'bg-gradient-to-b from-red-400 to-red-600',
    accentBarShadow: 'shadow-red-500/30',
  },
  purple: {
    hoverShadow: 'hover:shadow-purple-500/10',
    headerGradient: 'bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10',
    accentBar: 'bg-gradient-to-b from-purple-400 to-purple-600',
    accentBarShadow: 'shadow-purple-500/30',
  },
  cyan: {
    hoverShadow: 'hover:shadow-cyan-500/10',
    headerGradient: 'bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10',
    accentBar: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
    accentBarShadow: 'shadow-cyan-500/30',
  },
  amber: {
    hoverShadow: 'hover:shadow-amber-500/10',
    headerGradient: 'bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10',
    accentBar: 'bg-gradient-to-b from-amber-400 to-amber-600',
    accentBarShadow: 'shadow-amber-500/30',
  },
}

/**
 * Get pre-computed Tailwind classes for an accent color.
 * Returns the complete set of classes needed for themed components.
 */
export function getAccentColorClasses(color: AccentColor): AccentColorClasses {
  return ACCENT_COLOR_MAP[color]
}
