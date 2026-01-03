/**
 * Income Panel Component
 *
 * Collapsible card for configuring income across all currencies.
 * Uses card-based sections for clear visual grouping of each currency.
 */

import { CollapsibleCard } from '@/components/ui/collapsible-card'
import { CurrencyIncomeRow } from './currency-income-row'
import { CurrencyId } from '../types'
import type { CurrencyIncome, StoneIncomeBreakdown } from '../types'
import { CURRENCY_ORDER, getCurrencyConfig } from '../currencies/currency-config'

interface IncomePanelProps {
  incomes: CurrencyIncome[]
  stoneBreakdown: StoneIncomeBreakdown
  isCollapsed: boolean
  onToggleCollapse: () => void
  onBalanceChange: (currencyId: CurrencyId, value: number) => void
  onWeeklyIncomeChange: (currencyId: CurrencyId, value: number) => void
  onGrowthRateChange: (currencyId: CurrencyId, value: number) => void
  onStoneBreakdownChange: (field: keyof StoneIncomeBreakdown, value: number) => void
}

export function IncomePanel({
  incomes,
  stoneBreakdown,
  isCollapsed,
  onToggleCollapse,
  onBalanceChange,
  onWeeklyIncomeChange,
  onGrowthRateChange,
  onStoneBreakdownChange,
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
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedIncomes.map((income) => {
          const config = getCurrencyConfig(income.currencyId)
          const isStones = income.currencyId === CurrencyId.Stones

          return (
            <CurrencySection
              key={income.currencyId}
              title={config.displayName}
              colorClass={config.color}
            >
              <CurrencyIncomeRow
                income={income}
                stoneBreakdown={isStones ? stoneBreakdown : undefined}
                onBalanceChange={(value) => onBalanceChange(income.currencyId, value)}
                onWeeklyIncomeChange={(value) => onWeeklyIncomeChange(income.currencyId, value)}
                onGrowthRateChange={(value) => onGrowthRateChange(income.currencyId, value)}
                onStoneBreakdownChange={isStones ? onStoneBreakdownChange : undefined}
              />
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
  children: React.ReactNode
}

function CurrencySection({ title, colorClass, children }: CurrencySectionProps) {
  return (
    <div className="bg-slate-900/40 rounded-lg border border-slate-700/30 p-4">
      <h3 className={`text-sm font-semibold ${colorClass} mb-3`}>{title}</h3>
      {children}
    </div>
  )
}
