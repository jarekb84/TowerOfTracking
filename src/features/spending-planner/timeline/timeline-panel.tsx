/**
 * Timeline Panel Component
 *
 * Main Gantt-style visualization showing when events trigger.
 */

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import type { TimelineData, TimelineViewConfig, TimelineWeeks, CurrencyId } from '../types'
import { CURRENCY_ORDER } from '../currencies/currency-config'
import { generateWeekDates } from './timeline-utils'
import { TimelineWeekColumn } from './timeline-week-column'
import { TimelineRowLabels } from './timeline-row-labels'
import { TimelineEventsGrid } from './timeline-events-grid'

interface TimelinePanelProps {
  timelineData: TimelineData
  config: TimelineViewConfig
  weekOptions: TimelineWeeks[]
  startDate: Date
  onWeeksChange: (weeks: TimelineWeeks) => void
}

const LABEL_WIDTH = 80
const COLUMN_WIDTH = 110

function getDataForWeek(
  weekIndex: number,
  currencyOrder: readonly CurrencyId[],
  dataByWeek: Map<CurrencyId, number[]>
): Map<CurrencyId, number> {
  const result = new Map<CurrencyId, number>()
  for (const currencyId of currencyOrder) {
    const data = dataByWeek.get(currencyId)
    result.set(currencyId, data?.[weekIndex] ?? 0)
  }
  return result
}

export function TimelinePanel({
  timelineData,
  config,
  weekOptions,
  startDate,
  onWeeksChange,
}: TimelinePanelProps) {
  const weekDates = useMemo(
    () => generateWeekDates(startDate, config.weeks),
    [startDate, config.weeks]
  )

  return (
    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-200">Timeline</h2>
        <div className="flex gap-1">
          {weekOptions.map((weeks) => (
            <Button
              key={weeks}
              size="compact"
              variant="outline"
              selected={config.weeks === weeks}
              onClick={() => onWeeksChange(weeks)}
              className="px-2 py-1 text-xs"
            >
              {weeks}w
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* Income/Balance grid */}
        <div className="flex">
          <TimelineRowLabels width={LABEL_WIDTH} />
          {weekDates.map((date, index) => (
            <TimelineWeekColumn
              key={index}
              date={date}
              incomes={getDataForWeek(index, CURRENCY_ORDER, timelineData.incomeByWeek)}
              balances={getDataForWeek(index, CURRENCY_ORDER, timelineData.balancesByWeek)}
              isCurrentWeek={index === 0}
              width={COLUMN_WIDTH}
            />
          ))}
        </div>

        {/* Events grid with spanning support */}
        <TimelineEventsGrid
          events={timelineData.events}
          weeks={config.weeks}
          labelWidth={LABEL_WIDTH}
          columnWidth={COLUMN_WIDTH}
        />
      </div>

      {timelineData.unaffordableEvents.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-700/50 bg-red-500/10">
          <div className="text-xs text-red-400">
            <span className="font-medium">
              {timelineData.unaffordableEvents.length} event(s) cannot be afforded
            </span>
            <span className="text-red-400/70 ml-2">within the {config.weeks}-week timeline:</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {timelineData.unaffordableEvents.map((event) => (
              <span key={event.id} className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                {event.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
