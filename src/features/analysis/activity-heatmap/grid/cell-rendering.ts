/**
 * Cell Rendering Utilities
 *
 * Constants and helpers for rendering heatmap grid cells.
 * Provides opaque background colors for cell states and a fraction-to-percent
 * converter for positioning segment elements within cells.
 */

/**
 * Opaque dark background colors for heatmap cell states.
 *
 * Using `transparent` (which is `rgba(0,0,0,0)`) causes sub-pixel rendering
 * artifacts at hard-stop boundaries — browsers anti-alias between
 * fully-transparent-black and the opaque segment color, producing ghost
 * slivers of color on both edges of partial cells.
 *
 * These opaque colors match the composited visual background of heatmap cells
 * (page bg #0f172a -> bg-slate-800/20 container -> cell background layer).
 */

/** Effective color for normal (non-active-hour) cells. */
export const CELL_BG_NORMAL = '#181d29'

/** Effective color for active-hour cells (subtle amber tint). */
export const CELL_BG_ACTIVE = '#1b202c'

/** Convert a 0-1 fraction to a percentage with 2 decimal places. */
export function toPercent(fraction: number): number {
  return Math.round(fraction * 10000) / 100
}
