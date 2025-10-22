/**
 * Pure functions for tier stats table cell styling
 */

export interface CellStyleConfig {
  isHourlyRate: boolean
  dataType: 'number' | 'duration' | 'string' | 'date'
}

/**
 * Get the CSS class name for a tier stats table cell based on its type
 *
 * @param config - Cell configuration specifying type and hourly rate status
 * @returns Tailwind CSS class string for the cell
 */
export function getTierStatsCellClassName(config: CellStyleConfig): string {
  const base = 'font-mono text-sm px-3 py-1.5 rounded-md cursor-help transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50'

  if (config.isHourlyRate) {
    return `${base} bg-orange-500/10 border border-orange-500/30 text-orange-200 hover:bg-orange-500/20 hover:border-orange-500/40 hover:shadow-sm`
  }

  if (config.dataType === 'duration') {
    return `${base} bg-slate-700/40 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60 hover:border-slate-600/60`
  }

  return `${base} bg-slate-700/40 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60 hover:border-slate-600/60`
}
