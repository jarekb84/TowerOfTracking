/**
 * Roll Log Component
 *
 * Displays a log of notable rolls in manual practice mode.
 * Users can filter by minimum rarity and enable/disable logging.
 */

import type { Rarity } from '@/shared/domain/module-data';
import { RARITY_ORDER, RARITY_CONFIG_MAP, getRarityColor } from '@/shared/domain/module-data';
import { formatLargeNumber } from '@/shared/formatting/number-scale';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { Select, Button } from '@/components/ui';
import type { RollLogEntry } from '../types';

interface RollLogProps {
  logEnabled: boolean;
  minimumLogRarity: Rarity;
  logEntries: RollLogEntry[];
  onLogEnabledChange: (enabled: boolean) => void;
  onMinimumRarityChange: (rarity: Rarity) => void;
  onClearLog: () => void;
}

export function RollLog({
  logEnabled,
  minimumLogRarity,
  logEntries,
  onLogEnabledChange,
  onMinimumRarityChange,
  onClearLog,
}: RollLogProps) {
  return (
    <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 space-y-3">
      <RollLogHeader />
      <RollLogControls
        logEnabled={logEnabled}
        minimumLogRarity={minimumLogRarity}
        hasEntries={logEntries.length > 0}
        onLogEnabledChange={onLogEnabledChange}
        onMinimumRarityChange={onMinimumRarityChange}
        onClearLog={onClearLog}
      />
      {logEnabled && <RollLogTable entries={logEntries} />}
    </div>
  );
}

function RollLogHeader() {
  return (
    <div className="flex items-center gap-2">
      <LogIcon />
      <h4 className="text-sm font-medium text-slate-300">Roll Log</h4>
    </div>
  );
}

function LogIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

interface RollLogControlsProps {
  logEnabled: boolean;
  minimumLogRarity: Rarity;
  hasEntries: boolean;
  onLogEnabledChange: (enabled: boolean) => void;
  onMinimumRarityChange: (rarity: Rarity) => void;
  onClearLog: () => void;
}

function RollLogControls({
  logEnabled,
  minimumLogRarity,
  hasEntries,
  onLogEnabledChange,
  onMinimumRarityChange,
  onClearLog,
}: RollLogControlsProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <ToggleSwitch
          checked={logEnabled}
          onCheckedChange={onLogEnabledChange}
          aria-label="Enable roll logging"
        />
        <span>Enable Log</span>
      </div>

      {logEnabled && (
        <>
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
        </>
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
