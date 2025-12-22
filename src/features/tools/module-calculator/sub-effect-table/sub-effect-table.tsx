/**
 * Sub-Effect Table Component
 *
 * Interactive table showing all sub-effects for a module type
 * with rarity values, ban toggles, lock toggles, and slot assignments.
 */

import type { Rarity } from '@/shared/domain/module-data';
import { RARITY_CONFIG_MAP, getRarityColor } from '@/shared/domain/module-data';
import { SubEffectRow } from './sub-effect-row';
import { SlotHeader } from './slot-selector';
import type { UseSubEffectTableResult } from './use-sub-effect-table';

/**
 * Props for SubEffectTable - excludes internal functions used for
 * bidirectional sync with manual mode and persistence loading.
 */
interface SubEffectTableProps extends Omit<UseSubEffectTableResult, 'programmaticLock' | 'programmaticUnlock' | 'setSelections'> {
  moduleRarity: Rarity;
  availableSlots: number[];
}

export function SubEffectTable({
  availableEffects,
  moduleRarity,
  availableSlots,
  handleRarityClick,
  handleSlotToggle,
  handleBanToggle,
  handleLockToggle,
  getSelection,
  lockedCount,
  maxLocks,
}: SubEffectTableProps) {
  const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic', 'ancestral'];
  const moduleRarityIndex = rarities.indexOf(moduleRarity);
  const canLockMore = lockedCount < maxLocks;

  return (
    <div className="space-y-2">
      {/* Helper text */}
      <p className="text-xs text-slate-400 px-1">
        Click a rarity to target that effect, then assign a priority. Use the lock icon to mark effects already on your module.
        {lockedCount > 0 && (
          <span className="text-cyan-400 ml-2">
            ({lockedCount}/{maxLocks} slots locked)
          </span>
        )}
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-700/50">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/30 border-b border-slate-700/50">
              {/* Ban Header */}
              <th className="px-2 py-3 text-center text-xs font-medium text-slate-400">
                Ban
              </th>

              {/* Lock Header */}
              <th className="px-2 py-3 text-center text-xs font-medium text-slate-400">
                Lock
              </th>

              {/* Effect Name Header */}
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                Sub-Effect
              </th>

              {/* Rarity Headers */}
              {rarities.map((rarity) => {
                const config = RARITY_CONFIG_MAP[rarity];
                const isDisabled = rarities.indexOf(rarity) > moduleRarityIndex;

                return (
                  <th
                    key={rarity}
                    className={`px-2 py-3 text-center text-xs font-medium ${isDisabled ? 'opacity-40' : ''}`}
                    style={{ color: isDisabled ? undefined : getRarityColor(rarity) }}
                  >
                    <div>{config.displayName}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      {(config.probability * 100).toFixed(1)}%
                    </div>
                  </th>
                );
              })}

              {/* Slot Headers */}
              <SlotHeader availableSlots={availableSlots} />
            </tr>
          </thead>
        <tbody className="divide-y divide-slate-700/30">
          {availableEffects.map((effect) => {
            const selection = getSelection(effect.id);

            return (
              <SubEffectRow
                key={effect.id}
                effect={effect}
                selection={selection}
                moduleRarity={moduleRarity}
                availableSlots={availableSlots}
                canLockMore={canLockMore}
                onRarityClick={(rarity) => handleRarityClick(effect.id, rarity)}
                onSlotToggle={(slot) => handleSlotToggle(effect.id, slot)}
                onBanToggle={() => handleBanToggle(effect.id)}
                onLockToggle={(rarity) => handleLockToggle(effect.id, rarity)}
              />
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}
