/**
 * Stone Income Breakdown Component
 *
 * Three-field breakdown for stone income sources that computes the weekly total.
 * Displays inputs for daily missions, event store, and tournament results
 * with a clear visual connection showing these sum to the Weekly income.
 */

import { Input } from '@/components/ui/input'
import type { StoneIncomeBreakdown as BreakdownType } from '../types'

interface StoneIncomeBreakdownProps {
  breakdown: BreakdownType
  weeklyTotal: number
  onUpdate: (field: keyof BreakdownType, value: number) => void
}

export function StoneIncomeBreakdown({
  breakdown,
  weeklyTotal,
  onUpdate,
}: StoneIncomeBreakdownProps) {
  const handleChange = (field: keyof BreakdownType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    onUpdate(field, value)
  }

  return (
    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/40">
      {/* Header with computed total */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">Weekly Income Sources</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Total:</span>
          <span className="text-sm font-medium text-emerald-300 tabular-nums">
            {weeklyTotal}
          </span>
          <span className="text-xs text-slate-500">/ week</span>
        </div>
      </div>

      {/* Income source inputs in a clean grid */}
      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 items-center">
        <span className="text-xs text-slate-400">Weekly challenges</span>
        <Input
          type="number"
          value={breakdown.weeklyChallenges || ''}
          onChange={handleChange('weeklyChallenges')}
          className="w-20 h-7 text-right text-sm bg-slate-900/50"
          placeholder="0"
          min={0}
        />

        <span className="text-xs text-slate-400">Event store</span>
        <Input
          type="number"
          value={breakdown.eventStore || ''}
          onChange={handleChange('eventStore')}
          className="w-20 h-7 text-right text-sm bg-slate-900/50"
          placeholder="0"
          min={0}
        />

        <span className="text-xs text-slate-400">Tournament results</span>
        <Input
          type="number"
          value={breakdown.tournamentResults || ''}
          onChange={handleChange('tournamentResults')}
          className="w-20 h-7 text-right text-sm bg-slate-900/50"
          placeholder="0"
          min={0}
        />
      </div>
    </div>
  )
}
