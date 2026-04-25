import { appGraph } from '../field-graph'
import { _RUN_TYPE_NODE } from '../field-graph/catalog/fields.nodes'
import { RunTypeValue } from './types'

const FALLBACK_COLOR = '#6b7280'

/**
 * Get the hex color code for a run type. Sourced from the graph's metadata on
 * the matching `_runType` enum-value node — the single declaration that also
 * drives display labels. Falls back to neutral gray if the wire value isn't
 * declared.
 */
export function getRunTypeColor(runType: RunTypeValue): string {
  return appGraph().enumValueMeta(_RUN_TYPE_NODE, runType)?.color ?? FALLBACK_COLOR
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
