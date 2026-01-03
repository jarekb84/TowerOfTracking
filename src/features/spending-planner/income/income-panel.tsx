/**
 * Income Panel Component
 *
 * Collapsible card for configuring income across all currencies.
 * Uses card-based sections for clear visual grouping of each currency.
 * Supports derived income values from run data.
 */

import { CollapsibleCard } from '@/components/ui/collapsible-card'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { CurrencyIncomeRow } from './currency-income-row'
import { CurrencyId } from '../types'
import type { CurrencyIncome, StoneIncomeBreakdown, GemIncomeBreakdown, LookbackPeriod } from '../types'
import { CURRENCY_ORDER, getCurrencyConfig, getCurrencyVisualStyles } from '../currencies/currency-config'
import { LookbackPeriodSelector } from './lookback-period-selector'
import type { DerivedIncomeResult, DerivedGrowthRateResult } from './derived-income-calculation'

interface IncomePanelProps {
  incomes: CurrencyIncome[]
  stoneBreakdown: StoneIncomeBreakdown
  gemBreakdown: GemIncomeBreakdown
  enabledCurrencies: CurrencyId[]
  isCollapsed: boolean
  lookbackPeriod: LookbackPeriod
  derivedIncomeResults: Partial<Record<CurrencyId, DerivedIncomeResult | null>>
  derivedGrowthResults: Partial<Record<CurrencyId, DerivedGrowthRateResult | null>>
  hasAnyDerivedData: boolean
  onToggleCollapse: () => void
  onToggleCurrency: (currencyId: CurrencyId) => void
  onBalanceChange: (currencyId: CurrencyId, value: number) => void
  onWeeklyIncomeChange: (currencyId: CurrencyId, value: number) => void
  onGrowthRateChange: (currencyId: CurrencyId, value: number) => void
  onToggleIncomeSource: (currencyId: CurrencyId) => void
  onToggleGrowthSource: (currencyId: CurrencyId) => void
  onLookbackPeriodChange: (period: LookbackPeriod) => void
  onStoneBreakdownChange: (field: keyof StoneIncomeBreakdown, value: number) => void
  onGemBreakdownChange: (field: keyof GemIncomeBreakdown, value: number) => void
}

export function IncomePanel({
  incomes,
  stoneBreakdown,
  gemBreakdown,
  enabledCurrencies,
  isCollapsed,
  lookbackPeriod,
  derivedIncomeResults,
  derivedGrowthResults,
  hasAnyDerivedData,
  onToggleCollapse,
  onToggleCurrency,
  onBalanceChange,
  onWeeklyIncomeChange,
  onGrowthRateChange,
  onToggleIncomeSource,
  onToggleGrowthSource,
  onLookbackPeriodChange,
  onStoneBreakdownChange,
  onGemBreakdownChange,
}: IncomePanelProps) {
  // Sort incomes by currency order
  const sortedIncomes = CURRENCY_ORDER.map((id) =>
    incomes.find((i) => i.currencyId === id)
  ).filter((i): i is CurrencyIncome => i !== undefined)

  return (
    <CollapsibleCard
      title="Income Configuration"
      isExpanded={!isCollapsed}
      onToggle={onToggleCollapse}
      headerContent={
        hasAnyDerivedData ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Growth period:</span>
            <LookbackPeriodSelector
              value={lookbackPeriod}
              onChange={onLookbackPeriodChange}
            />
          </div>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sortedIncomes.map((income) => {
          const config = getCurrencyConfig(income.currencyId)
          const isStones = income.currencyId === CurrencyId.Stones
          const isGems = income.currencyId === CurrencyId.Gems
          const isEnabled = enabledCurrencies.includes(income.currencyId)
          const isLastEnabled = enabledCurrencies.length === 1 && isEnabled

          return (
            <CurrencySection
              key={income.currencyId}
              title={config.displayName}
              colorClass={config.color}
              currencyId={income.currencyId}
              isEnabled={isEnabled}
              isLastEnabled={isLastEnabled}
              onToggle={() => onToggleCurrency(income.currencyId)}
            >
              {isEnabled && (
                <CurrencyIncomeRow
                  income={income}
                  stoneBreakdown={isStones ? stoneBreakdown : undefined}
                  gemBreakdown={isGems ? gemBreakdown : undefined}
                  derivedIncomeResult={derivedIncomeResults[income.currencyId]}
                  derivedGrowthResult={derivedGrowthResults[income.currencyId]}
                  onBalanceChange={(value) => onBalanceChange(income.currencyId, value)}
                  onWeeklyIncomeChange={(value) => onWeeklyIncomeChange(income.currencyId, value)}
                  onGrowthRateChange={(value) => onGrowthRateChange(income.currencyId, value)}
                  onToggleIncomeSource={() => onToggleIncomeSource(income.currencyId)}
                  onToggleGrowthSource={() => onToggleGrowthSource(income.currencyId)}
                  onStoneBreakdownChange={isStones ? onStoneBreakdownChange : undefined}
                  onGemBreakdownChange={isGems ? onGemBreakdownChange : undefined}
                />
              )}
            </CurrencySection>
          )
        })}
      </div>
    </CollapsibleCard>
  )
}

/**
 * Visual grouping wrapper for each currency's configuration.
 */
interface CurrencySectionProps {
  title: string
  colorClass: string
  currencyId: CurrencyId
  isEnabled: boolean
  isLastEnabled: boolean
  onToggle: () => void
  children: React.ReactNode
}

function CurrencySection({
  title,
  colorClass,
  currencyId,
  isEnabled,
  isLastEnabled,
  onToggle,
  children,
}: CurrencySectionProps) {
  const visualStyles = getCurrencyVisualStyles(currencyId)

  return (
    <div
      className={`bg-slate-900/40 rounded-lg border border-slate-700/30 border-l-2 ${visualStyles.borderLeft} p-3 ${
        !isEnabled ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-semibold ${colorClass}`}>{title}</h3>
        <ToggleSwitch
          checked={isEnabled}
          onCheckedChange={onToggle}
          disabled={isLastEnabled}
          aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${title} tracking`}
        />
      </div>
      {children}
    </div>
  )
}
