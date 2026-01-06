/**
 * Timeline Layout Rows Component
 *
 * Layout B: Currencies as headers with sub-rows (Prior Balance, +Income, -Spending, =Balance).
 * Design: Zero income = blank, No spending = '-'
 */

import { useMemo } from 'react'
import { cn } from '@/shared/lib/utils'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import { formatDisplayMonthDay } from '@/shared/formatting/date-formatters'
import type { TimelineData, CurrencyId, CurrencyConfig } from '../../types'
import { getCurrencyConfig } from '../../currencies/currency-config'
import type { WeekCurrencyData } from './timeline-layout-utils'
import { calculateWeekBalance, formatMetricDisplay } from './timeline-layout-utils'

type MetricType = 'prior' | 'income' | 'expenditure' | 'balance'

interface CellDisplay {
  displayValue: string
  colorClass: string
}

/**
 * Calculate display value and color for a metric cell.
 * Extracted to reduce component complexity.
 */
function getCellDisplay(
  type: MetricType,
  data: WeekCurrencyData,
  config: CurrencyConfig
): CellDisplay {
  switch (type) {
    case 'prior': {
      return {
        displayValue: formatLargeNumber(data.priorBalance),
        colorClass: data.priorBalance < 0 ? 'text-red-400' : config.color,
      }
    }
    case 'income': {
      const incomeDisplay = formatMetricDisplay(data.income, 'income')
      return {
        displayValue: incomeDisplay.hasValue
          ? `+${formatLargeNumber(data.income)}`
          : incomeDisplay.displayValue,
        colorClass: config.color,
      }
    }
    case 'expenditure': {
      const expenditureDisplay = formatMetricDisplay(data.expenditure, 'expenditure')
      return {
        displayValue: expenditureDisplay.hasValue
          ? `-${formatLargeNumber(data.expenditure)}`
          : expenditureDisplay.displayValue,
        colorClass: data.expenditure > 0 ? 'text-red-400' : 'text-slate-500',
      }
    }
    case 'balance': {
      return {
        displayValue: formatLargeNumber(data.balance),
        colorClass: data.balance < 0 ? 'text-red-400' : config.color,
      }
    }
  }
}

interface TimelineLayoutRowsProps {
  timelineData: TimelineData
  enabledCurrencies: CurrencyId[]
  weekDates: Date[]
  /** Proration factor for current week's income (0 < factor <= 1) */
  currentWeekProrationFactor: number
}

const LABEL_WIDTH = 110
const COLUMN_WIDTH = 90

export function TimelineLayoutRows({
  timelineData,
  enabledCurrencies,
  weekDates,
  currentWeekProrationFactor,
}: TimelineLayoutRowsProps) {
  return (
    <div className="flex flex-col">
      {/* Header row with week dates */}
      <div className="flex border-b border-slate-700/50">
        <div
          className="shrink-0 py-1.5 px-2 text-xs text-slate-400 font-medium border-r border-slate-700/50"
          style={{ width: LABEL_WIDTH }}
        >
          Week
        </div>
        {weekDates.map((date, weekIndex) => (
          <div
            key={weekIndex}
            className={cn(
              'shrink-0 text-center py-1.5 text-xs font-medium border-r border-slate-700/30',
              weekIndex === 0 ? 'text-orange-400 bg-orange-500/5' : 'text-slate-400'
            )}
            style={{ width: COLUMN_WIDTH }}
          >
            {formatDisplayMonthDay(date)}
          </div>
        ))}
      </div>

      {/* Currency sections */}
      {enabledCurrencies.map((currencyId, currencyIndex) => (
        <CurrencySection
          key={currencyId}
          currencyId={currencyId}
          timelineData={timelineData}
          weekDates={weekDates}
          currentWeekProrationFactor={currentWeekProrationFactor}
          isLast={currencyIndex === enabledCurrencies.length - 1}
        />
      ))}
    </div>
  )
}

interface CurrencySectionProps {
  currencyId: CurrencyId
  timelineData: TimelineData
  weekDates: Date[]
  /** Proration factor for current week's income */
  currentWeekProrationFactor: number
  isLast: boolean
}

