/**
 * Currency Income Row Component
 *
 * Input fields for a single currency's income configuration.
 * Uses a consistent vertical layout within each currency section.
 * Supports derived income values from run data with toggle indicators.
 */

/* eslint-disable max-lines-per-function, complexity */
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { CurrencyId } from '../types'
import type { CurrencyIncome, StoneIncomeBreakdown, GemIncomeBreakdown } from '../types'
import { getCurrencyConfig } from '../currencies/currency-config'
import { StoneIncomeBreakdown as StoneBreakdownComponent } from './stone-income-breakdown'
import { GemIncomeBreakdown as GemBreakdownComponent } from './gem-income-breakdown'
import { CurrencyInputField } from './currency-input-field'
import { getBestScaleForValue } from './scale-detection'
import { IncomeSourceIndicator } from './income-source-indicator'
import type { DerivedIncomeResult, DerivedGrowthRateResult } from './derived-income-calculation'

interface CurrencyIncomeRowProps {
  income: CurrencyIncome
  stoneBreakdown?: StoneIncomeBreakdown
  gemBreakdown?: GemIncomeBreakdown
  derivedIncomeResult?: DerivedIncomeResult | null
  derivedGrowthResult?: DerivedGrowthRateResult | null
  onBalanceChange: (value: number) => void
  onWeeklyIncomeChange: (value: number) => void
  onGrowthRateChange: (value: number) => void
  onToggleIncomeSource?: () => void
  onToggleGrowthSource?: () => void
  onStoneBreakdownChange?: (field: keyof StoneIncomeBreakdown, value: number) => void
  onGemBreakdownChange?: (field: keyof GemIncomeBreakdown, value: number) => void
}

export function CurrencyIncomeRow({
  income,
  stoneBreakdown,
  gemBreakdown,
  derivedIncomeResult,
  derivedGrowthResult,
  onBalanceChange,
  onWeeklyIncomeChange,
  onGrowthRateChange,
  onToggleIncomeSource,
  onToggleGrowthSource,
  onStoneBreakdownChange,
  onGemBreakdownChange,
}: CurrencyIncomeRowProps) {
  const config = getCurrencyConfig(income.currencyId)
  const isStones = income.currencyId === CurrencyId.Stones
  const isGems = income.currencyId === CurrencyId.Gems
  const hasBreakdown = isStones || isGems

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

  const isIncomeDerived = income.weeklyIncomeSource === 'derived'
  const isGrowthDerived = income.growthRateSource === 'derived'

  return (
    <div className="space-y-3">
      {/* Main income fields in a consistent grid */}
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 items-center">
        {/* Balance row */}
        <span className="text-xs text-slate-400">Balance</span>
        <CurrencyInputField
          value={income.currentBalance}
          scale={balanceScale}
          hasUnitSelector={config.hasUnitSelector}
          onChange={onBalanceChange}
          onScaleChange={setBalanceScale}
        />

        {/* Weekly Income row - for currencies without breakdown */}
        {!hasBreakdown && (
          <>
            <span className="text-xs text-slate-400">Weekly</span>
            <div className="flex items-center gap-1">
              <CurrencyInputField
                value={income.weeklyIncome}
                scale={incomeScale}
                hasUnitSelector={config.hasUnitSelector}
                onChange={onWeeklyIncomeChange}
                onScaleChange={setIncomeScale}
                disabled={isIncomeDerived}
              />
              {config.isDerivable && onToggleIncomeSource && (
                <IncomeSourceIndicator
                  source={income.weeklyIncomeSource}
                  derivedResult={derivedIncomeResult ?? null}
                  onToggle={onToggleIncomeSource}
                  isDerivable={config.isDerivable}
                  label="income"
                />
              )}
            </div>
          </>
        )}

        {/* Growth rate row */}
        <span className="text-xs text-slate-400">Growth</span>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={income.growthRatePercent || ''}
              onChange={handleGrowthChange}
              className="w-20 h-8 text-right text-sm bg-slate-800/50"
              placeholder="0"
              min={-100}
              max={1000}
              disabled={isGrowthDerived}
            />
            <span className="text-xs text-slate-500">% / week</span>
          </div>
          {config.isDerivable && onToggleGrowthSource && (
            <IncomeSourceIndicator
              source={income.growthRateSource}
              derivedResult={derivedGrowthResult ?? null}
              onToggle={onToggleGrowthSource}
              isDerivable={config.isDerivable}
              label="growth"
            />
          )}
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

      {/* Gem breakdown - shown only for gems, visually connected to Weekly */}
      {isGems && gemBreakdown && onGemBreakdownChange && (
        <GemBreakdownComponent
          breakdown={gemBreakdown}
          weeklyTotal={income.weeklyIncome}
          onUpdate={onGemBreakdownChange}
        />
      )}
    </div>
  )
}
