/**
 * Currency Configuration
 *
 * Defines the supported currencies in the spending planner.
 * Designed to be extensible for future currency additions.
 */

import { CurrencyId } from '../types'
import type {
  CurrencyConfig,
  CurrencyIncome,
  StoneIncomeBreakdown,
  GemIncomeBreakdown,
} from '../types'

/**
 * Configuration for all supported currencies.
 * Add new currencies here when extending the system.
 */
export const CURRENCY_CONFIGS: Record<CurrencyId, CurrencyConfig> = {
  [CurrencyId.Coins]: {
    id: CurrencyId.Coins,
    displayName: 'Coins',
    abbreviation: 'c',
    color: 'text-yellow-400',
    hasUnitSelector: true,
  },
  [CurrencyId.Stones]: {
    id: CurrencyId.Stones,
    displayName: 'Stones',
    abbreviation: 'st',
    color: 'text-emerald-400',
    hasUnitSelector: false,
  },
  [CurrencyId.RerollShards]: {
    id: CurrencyId.RerollShards,
    displayName: 'Reroll Shards',
    timelineName: 'Shards',
    abbreviation: 'rs',
    color: 'text-blue-400',
    hasUnitSelector: true,
  },
  [CurrencyId.Gems]: {
    id: CurrencyId.Gems,
    displayName: 'Gems',
    abbreviation: 'g',
    color: 'text-purple-400',
    hasUnitSelector: false,
  },
}

/**
 * Ordered list of currency IDs for consistent display.
 */
export const CURRENCY_ORDER: CurrencyId[] = [
  CurrencyId.Coins,
  CurrencyId.Stones,
  CurrencyId.RerollShards,
  CurrencyId.Gems,
]

/**
 * Get configuration for a specific currency.
 */
export function getCurrencyConfig(currencyId: CurrencyId): CurrencyConfig {
  return CURRENCY_CONFIGS[currencyId]
}

/**
 * Get all currency configurations in display order.
 */
export function getAllCurrencyConfigs(): CurrencyConfig[] {
  return CURRENCY_ORDER.map((id) => CURRENCY_CONFIGS[id])
}

/**
 * Check if a currency ID is valid.
 */
export function isValidCurrencyId(value: string): value is CurrencyId {
  return Object.values(CurrencyId).includes(value as CurrencyId)
}

/**
 * Create default income configuration for a currency.
 */
export function createDefaultIncome(currencyId: CurrencyId): CurrencyIncome {
  return {
    currencyId,
    currentBalance: 0,
    weeklyIncome: 0,
    growthRatePercent: currencyId === CurrencyId.Coins ? 5 : 0,
  }
}

/**
 * Create default stone income breakdown.
 */
export function createDefaultStoneBreakdown(): StoneIncomeBreakdown {
  return {
    weeklyChallenges: 0,
    eventStore: 0,
    tournamentResults: 0,
    purchasedWithMoney: 0,
  }
}

/**
 * Calculate total stone income from breakdown.
 */
export function calculateStoneIncome(breakdown: StoneIncomeBreakdown): number {
  return (
    breakdown.weeklyChallenges +
    breakdown.eventStore +
    breakdown.tournamentResults +
    breakdown.purchasedWithMoney
  )
}

/**
 * Create default gem income breakdown.
 */
export function createDefaultGemBreakdown(): GemIncomeBreakdown {
  return {
    adGems: 0,
    floatingGems: 0,
    storeDailyGems: 0,
    storeWeeklyGems: 0,
    missionsDailyCompletion: 0,
    missionsWeeklyChests: 0,
    tournaments: 0,
    biweeklyEventShop: 0,
    guildWeeklyChests: 0,
    guildSeasonalStore: 0,
    offerWalls: 0,
    purchasedWithMoney: 0,
  }
}

/**
 * Calculate total gem income from breakdown.
 */
