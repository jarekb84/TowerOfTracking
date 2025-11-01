import { RunType, RunTypeValue } from '@/shared/types/game-run.types'

/**
 * Run type color mappings for visual consistency
 * These colors are used for selection indicators, tabs, and preview displays
 */
const RUN_TYPE_COLORS: Record<RunTypeValue, string> = {
  [RunType.FARM]: '#10b981',      // Green
  [RunType.TOURNAMENT]: '#f59e0b', // Amber
  [RunType.MILESTONE]: '#8b5cf6',  // Purple
}

/**
 * Get the hex color code for a run type
 * Returns the color for visual indicators (dots, borders, backgrounds)
 */
export function getRunTypeColor(runType: RunTypeValue): string {
  return RUN_TYPE_COLORS[runType]
}

/**
 * Get background color with opacity for selected run type buttons
 * Format: color with 20 opacity (#RRGGBB20)
 */
export function getRunTypeBackgroundColor(runType: RunTypeValue): string {
  return `${getRunTypeColor(runType)}20`
}

/**
 * Get border color with opacity for selected run type buttons
 * Format: color with 70 opacity (#RRGGBB70)
 */
export function getRunTypeBorderColor(runType: RunTypeValue): string {
  return `${getRunTypeColor(runType)}70`
}
