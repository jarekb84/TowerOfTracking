/**
 * Currency Configuration
 *
 * Defines the supported currencies in the spending planner.
 * Designed to be extensible for future currency additions.
 */

import { CurrencyId } from '../types'
import type { CurrencyConfig, CurrencyIncome, StoneIncomeBreakdown } from '../types'

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
}

/**
 * Ordered list of currency IDs for consistent display.
 */
export const CURRENCY_ORDER: CurrencyId[] = [CurrencyId.Coins, CurrencyId.Stones]

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
  }
}

/**
 * Calculate total stone income from breakdown.
 */
export function calculateStoneIncome(breakdown: StoneIncomeBreakdown): number {
  return breakdown.weeklyChallenges + breakdown.eventStore + breakdown.tournamentResults
}
