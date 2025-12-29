/**
 * Pool Info Display
 *
 * Shared component for displaying pool size information in both
 * Target Summary and Manual Practice Mode panels.
 * Uses flat styling (no card wrapper) to match BannedEffectsDisplay.
 */

import { useMemo } from 'react';
import type { ModuleType, Rarity } from '@/shared/domain/module-data';
import { getPoolInfo, type PoolInfo } from './pool-info-logic';

interface PoolInfoDisplayProps {
  moduleType: ModuleType;
  moduleRarity: Rarity;
  bannedEffectIds: string[];
  lockedEffectIds: string[];
  /** Optional pre-computed pool info to avoid duplicate calculations */
  poolInfo?: PoolInfo;
}

export function PoolInfoDisplay({
  moduleType,
  moduleRarity,
  bannedEffectIds,
  lockedEffectIds,
  poolInfo: preComputedInfo,
}: PoolInfoDisplayProps) {
  const computedInfo: PoolInfo = useMemo(
    () =>
      getPoolInfo({
        moduleType,
        moduleRarity,
        bannedEffectIds,
        lockedEffectIds,
      }),
    [moduleType, moduleRarity, bannedEffectIds, lockedEffectIds]
  );

  // Use pre-computed info if provided, otherwise use the computed value
  const info = preComputedInfo ?? computedInfo;

  return (
    <div className="flex items-center gap-2">
      <PoolIcon />
      <span className="text-xs text-slate-400 font-medium">
        Pool size: {info.effectCount} effects ({info.combinationCount.toLocaleString()} combinations)
      </span>
    </div>
  );
}

function PoolIcon() {
  return (
    <svg className="w-4 h-4 text-blue-400/70" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm8-2h8v8h-8v-8zm2 2v4h4v-4h-4z" />
    </svg>
  );
}
