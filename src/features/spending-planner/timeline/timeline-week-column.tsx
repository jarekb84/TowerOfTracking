/**
 * Timeline Week Column Component
 *
 * A single week column in the timeline showing:
 * - Week header with date
 * - Income for each currency
 * - Balance for each currency
 *
 * Events are rendered separately in a grid overlay.
 */

import { cn } from '@/shared/lib/utils'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import { formatDisplayMonthDay } from '@/shared/formatting/date-formatters'
import type { CurrencyId } from '../types'
import { getCurrencyConfig } from '../currencies/currency-config'

interface TimelineWeekColumnProps {
  date: Date
  incomes: Map<CurrencyId, number>
  balances: Map<CurrencyId, number>
  enabledCurrencies: CurrencyId[]
  isCurrentWeek: boolean
  width: number
}

export function TimelineWeekColumn({
  date,
  incomes,
  balances,
  enabledCurrencies,
  isCurrentWeek,
  width,
}: TimelineWeekColumnProps) {
  const dateLabel = formatDisplayMonthDay(date)

  return (
    <div
      className={cn(
        'flex flex-col shrink-0 border-r border-slate-700/30',
        isCurrentWeek && 'bg-orange-500/5'
      )}
      style={{ width }}
    >
      {/* Header */}
      <div
        className={cn(
          'text-center py-1.5 border-b border-slate-700/50 text-xs font-medium',
          isCurrentWeek ? 'text-orange-400' : 'text-slate-400'
        )}
      >
        {dateLabel}
      </div>

      {/* Income section */}
      <div className="px-2 py-1.5 border-b border-slate-700/30 space-y-0.5">
        {/* Empty row to align with "Income" label */}
        <div className="text-xs text-transparent select-none">&nbsp;</div>
        {enabledCurrencies.map((currencyId) => {
          const income = incomes.get(currencyId) ?? 0
          const config = getCurrencyConfig(currencyId)
          return (
            <div
              key={currencyId}
              className={cn('text-xs text-right', config.color)}
            >
              +{formatLargeNumber(income)}
            </div>
          )
        })}
      </div>

      {/* Balance section */}
      <div className="px-2 py-1.5 space-y-0.5">
        {/* Empty row to align with "Balance" label */}
        <div className="text-xs text-transparent select-none">&nbsp;</div>
        {enabledCurrencies.map((currencyId) => {
          const balance = balances.get(currencyId) ?? 0
          const config = getCurrencyConfig(currencyId)
          return (
            <div
              key={currencyId}
              className={cn(
                'text-xs text-right font-medium',
                balance < 0 ? 'text-red-400' : config.color
              )}
            >
              {formatLargeNumber(balance)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