function CurrencySection({
  currencyId,
  timelineData,
  weekDates,
  currentWeekProrationFactor,
  isLast,
}: CurrencySectionProps) {
  const config = getCurrencyConfig(currencyId)
  const displayName = config.timelineName ?? config.displayName

  const rows: { label: string; type: MetricType }[] = [
    { label: 'Prior Balance', type: 'prior' },
    { label: '+ Income', type: 'income' },
    { label: '- Spending', type: 'expenditure' },
    { label: '= Balance', type: 'balance' },
  ]

  return (
    <div className={cn('border-b', isLast ? 'border-slate-700/50' : 'border-slate-700/30')}>
      {/* Currency header */}
      <div className="flex bg-slate-800/40">
        <div
          className={cn(
            'shrink-0 py-1 px-2 text-xs font-medium border-r border-slate-700/50',
            config.color
          )}
          style={{ width: LABEL_WIDTH }}
        >
          {displayName}
        </div>
        {weekDates.map((_, weekIndex) => (
          <div
            key={weekIndex}
            className={cn(
              'shrink-0 border-r border-slate-700/30',
              weekIndex === 0 && 'bg-orange-500/5'
            )}
            style={{ width: COLUMN_WIDTH }}
          />
        ))}
      </div>

      {/* Sub-rows */}
      {rows.map((row, rowIndex) => (
        <div key={row.type} className="flex">
          <div
            className={cn(
              'shrink-0 py-0.5 px-2 pl-4 text-[11px] text-slate-500 border-r border-slate-700/50',
              rowIndex === rows.length - 1 && 'font-medium'
            )}
            style={{ width: LABEL_WIDTH }}
          >
            {row.label}
          </div>
          {weekDates.map((_, weekIndex) => (
            <CurrencyCell
              key={weekIndex}
              currencyId={currencyId}
              weekIndex={weekIndex}
              type={row.type}
              timelineData={timelineData}
              isBalanceRow={row.type === 'balance'}
              currentWeekProrationFactor={currentWeekProrationFactor}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface CurrencyCellProps {
  currencyId: CurrencyId
  weekIndex: number
  type: MetricType
  timelineData: TimelineData
  isBalanceRow: boolean
  /** Proration factor for current week's income (0 < factor <= 1) */
  currentWeekProrationFactor: number
}

function CurrencyCell({
  currencyId,
  weekIndex,
  type,
  timelineData,
  isBalanceRow,
  currentWeekProrationFactor,
}: CurrencyCellProps) {
  const config = getCurrencyConfig(currencyId)

  const data = useMemo(() => {
    const incomes = timelineData.incomeByWeek.get(currencyId) ?? []
    const expenditures = timelineData.expenditureByWeek.get(currencyId) ?? []
    const balances = timelineData.balancesByWeek.get(currencyId) ?? []

    // Use balances[weekIndex + 1] as the raw ending balance for this week
    // (mid-week spending model: spending deducted from ending balance, not starting)
    const rawEndingBalance = balances[weekIndex + 1] ?? 0
    const income = incomes[weekIndex] ?? 0
    const expenditure = expenditures[weekIndex] ?? 0
    const week0FullIncome = incomes[0] ?? 0

    // Use single source of truth for balance calculation
    return calculateWeekBalance({
      rawEndingBalance,
      income,
      expenditure,
      weekIndex,
      currentWeekProrationFactor,
      week0FullIncome,
    })
  }, [currencyId, weekIndex, timelineData, currentWeekProrationFactor])

  const { displayValue, colorClass } = getCellDisplay(type, data, config)

  return (
    <div
      className={cn(
        'shrink-0 py-0.5 px-1 text-[11px] text-right border-r border-slate-700/30',
        colorClass,
        isBalanceRow && 'font-medium',
        weekIndex === 0 && 'bg-orange-500/5'
      )}
      style={{ width: COLUMN_WIDTH }}
    >
      {displayValue}
    </div>
  )
}
