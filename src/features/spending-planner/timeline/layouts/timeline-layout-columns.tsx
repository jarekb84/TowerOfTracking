/**
 * Timeline Layout Columns Component
 *
 * Layout A: 3 sub-columns per week (Inc, Exp, Balance), currencies as rows.
 * Design: Zero income = blank, No spending = '-'
 */

import { useMemo } from 'react'
import { cn } from '@/shared/lib/utils'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import { formatDisplayMonthDay } from '@/shared/formatting/date-formatters'
import type { TimelineData, CurrencyId } from '../../types'
import { getCurrencyConfig } from '../../currencies/currency-config'
import { calculateWeekBalance, formatMetricDisplay } from './timeline-layout-utils'

interface TimelineLayoutColumnsProps {
  timelineData: TimelineData
  enabledCurrencies: CurrencyId[]
  weekDates: Date[]
  /** Initial balances for each currency (for "Starting" column) */
  initialBalances: Map<CurrencyId, number>
  /** Proration factor for current week's income (0 < factor <= 1) */
  currentWeekProrationFactor: number
}

const LABEL_WIDTH = 80
const SUB_COLUMN_WIDTH = 50
const STARTING_COLUMN_WIDTH = 60

export function TimelineLayoutColumns({
  timelineData,
  enabledCurrencies,
  weekDates,
  initialBalances,
  currentWeekProrationFactor,
}: TimelineLayoutColumnsProps) {
  return (
    <div className="flex">
      {/* Row labels column */}
      <RowLabels enabledCurrencies={enabledCurrencies} width={LABEL_WIDTH} />

      {/* Starting column (current balance) */}
      <StartingColumn enabledCurrencies={enabledCurrencies} initialBalances={initialBalances} />

      {/* Week columns */}
      {weekDates.map((date, weekIndex) => (
        <WeekColumn
          key={weekIndex}
          date={date}
          weekIndex={weekIndex}
          enabledCurrencies={enabledCurrencies}
          timelineData={timelineData}
          isCurrentWeek={weekIndex === 0}
          currentWeekProrationFactor={currentWeekProrationFactor}
        />
      ))}
    </div>
  )
}

interface RowLabelsProps {
  enabledCurrencies: CurrencyId[]
  width: number
}

