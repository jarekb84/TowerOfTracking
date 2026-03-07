import type { PeriodCountFilter } from '@/shared/domain/filters/types'

/**
 * Slice data array to the most recent N items based on interval selection.
 * Returns full array when interval is 'all'.
 */
export function sliceToInterval<T>(data: T[], interval: PeriodCountFilter): T[] {
  if (interval === 'all' || data.length <= interval) {
    return data
  }

  return data.slice(-interval)
}
