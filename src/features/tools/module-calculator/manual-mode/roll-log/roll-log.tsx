/**
 * Roll Log Component
 *
 * Displays a log of notable rolls in manual practice mode.
 * Wrapped in a CollapsibleCard for the right panel layout.
 */

import type { Rarity } from '@/shared/domain/module-data';
import { RARITY_ORDER, RARITY_CONFIG_MAP, getRarityColor } from '@/shared/domain/module-data';
import { formatLargeNumber } from '@/shared/formatting/number-scale';
import { Select, Button, CollapsibleCard } from '@/components/ui';
import type { RollLogEntry } from '../types';
import { generateRollLogSummary } from './roll-log-logic';

interface RollLogProps {
  minimumLogRarity: Rarity;
  logEntries: RollLogEntry[];
  showTargetMatches: boolean;
  onMinimumRarityChange: (rarity: Rarity) => void;
  onShowTargetMatchesChange: (show: boolean) => void;
  onClearLog: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function RollLog({
  minimumLogRarity,
  logEntries,
  showTargetMatches,
  onMinimumRarityChange,
  onShowTargetMatchesChange,
  onClearLog,
  isExpanded,
  onToggle,
}: RollLogProps) {
  const summary = generateRollLogSummary(logEntries);

  return (
    <CollapsibleCard
      title="Roll Log"
      summary={summary}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-3">
        <RollLogControls
          minimumLogRarity={minimumLogRarity}
          showTargetMatches={showTargetMatches}
          hasEntries={logEntries.length > 0}
          onMinimumRarityChange={onMinimumRarityChange}
          onShowTargetMatchesChange={onShowTargetMatchesChange}
          onClearLog={onClearLog}
        />
        <RollLogTable entries={logEntries} showTargetMatches={showTargetMatches} />
      </div>
    </CollapsibleCard>
  );
}

interface RollLogControlsProps {
  minimumLogRarity: Rarity;
  showTargetMatches: boolean;
  hasEntries: boolean;
  onMinimumRarityChange: (rarity: Rarity) => void;
  onShowTargetMatchesChange: (show: boolean) => void;
  onClearLog: () => void;
}

function RollLogControls({
  minimumLogRarity,
  showTargetMatches,
  hasEntries,
  onMinimumRarityChange,
  onShowTargetMatchesChange,
  onClearLog,
}: RollLogControlsProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Min Rarity:</span>
        <Select
          value={minimumLogRarity}
          onChange={(e) => onMinimumRarityChange(e.target.value as Rarity)}
          size="compact"
          className="w-28"
          style={{ color: getRarityColor(minimumLogRarity) }}
        >
          {RARITY_ORDER.map((rarity) => (
            <option
              key={rarity}
              value={rarity}
              style={{ color: getRarityColor(rarity) }}
            >
              {RARITY_CONFIG_MAP[rarity].displayName}
            </option>
          ))}
        </Select>
      </div>

      <TargetMatchToggle
        checked={showTargetMatches}
        onChange={onShowTargetMatchesChange}
      />

      {hasEntries && (
        <Button
          variant="ghost"
          size="compact"
          onClick={onClearLog}
          className="text-slate-500 hover:text-slate-300"
        >
          <ClearIcon />
          Clear
        </Button>
      )}
    </div>
  );
}

function ClearIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

interface TargetMatchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function TargetMatchToggle({ checked, onChange }: TargetMatchToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div
        className={`
          relative w-8 h-4 rounded-full transition-colors
          ${checked ? 'bg-orange-500/50' : 'bg-slate-700'}
        `}
      >
        <div
          className={`
            absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform bg-white
            ${checked ? 'translate-x-4' : 'translate-x-0'}
          `}
        />
      </div>
      <span className="text-xs text-slate-400" title="Show when rolled effects matched your target criteria">
        Show Hits
      </span>
    </label>
  );
}

interface RollLogTableProps {
  entries: RollLogEntry[];
  showTargetMatches: boolean;
}

function RollLogTable({ entries, showTargetMatches }: RollLogTableProps) {
  return (
    <div className="rounded-lg border border-slate-700/30 bg-slate-900/30 overflow-hidden">
      <div className="overflow-y-auto max-h-[200px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60 sticky top-0">
            <tr className="text-left text-slate-400 text-xs">
              <th className="px-3 py-2 font-medium w-14">Roll #</th>
              <th className="px-3 py-2 font-medium w-14 text-right">Total</th>
              <th className="px-3 py-2 font-medium w-14 text-right">Cost</th>
              <th className="px-3 py-2 font-medium">Effects</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500 text-xs">
                  No rolls matching filter yet
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <RollLogRow key={`${entry.rollNumber}-${index}`} entry={entry} showTargetMatches={showTargetMatches} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface RollLogRowProps {
  entry: RollLogEntry;
  showTargetMatches: boolean;
}

function RollLogRow({ entry, showTargetMatches }: RollLogRowProps) {
  return (
    <tr className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors">
      <td className="px-3 py-2 tabular-nums text-slate-400 text-xs">{entry.rollNumber}</td>
      <td className="px-3 py-2 tabular-nums text-right text-slate-200 font-medium">
        {formatLargeNumber(entry.totalShards)}
      </td>
      <td className="px-3 py-2 tabular-nums text-right text-orange-400/80 text-xs">
        +{formatLargeNumber(entry.rollCost)}
      </td>
      <td className="px-3 py-2">
        <EffectsList effects={entry.effects} showTargetMatches={showTargetMatches} />
      </td>
    </tr>
  );
}

interface EffectsListProps {
  effects: RollLogEntry['effects'];
  showTargetMatches: boolean;
}

function EffectsList({ effects, showTargetMatches }: EffectsListProps) {
  return (
    <span className="text-slate-300 text-xs">
      {effects.map((effect, index) => (
        <span key={effect.effectId}>
          {index > 0 && <span className="text-slate-600">, </span>}
          <span className="text-slate-400">{effect.name}</span>
          <span
            className="ml-1 font-medium"
            style={{ color: getRarityColor(effect.rarity) }}
          >
            ({effect.shortName})
          </span>
          {showTargetMatches && effect.isTargetMatch && (
            <span className="ml-1 text-green-400" title="This effect matched your target criteria">
              *
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
