/**
 * Unified Filter Components
 *
 * Public API for shared filter components used across analysis pages.
 */

// Types
export { Duration, PERIOD_UNIT_LABELS } from './types'

// Tier filter - pure logic functions, hooks, and components
export {
  // Tier value adapters for bridging different "all tiers" representations
  nullToAllTierAdapter,
  allToNullTierAdapter,
  zeroToAllTierAdapter,
  allToZeroTierAdapter
} from './tier/tier-filter-logic'
export { useAvailableTiers,  } from './tier/use-available-tiers'
export { TierSelector,  } from './tier/tier-selector'

// Duration filter - pure logic functions, hooks, and components
export {
  // Duration value adapters for bridging legacy duration enums
  stringToDuration,
  durationToString
} from './duration/duration-filter-logic'
export { useAvailableDurations,  } from './duration/use-available-durations'
export { DurationSelector,  } from './duration/duration-selector'

// Period count filter - pure logic functions, hooks, and components
export {
  getPeriodCountOptions,
  getDefaultPeriodCount,
  getPeriodCountLabel
} from './period-count/period-count-logic'

export { PeriodCountSelector,  } from './period-count/period-count-selector'
