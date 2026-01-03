/**
 * Timeline Row Labels Component
 *
 * Left column showing row labels for income, balance, and events.
 */

import { cn } from '@/shared/lib/utils'
import { CURRENCY_ORDER, getCurrencyConfig } from '../currencies/currency-config'

interface TimelineRowLabelsProps {
  width: number
}

export function TimelineRowLabels({ width }: TimelineRowLabelsProps) {
  return (
    <div
      className="flex flex-col shrink-0 border-r border-slate-700/50"
      style={{ width }}
    >
      {/* Empty header cell */}
      <div className="py-1.5 border-b border-slate-700/50 text-xs text-slate-400 px-2 font-medium">
        Week
      </div>

      {/* Income labels */}
      <div className="px-2 py-1.5 border-b border-slate-700/30 space-y-0.5">
        <div className="text-xs text-slate-400 font-medium">Income</div>
        {CURRENCY_ORDER.map((currencyId) => {
          const currencyConfig = getCurrencyConfig(currencyId)
          return (
            <div key={currencyId} className={cn('text-xs pl-2', currencyConfig.color)}>
              {currencyConfig.displayName}
            </div>
          )
        })}
      </div>

      {/* Balance labels */}
      <div className="px-2 py-1.5 space-y-0.5">
        <div className="text-xs text-slate-400 font-medium">Balance</div>
        {CURRENCY_ORDER.map((currencyId) => {
          const currencyConfig = getCurrencyConfig(currencyId)
          return (
            <div key={currencyId} className={cn('text-xs pl-2', currencyConfig.color)}>
              {currencyConfig.displayName}
            </div>
          )
        })}
      </div>
    </div>
  )
}