function RowLabels({ enabledCurrencies, width }: RowLabelsProps) {
  return (
    <div
      className="flex flex-col shrink-0 border-r border-slate-700/50"
      style={{ width }}
    >
      {/* Empty header cell aligned with week header */}
      <div className="py-1.5 border-b border-slate-700/50 text-xs text-slate-400 px-2 font-medium">
        Week
      </div>

      {/* Sub-column headers (Inc | Exp | Bal) - empty in label column */}
      <div className="flex text-[10px] text-slate-500 border-b border-slate-700/30 py-0.5">
        <div className="flex-1 text-center">&nbsp;</div>
      </div>

      {/* Currency row labels */}
      <div className="px-2 py-1 space-y-0.5">
        {enabledCurrencies.map((currencyId) => {
          const config = getCurrencyConfig(currencyId)
          const displayName = config.timelineName ?? config.displayName
          return (
            <div key={currencyId} className={cn('text-xs', config.color)}>
              {displayName}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface StartingColumnProps {
  enabledCurrencies: CurrencyId[]
  initialBalances: Map<CurrencyId, number>
}

function StartingColumn({ enabledCurrencies, initialBalances }: StartingColumnProps) {
  return (
    <div
      className="flex flex-col shrink-0 border-r-2 border-slate-600/50 bg-slate-800/30"
      style={{ width: STARTING_COLUMN_WIDTH }}
    >
      {/* Header: "Starting" */}
      <div className="text-center py-1.5 border-b border-slate-700/50 text-xs font-medium text-slate-300">
        Starting
      </div>

      {/* Sub-header: "Bal" - matches week column sub-headers */}
      <div className="flex text-[10px] text-slate-500 border-b border-slate-700/30 py-0.5">
        <div className="flex-1 text-center">Bal</div>
      </div>

      {/* Currency balance rows - matches week column row styling */}
      <div className="py-1 space-y-0.5">
        {enabledCurrencies.map((currencyId) => {
          const config = getCurrencyConfig(currencyId)
          const balance = initialBalances.get(currencyId) ?? 0
          return (
            <div
              key={currencyId}
              className={cn('text-xs text-center font-medium', config.color)}
            >
              {formatLargeNumber(balance)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface WeekColumnProps {
  date: Date
  weekIndex: number
  enabledCurrencies: CurrencyId[]
  timelineData: TimelineData
  isCurrentWeek: boolean
  /** Proration factor for current week's income (0 < factor <= 1) */
  currentWeekProrationFactor: number
}

function WeekColumn({
  date,
  weekIndex,
  enabledCurrencies,
  timelineData,
  isCurrentWeek,
  currentWeekProrationFactor,
}: WeekColumnProps) {
  const dateLabel = formatDisplayMonthDay(date)

  const weekWidth = SUB_COLUMN_WIDTH * 3

  return (
    <div
      className={cn(
        'flex flex-col shrink-0 border-r border-slate-700/30',
        isCurrentWeek && 'bg-orange-500/5'
      )}
      style={{ width: weekWidth }}
    >
      {/* Week header */}
      <div
        className={cn(
          'text-center py-1.5 border-b border-slate-700/50 text-xs font-medium',
          isCurrentWeek ? 'text-orange-400' : 'text-slate-400'
        )}
      >
        {dateLabel}
      </div>

      {/* Sub-column headers */}
      <div className="flex text-[10px] text-slate-500 border-b border-slate-700/30 py-0.5">
        <div className="flex-1 text-center">Inc</div>
        <div className="flex-1 text-center">Exp</div>
        <div className="flex-1 text-center">Bal</div>
      </div>

      {/* Currency data rows */}
      <div className="py-1 space-y-0.5">
        {enabledCurrencies.map((currencyId) => (
          <CurrencyRow
            key={currencyId}
            currencyId={currencyId}
            weekIndex={weekIndex}
            timelineData={timelineData}
            currentWeekProrationFactor={currentWeekProrationFactor}
          />
        ))}
      </div>
    </div>
  )
}

interface CurrencyRowProps {
  currencyId: CurrencyId
  weekIndex: number
  timelineData: TimelineData
  /** Proration factor for current week's income (0 < factor <= 1) */
  currentWeekProrationFactor: number
}

function CurrencyRow({ currencyId, weekIndex, timelineData, currentWeekProrationFactor }: CurrencyRowProps) {
  const config = getCurrencyConfig(currencyId)

  const data = useMemo(() => {
    const incomes = timelineData.incomeByWeek.get(currencyId) ?? []
    const expenditures = timelineData.expenditureByWeek.get(currencyId) ?? []
    const balances = timelineData.balancesByWeek.get(currencyId) ?? []

    const rawBalance = balances[weekIndex] ?? 0
    const income = incomes[weekIndex] ?? 0
    const expenditure = expenditures[weekIndex] ?? 0
    const week0FullIncome = incomes[0] ?? 0

    // Use single source of truth for balance calculation
    return calculateWeekBalance({
      rawBalance,
      income,
      expenditure,
      weekIndex,
      currentWeekProrationFactor,
      week0FullIncome,
    })
  }, [currencyId, weekIndex, timelineData, currentWeekProrationFactor])

  const incomeDisplay = formatMetricDisplay(data.income, 'income')
  const expenditureDisplay = formatMetricDisplay(data.expenditure, 'expenditure')

  return (
    <div className="flex text-xs">
      {/* Income sub-column */}
      <div className={cn('flex-1 text-center', config.color)}>
        {incomeDisplay.hasValue ? `+${formatLargeNumber(data.income)}` : incomeDisplay.displayValue}
      </div>

      {/* Expenditure sub-column */}
      <div className={cn('flex-1 text-center', data.expenditure > 0 ? 'text-red-400' : 'text-slate-500')}>
        {expenditureDisplay.hasValue ? `-${formatLargeNumber(data.expenditure)}` : expenditureDisplay.displayValue}
      </div>

      {/* Balance sub-column */}
      <div
        className={cn(
          'flex-1 text-center font-medium',
          data.balance < 0 ? 'text-red-400' : config.color
        )}
      >
        {formatLargeNumber(data.balance)}
      </div>
    </div>
  )
}
