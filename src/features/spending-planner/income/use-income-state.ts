/**
 * Income State Hook
 *
 * Manages income configuration state for all currencies.
 */

import { useCallback } from 'react'
import { CurrencyId } from '../types'
import type { CurrencyIncome, StoneIncomeBreakdown } from '../types'
import { calculateStoneIncome } from '../currencies/currency-config'
import { ensureNonNegative, clampGrowthRate } from './income-validation'

interface UseIncomeStateReturn {
  /** Update balance for a currency */
  updateBalance: (currencyId: CurrencyId, balance: number) => void
  /** Update weekly income for a currency */
  updateWeeklyIncome: (currencyId: CurrencyId, income: number) => void
  /** Update growth rate for a currency */
  updateGrowthRate: (currencyId: CurrencyId, rate: number) => void
  /** Update stone income breakdown field */
  updateStoneBreakdown: (field: keyof StoneIncomeBreakdown, value: number) => void
}

interface UseIncomeStateProps {
  incomes: CurrencyIncome[]
  stoneBreakdown: StoneIncomeBreakdown
  onIncomesChange: (incomes: CurrencyIncome[]) => void
  onStoneBreakdownChange: (breakdown: StoneIncomeBreakdown) => void
}

/**
 * Hook for managing income state with validation.
 */
export function useIncomeState({
  incomes,
  stoneBreakdown,
  onIncomesChange,
  onStoneBreakdownChange,
}: UseIncomeStateProps): UseIncomeStateReturn {
  const updateBalance = useCallback(
    (currencyId: CurrencyId, balance: number) => {
      const validBalance = ensureNonNegative(balance)
      const updated = incomes.map((income) =>
        income.currencyId === currencyId
          ? { ...income, currentBalance: validBalance }
          : income
      )
      onIncomesChange(updated)
    },
    [incomes, onIncomesChange]
  )

  const updateWeeklyIncome = useCallback(
    (currencyId: CurrencyId, income: number) => {
      const validIncome = ensureNonNegative(income)
      const updated = incomes.map((i) =>
        i.currencyId === currencyId ? { ...i, weeklyIncome: validIncome } : i
      )
      onIncomesChange(updated)
    },
    [incomes, onIncomesChange]
  )

  const updateGrowthRate = useCallback(
    (currencyId: CurrencyId, rate: number) => {
      const validRate = clampGrowthRate(rate)
      const updated = incomes.map((income) =>
        income.currencyId === currencyId
          ? { ...income, growthRatePercent: validRate }
          : income
      )
      onIncomesChange(updated)
    },
    [incomes, onIncomesChange]
  )

  const updateStoneBreakdown = useCallback(
    (field: keyof StoneIncomeBreakdown, value: number) => {
      const validValue = ensureNonNegative(value)
      const updatedBreakdown = {
        ...stoneBreakdown,
        [field]: validValue,
      }
      onStoneBreakdownChange(updatedBreakdown)

      // Also update the stones weeklyIncome based on breakdown
      const totalStoneIncome = calculateStoneIncome(updatedBreakdown)
      const updated = incomes.map((income) =>
        income.currencyId === CurrencyId.Stones
          ? { ...income, weeklyIncome: totalStoneIncome }
          : income
      )
      onIncomesChange(updated)
    },
    [incomes, stoneBreakdown, onIncomesChange, onStoneBreakdownChange]
  )

  return {
    updateBalance,
    updateWeeklyIncome,
    updateGrowthRate,
    updateStoneBreakdown,
  }
}
