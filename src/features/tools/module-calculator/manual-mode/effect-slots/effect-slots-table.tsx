/**
 * Effect Slots Table
 *
 * Container for all 8 effect slot rows in manual mode.
 */

import type { ManualSlot } from '../types';
import { EffectSlotRow } from './effect-slot-row';

interface EffectSlotsTableProps {
  slots: ManualSlot[];
  onLockSlot: (slotNumber: number) => void;
  onUnlockSlot: (slotNumber: number) => void;
  maxLocks: number;
  lockedCount: number;
}

export function EffectSlotsTable({
  slots,
  onLockSlot,
  onUnlockSlot,
  maxLocks,
  lockedCount,
}: EffectSlotsTableProps) {
  const canLockMore = lockedCount < maxLocks;

  return (
    <div className="space-y-1.5">
      {slots.map((slot) => (
        <EffectSlotRow
          key={slot.slotNumber}
          slot={slot}
          onLock={onLockSlot}
          onUnlock={onUnlockSlot}
          canLock={canLockMore}
        />
      ))}
    </div>
  );
}
