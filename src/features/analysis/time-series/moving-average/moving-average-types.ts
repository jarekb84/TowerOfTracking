/**
 * Moving average dropdown option values
 * - 'none': No moving average line displayed
 * - 3, 5, 10: Moving average window size (number of data points to average)
 */
export type MovingAveragePeriod = 'none' | 3 | 5 | 10


export const MOVING_AVERAGE_OPTIONS = [
  { value: 'none' as const, label: 'No Average' },
  { value: 3 as const, label: 'Avg(3)' },
  { value: 5 as const, label: 'Avg(5)' },
  { value: 10 as const, label: 'Avg(10)' },
]

/**
 * Type guard to check if a value is a valid MovingAveragePeriod
 */
export function isValidMovingAveragePeriod(value: unknown): value is MovingAveragePeriod {
  return value === 'none' || value === 3 || value === 5 || value === 10
}
