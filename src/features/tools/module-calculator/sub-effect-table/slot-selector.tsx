/**
 * Slot Selector Component
 *
 * Checkboxes for assigning an effect to one or more slots.
 */

import { isSlotAssigned } from './table-state-logic';
import type { EffectSelection } from '../types';

interface SlotSelectorProps {
  selection: EffectSelection;
  availableSlots: number[];
  onSlotToggle: (slotNumber: number) => void;
}

export function SlotSelector({
  selection,
  availableSlots,
  onSlotToggle,
}: SlotSelectorProps) {
  const isDisabled = selection.isBanned || !selection.minRarity;

  return (
    <div className="flex gap-1.5">
      {availableSlots.map((slotNumber) => {
        const isAssigned = isSlotAssigned(selection, slotNumber);

        return (
          <SlotCheckbox
            key={slotNumber}
            slotNumber={slotNumber}
            isAssigned={isAssigned}
            isDisabled={isDisabled}
            onToggle={() => onSlotToggle(slotNumber)}
          />
        );
      })}
    </div>
  );
}

interface SlotCheckboxProps {
  slotNumber: number;
  isAssigned: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}

function SlotCheckbox({
  slotNumber,
  isAssigned,
  isDisabled,
  onToggle,
}: SlotCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isDisabled}
      aria-pressed={isAssigned}
      className={`
        w-7 h-7 flex items-center justify-center text-xs font-medium rounded-md transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-1 focus:ring-offset-slate-900
        ${isDisabled
          ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed border border-slate-700/30'
          : isAssigned
            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 hover:bg-orange-400'
            : 'bg-slate-700/30 text-slate-400 border border-slate-600/50 hover:bg-slate-600/50 hover:text-slate-300'
        }
      `}
      title={`Priority ${slotNumber}`}
    >
      {slotNumber}
    </button>
  );
}

interface SlotHeaderProps {
  availableSlots: number[];
}

/**
 * Header cells for slot columns
 */
export function SlotHeader({ availableSlots }: SlotHeaderProps) {
  return (
    <th className="px-2 py-3 text-center">
      <div className="text-xs text-slate-400 mb-1.5">Priority</div>
      <div className="flex gap-1.5 justify-center">
        {availableSlots.map((slot) => (
          <div
            key={slot}
            className="w-7 h-7 flex items-center justify-center text-xs font-medium
                       bg-slate-700/30 text-slate-300 rounded-md border border-slate-600/30"
          >
            {slot}
          </div>
        ))}
      </div>
    </th>
  );
}
