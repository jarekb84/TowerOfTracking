/**
 * SMA dropdown option values
 * - 'none': No SMA line displayed
 * - 3, 5, 10: SMA period (number of data points to average)
 */
export type SmaOption = 'none' | 3 | 5 | 10

export const SMA_OPTIONS = ['none', 3, 5, 10] as const

export const SMA_DROPDOWN_OPTIONS = [
  { value: 'none' as const, label: 'No Average' },
  { value: 3 as const, label: 'SMA(3)' },
  { value: 5 as const, label: 'SMA(5)' },
  { value: 10 as const, label: 'SMA(10)' },
]

/**
 * Type guard to check if a value is a valid SmaOption
 */
export function isValidSmaOption(value: unknown): value is SmaOption {
  return value === 'none' || value === 3 || value === 5 || value === 10
}
