import type { FieldTrendData } from '../types'

/**
 * Returns the appropriate color class for trend change indicators
 * Provides consistent color coding across all trend displays
 * Enhanced for better accessibility and contrast
 */
export function getTrendChangeColor(change: FieldTrendData['change']): string {
  if (change.direction === 'up') return 'text-emerald-400'
  if (change.direction === 'down') return 'text-red-400'
  return 'text-muted-foreground'
}

/**
 * Returns the appropriate icon character for trend change direction
 * Provides consistent iconography across all trend displays
 */
export function getTrendChangeIcon(direction: FieldTrendData['change']['direction']): string {
  if (direction === 'up') return '↗'
  if (direction === 'down') return '↘'
  return '→'
}

/**
 * Returns the stroke color for sparkline paths based on trend direction
 * Provides consistent sparkline coloring across all chart displays
 * Enhanced colors for better visibility and contrast
 */
export function getTrendSparklineColor(direction: FieldTrendData['change']['direction']): string {
  if (direction === 'up') return '#34d399'
  if (direction === 'down') return '#f87171'
  return '#94a3b8'
}