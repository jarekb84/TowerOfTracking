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
  onMinimumRarityChange: (rarity: Rarity) => void;
  onClearLog: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function RollLog({
  minimumLogRarity,
  logEntries,
  onMinimumRarityChange,
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
          hasEntries={logEntries.length > 0}
          onMinimumRarityChange={onMinimumRarityChange}
          onClearLog={onClearLog}
        />
        <RollLogTable entries={logEntries} />
      </div>
    </CollapsibleCard>
  );
}

interface RollLogControlsProps {
  minimumLogRarity: Rarity;
  hasEntries: boolean;
  onMinimumRarityChange: (rarity: Rarity) => void;
  onClearLog: () => void;
}

function RollLogControls({
  minimumLogRarity,
  hasEntries,
  onMinimumRarityChange,
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

interface RollLogTableProps {
  entries: RollLogEntry[];
}

function RollLogTable({ entries }: RollLogTableProps) {
  return (
    <div className="rounded-lg border border-slate-700/30 bg-slate-900/30 overflow-hidden">
      <div className="overflow-y-auto max-h-[200px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60 sticky top-0">
            <tr className="text-left text-slate-400 text-xs">
              <th className="px-3 py-2 font-medium w-16">Roll #</th>
              <th className="px-3 py-2 font-medium w-24 text-right">Total</th>
              <th className="px-3 py-2 font-medium w-20 text-right">Cost</th>
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
                <RollLogRow key={`${entry.rollNumber}-${index}`} entry={entry} />
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
}

function RollLogRow({ entry }: RollLogRowProps) {
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
        <EffectsList effects={entry.effects} />
      </td>
    </tr>
  );
}

interface EffectsListProps {
  effects: RollLogEntry['effects'];
}

function EffectsList({ effects }: EffectsListProps) {
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
        </span>
      ))}
    </span>
  );
}
