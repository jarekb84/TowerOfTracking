/**
 * Income State Hook
 *
 * Manages income configuration state for all currencies.
 */

/* eslint-disable max-lines-per-function */
import { useCallback } from 'react'
import { CurrencyId } from '../types'
import type { CurrencyIncome, StoneIncomeBreakdown, GemIncomeBreakdown, IncomeSource } from '../types'
import { calculateStoneIncome, calculateGemIncome, CURRENCY_CONFIGS } from '../currencies/currency-config'
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
  /** Update gem income breakdown field */
  updateGemBreakdown: (field: keyof GemIncomeBreakdown, value: number) => void
  /** Toggle income source between derived and manual */
  toggleIncomeSource: (currencyId: CurrencyId) => void
  /** Toggle growth rate source between derived and manual */
  toggleGrowthRateSource: (currencyId: CurrencyId) => void
  /** Update derived values for a currency */
  updateDerivedValues: (currencyId: CurrencyId, income: number | null, growthRate: number | null) => void
}

interface UseIncomeStateProps {
  incomes: CurrencyIncome[]
  stoneBreakdown: StoneIncomeBreakdown
  gemBreakdown: GemIncomeBreakdown
  onIncomesChange: (incomes: CurrencyIncome[]) => void
  onStoneBreakdownChange: (breakdown: StoneIncomeBreakdown) => void
  onGemBreakdownChange: (breakdown: GemIncomeBreakdown) => void
}

/**
 * Hook for managing income state with validation.
 */
export function useIncomeState({
  incomes,
  stoneBreakdown,
  gemBreakdown,
  onIncomesChange,
  onStoneBreakdownChange,
  onGemBreakdownChange,
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

  const updateGemBreakdown = useCallback(
    (field: keyof GemIncomeBreakdown, value: number) => {
      const validValue = ensureNonNegative(value)
      const updatedBreakdown = {
        ...gemBreakdown,
        [field]: validValue,
      }
      onGemBreakdownChange(updatedBreakdown)

      // Also update the gems weeklyIncome based on breakdown
      const totalGemIncome = calculateGemIncome(updatedBreakdown)
      const updated = incomes.map((income) =>
        income.currencyId === CurrencyId.Gems
          ? { ...income, weeklyIncome: totalGemIncome }
          : income
      )
      onIncomesChange(updated)
    },
    [incomes, gemBreakdown, onIncomesChange, onGemBreakdownChange]
  )

  const toggleIncomeSource = useCallback(
    (currencyId: CurrencyId) => {
      // Only derivable currencies can toggle to derived
      const config = CURRENCY_CONFIGS[currencyId]
      if (!config.isDerivable) return

      const updated = incomes.map((income) => {
        if (income.currencyId !== currencyId) return income

        const newSource: IncomeSource =
          income.weeklyIncomeSource === 'derived' ? 'manual' : 'derived'

        // When switching to derived, use the derived value if available
        const newWeeklyIncome =
          newSource === 'derived' && income.derivedWeeklyIncome !== null
            ? income.derivedWeeklyIncome
            : income.weeklyIncome

        return {
          ...income,
          weeklyIncomeSource: newSource,
          weeklyIncome: newWeeklyIncome,
        }
      })
      onIncomesChange(updated)
    },
    [incomes, onIncomesChange]
  )

  const toggleGrowthRateSource = useCallback(
    (currencyId: CurrencyId) => {
      // Only derivable currencies can toggle to derived
      const config = CURRENCY_CONFIGS[currencyId]
      if (!config.isDerivable) return

      const updated = incomes.map((income) => {
        if (income.currencyId !== currencyId) return income

        const newSource: IncomeSource =
          income.growthRateSource === 'derived' ? 'manual' : 'derived'

        // When switching to derived, use the derived value if available
        const newGrowthRate =
          newSource === 'derived' && income.derivedGrowthRate !== null
            ? income.derivedGrowthRate
            : income.growthRatePercent

        return {
          ...income,
          growthRateSource: newSource,
          growthRatePercent: newGrowthRate,
        }
      })
      onIncomesChange(updated)
    },
    [incomes, onIncomesChange]
  )

  const updateDerivedValues = useCallback(
    (currencyId: CurrencyId, derivedIncome: number | null, derivedGrowthRate: number | null) => {
      const updated = incomes.map((income) => {
        if (income.currencyId !== currencyId) return income

        const newIncome = { ...income, derivedWeeklyIncome: derivedIncome, derivedGrowthRate }

        // If source is derived, also update the active values
        if (income.weeklyIncomeSource === 'derived' && derivedIncome !== null) {
          newIncome.weeklyIncome = derivedIncome
        }
        if (income.growthRateSource === 'derived' && derivedGrowthRate !== null) {
          newIncome.growthRatePercent = derivedGrowthRate
        }

        return newIncome
      })
      onIncomesChange(updated)
    },
    [incomes, onIncomesChange]
  )

  return {
    updateBalance,
    updateWeeklyIncome,
    updateGrowthRate,
    updateStoneBreakdown,
    updateGemBreakdown,
    toggleIncomeSource,
    toggleGrowthRateSource,
    updateDerivedValues,
  }
}
