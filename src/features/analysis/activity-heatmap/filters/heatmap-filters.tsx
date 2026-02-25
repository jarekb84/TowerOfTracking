/**
 * Heatmap Filters Component
 *
 * Filter bar for the Activity Heatmap feature. Renders tier selector,
 * run type selector, and active hours configuration controls.
 *
 * Reuses shared TierSelector and RunTypeSelector components.
 * Thin presentation shell — all filter state lives in the orchestration hook.
 */

import { TierSelector } from '@/shared/domain/filters/tier/tier-selector'
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector'
import { FormControl, ToggleSwitch } from '@/components/ui'
import type { TierFilter } from '@/shared/domain/filters/types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { ActiveHoursConfig } from '../types'
import { formatHourOption } from '../grid/grid-labels'

interface HeatmapFiltersProps {
  selectedTier: TierFilter
  onTierChange: (tier: TierFilter) => void
  availableTiers: number[]
  selectedRunType: RunTypeFilter
  onRunTypeChange: (runType: RunTypeFilter) => void
  activeHours: ActiveHoursConfig
  onActiveHoursChange: (config: ActiveHoursConfig) => void
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i)

export function HeatmapFilters({
  selectedTier,
  onTierChange,
  availableTiers,
  selectedRunType,
  onRunTypeChange,
  activeHours,
  onActiveHoursChange,
}: HeatmapFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Run Type & Tier */}
      <div className="flex flex-wrap gap-4 items-end">
        <RunTypeSelector
          selectedType={selectedRunType}
          onTypeChange={onRunTypeChange}
          accentColor="orange"
          layout="vertical"
        />

        <TierSelector
          selectedTier={selectedTier}
          onTierChange={onTierChange}
          availableTiers={availableTiers}
          accentColor="orange"
          layout="vertical"
        />
      </div>

      {/* Row 2: Active Hours */}
      <ActiveHoursControls
        activeHours={activeHours}
        onChange={onActiveHoursChange}
      />
    </div>
  )
}

interface ActiveHoursControlsProps {
  activeHours: ActiveHoursConfig
  onChange: (config: ActiveHoursConfig) => void
}

function ActiveHoursControls({ activeHours, onChange }: ActiveHoursControlsProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <FormControl label="Active Hours" layout="vertical">
        <div className="flex items-center gap-3">
          <ToggleSwitch
            checked={activeHours.enabled}
            onCheckedChange={(enabled) => onChange({ ...activeHours, enabled })}
            aria-label="Toggle active hours highlight"
          />
          {activeHours.enabled && (
            <div className="flex items-center gap-1.5">
              <HourSelect
                value={activeHours.startHour}
                onChange={(startHour) => onChange({ ...activeHours, startHour })}
                ariaLabel="Active hours start"
              />
              <span className="text-xs text-slate-500">to</span>
              <HourSelect
                value={activeHours.endHour}
                onChange={(endHour) => onChange({ ...activeHours, endHour })}
                ariaLabel="Active hours end"
              />
            </div>
          )}
        </div>
      </FormControl>
    </div>
  )
}

interface HourSelectProps {
  value: number
  onChange: (hour: number) => void
  ariaLabel: string
}

function HourSelect({ value, onChange, ariaLabel }: HourSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={ariaLabel}
      className="rounded border border-slate-600 bg-slate-700/60 px-2 py-1 text-xs text-slate-200 transition-colors focus-visible:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 hover:border-slate-500"
    >
      {HOUR_OPTIONS.map((hour) => (
        <option key={hour} value={hour}>
          {formatHourOption(hour)}
        </option>
      ))}
    </select>
  )
}