export function calculateGemIncome(breakdown: GemIncomeBreakdown): number {
  return (
    breakdown.adGems +
    breakdown.floatingGems +
    breakdown.storeDailyGems +
    breakdown.storeWeeklyGems +
    breakdown.missionsDailyCompletion +
    breakdown.missionsWeeklyChests +
    breakdown.tournaments +
    breakdown.biweeklyEventShop +
    breakdown.guildWeeklyChests +
    breakdown.guildSeasonalStore +
    breakdown.offerWalls +
    breakdown.purchasedWithMoney
  )
}

// =============================================================================
// Currency Visual Styles
// =============================================================================

/**
 * Visual styling classes for currency display in various contexts.
 * Centralized here to ensure consistency when colors change or currencies are added.
 */
interface CurrencyVisualStyles {
  /** Subtle left border for card/section styling */
  borderLeft: string
  /** Subtle background gradient from currency color */
  bgGradient: string
  /** Left border accent for timeline pills */
  timelineBorderLeft: string
}

/**
 * Visual style mappings for all currencies.
 * Derived from base color in CURRENCY_CONFIGS for consistency.
 */
export const CURRENCY_VISUAL_STYLES: Record<CurrencyId, CurrencyVisualStyles> = {
  [CurrencyId.Coins]: {
    borderLeft: 'border-l-yellow-400/40',
    bgGradient: 'bg-gradient-to-r from-yellow-500/10 to-transparent',
    timelineBorderLeft: 'border-l-2 border-l-yellow-400/50',
  },
  [CurrencyId.Stones]: {
    borderLeft: 'border-l-emerald-400/40',
    bgGradient: 'bg-gradient-to-r from-emerald-500/10 to-transparent',
    timelineBorderLeft: 'border-l-2 border-l-emerald-400/50',
  },
  [CurrencyId.RerollShards]: {
    borderLeft: 'border-l-blue-400/40',
    bgGradient: 'bg-gradient-to-r from-blue-500/10 to-transparent',
    timelineBorderLeft: 'border-l-2 border-l-blue-400/50',
  },
  [CurrencyId.Gems]: {
    borderLeft: 'border-l-purple-400/40',
    bgGradient: 'bg-gradient-to-r from-purple-500/10 to-transparent',
    timelineBorderLeft: 'border-l-2 border-l-purple-400/50',
  },
}

/**
 * Get visual styles for a specific currency.
 */
export function getCurrencyVisualStyles(currencyId: CurrencyId): CurrencyVisualStyles {
  return CURRENCY_VISUAL_STYLES[currencyId]
}

// =============================================================================
// Currency Enable/Disable Logic
// =============================================================================

/**
 * Toggle a currency's enabled state.
 * Prevents disabling all currencies - at least one must remain enabled.
 *
 * @param enabledCurrencies - Current list of enabled currency IDs
 * @param currencyId - Currency to toggle
 * @returns Updated list of enabled currencies, or original if toggle would leave none enabled
 */
export function toggleCurrencyEnabled(
  enabledCurrencies: CurrencyId[],
  currencyId: CurrencyId
): CurrencyId[] {
  const isCurrentlyEnabled = enabledCurrencies.includes(currencyId)

  if (isCurrentlyEnabled) {
    // Prevent disabling if this is the last enabled currency
    if (enabledCurrencies.length <= 1) {
      return enabledCurrencies
    }
    return enabledCurrencies.filter((id) => id !== currencyId)
  } else {
    // Enable the currency, maintaining CURRENCY_ORDER
    return CURRENCY_ORDER.filter(
      (id) => id === currencyId || enabledCurrencies.includes(id)
    )
  }
}

/**
 * Check if a currency is enabled.
 */
export function isCurrencyEnabled(
  enabledCurrencies: CurrencyId[],
  currencyId: CurrencyId
): boolean {
  return enabledCurrencies.includes(currencyId)
}

/**
 * Get enabled currencies in display order.
 */
export function getEnabledCurrenciesInOrder(enabledCurrencies: CurrencyId[]): CurrencyId[] {
  return CURRENCY_ORDER.filter((id) => enabledCurrencies.includes(id))
}
