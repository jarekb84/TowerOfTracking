/**
 * Gem Income Breakdown Component
 *
 * Multi-field breakdown for gem income sources that computes the weekly total.
 * Displays inputs for various gem sources with a clear visual connection
 * showing these sum to the Weekly income.
 */

import { Input } from '@/components/ui/input'
import type { GemIncomeBreakdown as BreakdownType } from '../types'

interface GemIncomeBreakdownProps {
  breakdown: BreakdownType
  weeklyTotal: number
  onUpdate: (field: keyof BreakdownType, value: number) => void
}

/** Configuration for gem income source fields */
const GEM_SOURCE_FIELDS: Array<{ field: keyof BreakdownType; label: string }> = [
  { field: 'adGems', label: 'Ad gems' },
  { field: 'floatingGems', label: 'Floating Gems' },
  { field: 'storeDailyGems', label: 'Store Free Daily gems' },
  { field: 'storeWeeklyGems', label: 'Store Free Weekly gems (web)' },
  { field: 'missionsDailyCompletion', label: 'Missions Daily completion' },
  { field: 'missionsWeeklyChests', label: 'Missions Weekly Chests' },
  { field: 'tournaments', label: 'Tournaments' },
  { field: 'biweeklyEventShop', label: 'Biweekly Event Shop' },
  { field: 'guildWeeklyChests', label: 'Guild Weekly Chests' },
  { field: 'guildSeasonalStore', label: 'Guild Seasonal Store' },
  { field: 'offerWalls', label: 'Offerwall/TapJoy' },
  { field: 'purchasedWithMoney', label: 'Purchased (real money)' },
]

export function GemIncomeBreakdown({
  breakdown,
  weeklyTotal,
  onUpdate,
}: GemIncomeBreakdownProps) {
  const handleChange = (field: keyof BreakdownType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    onUpdate(field, value)
  }

  return (
    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/40">
      {/* Header with computed total */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-300">Weekly Income Sources</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Total:</span>
          <span className="text-sm font-medium text-purple-300 tabular-nums">
            {weeklyTotal}
          </span>
          <span className="text-xs text-slate-500">/ week</span>
        </div>
      </div>

      {/* Income source inputs in a clean grid */}
      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 items-center">
        {GEM_SOURCE_FIELDS.map(({ field, label }) => (
          <BreakdownInputField
            key={field}
            label={label}
            value={breakdown[field]}
            onChange={handleChange(field)}
          />
        ))}
      </div>
    </div>
  )
}

/** Individual input field for a breakdown source */
interface BreakdownInputFieldProps {
  label: string
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function BreakdownInputField({ label, value, onChange }: BreakdownInputFieldProps) {
  return (
    <>
      <span className="text-xs text-slate-400">{label}</span>
      <Input
        type="number"
        value={value || ''}
        onChange={onChange}
        className="w-20 h-7 text-right text-sm bg-slate-900/50"
        placeholder="0"
        min={0}
      />
    </>
  )
}
