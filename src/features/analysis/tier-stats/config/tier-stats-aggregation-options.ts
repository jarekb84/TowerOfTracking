/**
 * UI options for tier stats aggregation selector
 */

import { TierStatsAggregation } from '../types'

interface AggregationOption {
  value: TierStatsAggregation
  label: string
  tooltip: string
}

/**
 * Get all available aggregation options for tier stats
 */
export function getAggregationOptions(): AggregationOption[] {
  return [
    {
      value: TierStatsAggregation.MAX,
      label: 'Maximum',
      tooltip:
        "Shows the highest value ever recorded. Can be misleading if you had one lucky run or a temporary mechanic that was nerfed."
    },
    {
      value: TierStatsAggregation.P99,
      label: 'P99',
      tooltip:
        "Filters out the top 1% of extreme outliers. Think of it like: 'If I ran this tier 100 times, only 1 run would be better than this value.' Great for seeing your best typical performance."
    },
    {
      value: TierStatsAggregation.P90,
      label: 'P90',
      tooltip:
        "Filters out the top 10% of outliers. Like saying: '9 out of 10 runs will be at or below this value.' Shows what a good typical run looks like."
    },
    {
      value: TierStatsAggregation.P75,
      label: 'P75',
      tooltip:
        'Shows above-average performance. Three quarters of your runs will be at or below this value, one quarter will be better.'
    },
    {
      value: TierStatsAggregation.P50,
      label: 'P50 (Median)',
      tooltip:
        'The middle value - half your runs are better, half are worse. Similar to average but less affected by extreme outliers.'
    }
  ]
}

/**
 * Get display label for an aggregation type
 */
export function getAggregationLabel(aggregationType: TierStatsAggregation): string {
  const option = getAggregationOptions().find(opt => opt.value === aggregationType)
  return option?.label ?? 'Maximum'
}

/**
 * Get tooltip text for an aggregation type
 */
export function getAggregationTooltip(aggregationType: TierStatsAggregation): string {
  const option = getAggregationOptions().find(opt => opt.value === aggregationType)
  return option?.tooltip ?? ''
}
