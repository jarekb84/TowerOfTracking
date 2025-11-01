import { formatLargeNumber } from '@/features/analysis/shared/formatting/chart-formatters'
import { formatDuration } from '@/features/analysis/shared/parsing/data-parser'

/**
 * Convert field key to human-readable display name
 * Examples:
 *   'coinsEarned' → 'Coins Earned'
 *   'damage_dealt' → 'Damage Dealt'
 *   'wave' → 'Wave'
 */
export function formatFieldDisplayName(fieldKey: string): string {
  // Handle camelCase
  const withSpaces = fieldKey.replace(/([A-Z])/g, ' $1')

  // Handle snake_case
  const cleaned = withSpaces.replace(/_/g, ' ')

  // Capitalize each word
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim()
}

/**
 * Get field-specific value formatter for chart tooltips/axis
 */
export function getFieldFormatter(fieldKey: string, dataType: string): (value: number) => string {
  // Duration fields show as "HH:MM:SS" or "Xh Ym Zs"
  if (dataType === 'duration' || fieldKey === 'realTime') {
    return formatDuration
  }

  // Default: use large number formatting (K, M, B, T, Q, etc.) for all numeric fields
  return formatLargeNumber
}
