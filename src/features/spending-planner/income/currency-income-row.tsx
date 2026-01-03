/**
 * Currency Income Row Component
 *
 * Input fields for a single currency's income configuration.
 * Uses a consistent vertical layout within each currency section.
 */

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { CurrencyId } from '../types'
import type { CurrencyIncome, StoneIncomeBreakdown } from '../types'
import { getCurrencyConfig } from '../currencies/currency-config'
import { StoneIncomeBreakdown as StoneBreakdownComponent } from './stone-income-breakdown'
import { CurrencyInputField } from './currency-input-field'
import { getBestScaleForValue } from './scale-detection'

interface CurrencyIncomeRowProps {
  income: CurrencyIncome
  stoneBreakdown?: StoneIncomeBreakdown
  onBalanceChange: (value: number) => void
  onWeeklyIncomeChange: (value: number) => void
  onGrowthRateChange: (value: number) => void
  onStoneBreakdownChange?: (field: keyof StoneIncomeBreakdown, value: number) => void
}

export function CurrencyIncomeRow({
  income,
  stoneBreakdown,
  onBalanceChange,
  onWeeklyIncomeChange,
  onGrowthRateChange,
  onStoneBreakdownChange,
}: CurrencyIncomeRowProps) {
  const config = getCurrencyConfig(income.currencyId)
  const isStones = income.currencyId === CurrencyId.Stones

  const [balanceScale, setBalanceScale] = useState(() =>
    getBestScaleForValue(income.currentBalance)
  )
  const [incomeScale, setIncomeScale] = useState(() =>
    getBestScaleForValue(income.weeklyIncome)
  )

  // Sync scale when value changes externally (e.g., loading saved data)
  useEffect(() => {
    setBalanceScale(getBestScaleForValue(income.currentBalance))
  }, [income.currentBalance])

  useEffect(() => {
    setIncomeScale(getBestScaleForValue(income.weeklyIncome))
  }, [income.weeklyIncome])

  const handleGrowthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onGrowthRateChange(parseFloat(e.target.value) || 0)
  }

  return (
    <div className="space-y-4">
      {/* Main income fields in a consistent grid */}
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 items-center">
        {/* Balance row */}
        <span className="text-xs text-slate-400">Balance</span>
        <CurrencyInputField
          value={income.currentBalance}
          scale={balanceScale}
          hasUnitSelector={config.hasUnitSelector}
          onChange={onBalanceChange}
          onScaleChange={setBalanceScale}
        />

        {/* Weekly Income row - for non-stones currencies */}
        {!isStones && (
          <>
            <span className="text-xs text-slate-400">Weekly</span>
            <CurrencyInputField
              value={income.weeklyIncome}
              scale={incomeScale}
              hasUnitSelector={config.hasUnitSelector}
              onChange={onWeeklyIncomeChange}
              onScaleChange={setIncomeScale}
            />
          </>
        )}

        {/* Growth rate row */}
        <span className="text-xs text-slate-400">Growth</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={income.growthRatePercent || ''}
            onChange={handleGrowthChange}
            className="w-20 h-8 text-right text-sm bg-slate-800/50"
            placeholder="0"
            min={-100}
            max={1000}
          />
          <span className="text-xs text-slate-500">% / week</span>
        </div>
      </div>

      {/* Stone breakdown - shown only for stones, visually connected to Weekly */}
      {isStones && stoneBreakdown && onStoneBreakdownChange && (
        <StoneBreakdownComponent
          breakdown={stoneBreakdown}
          weeklyTotal={income.weeklyIncome}
          onUpdate={onStoneBreakdownChange}
        />
      )}
    </div>
  )
}
