/**
 * Module Header
 *
 * Displays module rarity badge and level for manual mode.
 */

import type { Rarity } from '@/shared/domain/module-data';
import { getRarityColor } from '@/shared/domain/module-data';

interface ModuleHeaderProps {
  moduleRarity: Rarity;
  moduleLevel: number;
}

export function ModuleHeader({ moduleRarity, moduleLevel }: ModuleHeaderProps) {
  const rarityColor = getRarityColor(moduleRarity);
  const rarityLabel = moduleRarity.toUpperCase();

  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
      <RarityBadge label={rarityLabel} color={rarityColor} />
      <LevelDisplay level={moduleLevel} />
    </div>
  );
}

interface RarityBadgeProps {
  label: string;
  color: string;
}

function RarityBadge({ label, color }: RarityBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-3 py-1.5 text-xs font-bold tracking-wider rounded-md border transition-colors"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`,
      }}
    >
      {label}
    </span>
  );
}

interface LevelDisplayProps {
  level: number;
}

function LevelDisplay({ level }: LevelDisplayProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm tabular-nums">
      <span className="text-slate-500">Level</span>
      <span className="text-slate-200 font-semibold">{level}</span>
      <span className="text-slate-600">/</span>
      <span className="text-slate-500">200</span>
    </div>
  );
}
