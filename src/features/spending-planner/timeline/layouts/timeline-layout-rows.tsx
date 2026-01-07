/**
 * Timeline Layout Rows Component
 *
 * Layout B: Currencies as headers with sub-rows (Prior Balance, +Income, -Spending, =Balance).
 * Design: Zero income = blank, No spending = '-'
 *
 * This component is a PURE RENDERER - it displays pre-computed values from
 * TimelineData.weekDisplayData without any balance calculations.
 */

import { cn } from '@/shared/lib/utils'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import { formatDisplayMonthDay } from '@/shared/formatting/date-formatters'
import type { TimelineData, CurrencyId, CurrencyConfig, WeekDisplayData } from '../../types'
import { getCurrencyConfig } from '../../currencies/currency-config'
import { formatMetricDisplay } from './timeline-layout-utils'

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
  data: WeekDisplayData,
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
}

const LABEL_WIDTH = 110
const COLUMN_WIDTH = 90

export function TimelineLayoutRows({
  timelineData,
  enabledCurrencies,
  weekDates,
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
  isLast: boolean
}

function CurrencySection({
  currencyId,
  timelineData,
  weekDates,
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
}

/**
 * Get display data for a currency/week from pre-computed weekDisplayData.
 * Falls back to default values if data is missing.
 */
function getWeekDisplayData(
  timelineData: TimelineData,
  currencyId: CurrencyId,
  weekIndex: number
): WeekDisplayData {
  const currencyData = timelineData.weekDisplayData.get(currencyId)
  if (!currencyData || weekIndex >= currencyData.length) {
    return { priorBalance: 0, income: 0, expenditure: 0, balance: 0 }
  }
  return currencyData[weekIndex]
}

function CurrencyCell({
  currencyId,
  weekIndex,
  type,
  timelineData,
  isBalanceRow,
}: CurrencyCellProps) {
  const config = getCurrencyConfig(currencyId)

  // Use pre-computed display data directly - NO calculations in the display layer
  const data = getWeekDisplayData(timelineData, currencyId, weekIndex)

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
