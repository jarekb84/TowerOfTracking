import type { PeriodCountOverrides } from '@/shared/domain/filters/period-count/period-count-logic'
import { Duration } from '@/shared/domain/filters/types'

/** Tier Trends uses a column-based table where each period = a column.
 *  Values above ~7 produce an unusable layout, so we constrain to [2-7]. */
export const TIER_TRENDS_PERIOD_COUNTS: PeriodCountOverrides = {
  [Duration.PER_RUN]: [2, 3, 4, 5, 6, 7],
  [Duration.DAILY]:   [2, 3, 4, 5, 6, 7],
  [Duration.WEEKLY]:  [2, 3, 4, 5, 6, 7],
  [Duration.MONTHLY]: [2, 3, 4, 5, 6, 7],
  [Duration.YEARLY]:  [2, 3, 4, 5],
}
