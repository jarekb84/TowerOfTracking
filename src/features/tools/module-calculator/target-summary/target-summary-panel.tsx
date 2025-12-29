/**
 * Target Summary Panel
 *
 * Displays a summary of configured targets, locked effects, and banned effects.
 */

import { useMemo } from 'react';
import type { SlotTarget, PreLockedEffect } from '../types';
import { generateCollapsedSummary } from './target-summary-logic';
import { BannedEffectsDisplay, PoolInfoDisplay, getPoolInfo } from '../pool-status';
import { getRarityColor, getSubEffectById } from '@/shared/domain/module-data';
import type { ModuleType, Rarity } from '@/shared/domain/module-data';
import { CollapsibleCard } from '@/components/ui';

interface TargetSummaryPanelProps {
  targets: SlotTarget[];
  bannedEffects: string[];
  preLockedEffects: PreLockedEffect[];
  totalSlots: number;
  moduleType: ModuleType;
  moduleRarity: Rarity;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TargetSummaryPanel({
  targets,
  bannedEffects,
  preLockedEffects,
  moduleType,
  moduleRarity,
  isExpanded,
  onToggle,
}: TargetSummaryPanelProps) {
  const lockedEffectIds = useMemo(
    () => preLockedEffects.map((e) => e.effectId),
    [preLockedEffects]
  );

  const poolInfo = useMemo(
    () =>
      getPoolInfo({
        moduleType,
        moduleRarity,
        bannedEffectIds: bannedEffects,
        lockedEffectIds,
      }),
    [moduleType, moduleRarity, bannedEffects, lockedEffectIds]
  );

  const summary = generateCollapsedSummary(
    preLockedEffects.length,
    targets.length,
    bannedEffects.length,
    poolInfo.combinationCount
  );

  return (
    <CollapsibleCard
      title="Target Summary"
      summary={summary}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">

      {/* Pre-Locked Effects */}
      {preLockedEffects.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-cyan-400 font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
            Already Locked ({preLockedEffects.length})
          </div>
          <div className="space-y-1.5 ml-1">
            {preLockedEffects.map((locked) => (
              <LockedEffectLine key={locked.effectId} locked={locked} />
            ))}
          </div>
        </div>
      )}

      {/* Configured Targets */}
      {targets.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs text-orange-400 font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            Rolling For ({targets.length})
          </div>
          <div className="space-y-1.5 ml-1">
            {targets.map((target) => (
              <TargetLine key={target.slotNumber} target={target} />
            ))}
          </div>
        </div>
      ) : preLockedEffects.length === 0 ? (
        <div className="py-3 text-center">
          <p className="text-sm text-slate-500 italic">
            No targets configured yet
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Select effects from the table above
          </p>
        </div>
      ) : null}

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-700/30 space-y-3">
        {/* Banned Effects */}
        <BannedEffectsDisplay bannedEffectIds={bannedEffects} />

        {/* Pool Size */}
        <PoolInfoDisplay
          moduleType={moduleType}
          moduleRarity={moduleRarity}
          bannedEffectIds={bannedEffects}
          lockedEffectIds={lockedEffectIds}
          poolInfo={poolInfo}
        />
      </div>
      </div>
    </CollapsibleCard>
  );
}

interface LockedEffectLineProps {
  locked: PreLockedEffect;
}

function LockedEffectLine({ locked }: LockedEffectLineProps) {
  const effect = getSubEffectById(locked.effectId);
  const effectName = effect?.displayName ?? locked.effectId;
  const rarityColor = getRarityColor(locked.rarity);

  return (
    <div className="text-sm flex items-center gap-2 py-1 px-2 rounded-md bg-cyan-500/5 border border-cyan-500/20">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: rarityColor }}
      />
      <span className="text-slate-200 font-medium truncate">
        {effectName}
      </span>
      <span className="text-[10px] text-cyan-400/70 uppercase tracking-wide shrink-0">
        {locked.rarity}
      </span>
    </div>
  );
}

interface TargetLineProps {
  target: SlotTarget;
}

function TargetLine({ target }: TargetLineProps) {
  const effectNames = target.acceptableEffects.map((id) => {
    const effect = getSubEffectById(id);
    return effect?.displayName ?? id;
  });

  const rarityColor = getRarityColor(target.minRarity);
  const effectsText = effectNames.length <= 3
    ? effectNames.join(' / ')
    : `${effectNames.length} effects`;

  return (
    <div className="text-sm flex items-center gap-2 py-1 px-2 rounded-md bg-orange-500/5 border border-orange-500/20">
      <span className="text-orange-400/70 font-semibold text-xs min-w-[20px] tabular-nums">
        #{target.slotNumber}
      </span>
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: rarityColor }}
      />
      <span className="text-slate-200 font-medium truncate">
        {effectsText}
      </span>
      <span className="text-[10px] text-orange-400/70 uppercase tracking-wide shrink-0">
        {target.minRarity}+
      </span>
    </div>
  );
}
