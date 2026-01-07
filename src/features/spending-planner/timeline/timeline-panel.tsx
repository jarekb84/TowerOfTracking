/**
 * Timeline Panel Component
 *
 * Main Gantt-style visualization showing when events trigger.
 * Supports two layout modes: columns (Inc/Exp/Bal per week) and rows (metrics per currency).
 */

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import type { TimelineData, TimelineViewConfig, TimelineWeeks, TimelineLayoutMode, CurrencyId, SpendingEvent, CurrencyIncome } from '../types'
import { getEnabledCurrenciesInOrder } from '../currencies/currency-config'
import { generateWeekDates } from './timeline-utils'
import { TimelineEventsGrid } from './timeline-events-grid'
import { TimelineLayoutColumns } from './layouts/timeline-layout-columns'
import { TimelineLayoutRows } from './layouts/timeline-layout-rows'

interface TimelinePanelProps {
  timelineData: TimelineData
  enabledCurrencies: CurrencyId[]
  config: TimelineViewConfig
  weekOptions: TimelineWeeks[]
  startDate: Date
  /** Income configuration for accessing initial balances */
  incomes: CurrencyIncome[]
  onWeeksChange: (weeks: TimelineWeeks) => void
  onLayoutModeChange: (mode: TimelineLayoutMode) => void
}

const LAYOUT_DIMENSIONS = {
  columns: { labelWidth: 80, columnWidth: 150, startingColumnWidth: 60 },
  rows: { labelWidth: 110, columnWidth: 90, startingColumnWidth: 0 },
} as const

export function TimelinePanel(props: TimelinePanelProps) {
  const {
    timelineData,
    enabledCurrencies,
    config,
    weekOptions,
    startDate,
    incomes,
    onWeeksChange,
    onLayoutModeChange,
  } = props

  const weekDates = useMemo(() => generateWeekDates(startDate, config.weeks), [startDate, config.weeks])
  const orderedCurrencies = useMemo(() => getEnabledCurrenciesInOrder(enabledCurrencies), [enabledCurrencies])
  const { labelWidth, columnWidth, startingColumnWidth } = LAYOUT_DIMENSIONS[config.layoutMode]

  // Build a map of initial balances for the "Starting" column
  const initialBalances = useMemo(() => {
    const map = new Map<CurrencyId, number>()
    for (const income of incomes) {
      map.set(income.currencyId, income.currentBalance)
    }
    return map
  }, [incomes])

  return (
    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50">
      <TimelineHeader
        config={config}
        weekOptions={weekOptions}
        onWeeksChange={onWeeksChange}
        onLayoutModeChange={onLayoutModeChange}
      />
      <div className="overflow-x-auto">
        {config.layoutMode === 'columns' ? (
          <TimelineLayoutColumns
            timelineData={timelineData}
            enabledCurrencies={orderedCurrencies}
            weekDates={weekDates}
            initialBalances={initialBalances}
          />
        ) : (
          <TimelineLayoutRows
            timelineData={timelineData}
            enabledCurrencies={orderedCurrencies}
            weekDates={weekDates}
          />
        )}
        <TimelineEventsGrid events={timelineData.events} weeks={config.weeks} labelWidth={labelWidth} columnWidth={columnWidth} startingColumnWidth={startingColumnWidth} />
      </div>
      <UnaffordableEventsAlert events={timelineData.unaffordableEvents} weeks={config.weeks} />
    </div>
  )
}

interface TimelineHeaderProps {
  config: TimelineViewConfig
  weekOptions: TimelineWeeks[]
  onWeeksChange: (weeks: TimelineWeeks) => void
  onLayoutModeChange: (mode: TimelineLayoutMode) => void
}

function TimelineHeader({ config, weekOptions, onWeeksChange, onLayoutModeChange }: TimelineHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
      <h2 className="text-sm font-semibold text-slate-200">Timeline</h2>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Metrics as:</span>
          <div className="flex gap-1">
            <Button size="compact" variant="outline" selected={config.layoutMode === 'columns'} onClick={() => onLayoutModeChange('columns')} className="px-2 py-1 text-xs">Columns</Button>
            <Button size="compact" variant="outline" selected={config.layoutMode === 'rows'} onClick={() => onLayoutModeChange('rows')} className="px-2 py-1 text-xs">Rows</Button>
          </div>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex gap-1">
          {weekOptions.map((weeks) => (
            <Button key={weeks} size="compact" variant="outline" selected={config.weeks === weeks} onClick={() => onWeeksChange(weeks)} className="px-2 py-1 text-xs">{weeks}w</Button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface UnaffordableEventsAlertProps {
  events: SpendingEvent[]
  weeks: number
}

function UnaffordableEventsAlert({ events, weeks }: UnaffordableEventsAlertProps) {
  if (events.length === 0) return null

  return (
    <div className="px-4 py-3 border-t border-slate-700/50 bg-red-500/10">
      <div className="text-xs text-red-400">
        <span className="font-medium">{events.length} event(s) cannot be afforded</span>
        <span className="text-red-400/70 ml-2">within the {weeks}-week timeline:</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {events.map((event) => (
          <span key={event.id} className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300">{event.name}</span>
        ))}
      </div>
    </div>
  )
}
