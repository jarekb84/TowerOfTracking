/**
 * Derived Income Hook
 *
 * Provides derived income and growth rate calculations from run data.
 * Memoizes calculations based on runs and lookback period.
 */

import { useMemo } from 'react'
import { useData } from '@/shared/domain/use-data'
import { CurrencyId, type LookbackPeriod } from '../types'
import { CURRENCY_CONFIGS } from '../currencies/currency-config'
import {
  calculateDerivedValues,
  type DerivedIncomeResult,
  type DerivedGrowthRateResult,
} from './derived-income-calculation'

// =============================================================================
// Types
// =============================================================================

/**
 * Result of derived income hook.
 */
interface UseDerivedIncomeResult {
  /** Derived income results per currency (null for non-derivable currencies) */
  incomeResults: Partial<Record<CurrencyId, DerivedIncomeResult | null>>
  /** Derived growth rate results per currency (null for non-derivable currencies) */
  growthRateResults: Partial<Record<CurrencyId, DerivedGrowthRateResult | null>>
  /** True if any derivable currency has data */
  hasAnyData: boolean
  /** Total number of runs available */
  totalRuns: number
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for calculating derived income values from run data.
 *
 * @param lookbackPeriod - The lookback period for growth rate calculation
 * @returns Derived income and growth rate results for each derivable currency
 */
export function useDerivedIncome(lookbackPeriod: LookbackPeriod): UseDerivedIncomeResult {
  const { runs } = useData()

  return useMemo(() => {
    const incomeResults: Partial<Record<CurrencyId, DerivedIncomeResult | null>> = {}
    const growthRateResults: Partial<Record<CurrencyId, DerivedGrowthRateResult | null>> = {}
    let hasAnyData = false

    // Calculate derived values for each derivable currency
    for (const [currencyId, config] of Object.entries(CURRENCY_CONFIGS)) {
      const id = currencyId as CurrencyId

      if (!config.isDerivable) {
        incomeResults[id] = null
        growthRateResults[id] = null
        continue
      }

      const { income, growthRate } = calculateDerivedValues(runs, id, lookbackPeriod)

      incomeResults[id] = income
      growthRateResults[id] = growthRate

      if (income && income.runsAnalyzed > 0) {
        hasAnyData = true
      }
    }

    return {
      incomeResults,
      growthRateResults,
      hasAnyData,
      totalRuns: runs.length,
    }
  }, [runs, lookbackPeriod])
}