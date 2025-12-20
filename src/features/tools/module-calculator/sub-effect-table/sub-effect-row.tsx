/**
 * Sub-Effect Row Component
 *
 * A single row in the sub-effect table showing effect name,
 * rarity values, ban toggle, lock toggle, and slot assignments.
 */

import type { Rarity, SubEffectConfig } from '@/shared/domain/module-data';
import { getRarityColor } from '@/shared/domain/module-data';
import { RarityCellsRow } from './rarity-cell';
import { SlotSelector } from './slot-selector';
import type { EffectSelection } from '../types';

interface SubEffectRowProps {
  effect: SubEffectConfig;
  selection: EffectSelection;
  moduleRarity: Rarity;
  availableSlots: number[];
  canLockMore: boolean;
  onRarityClick: (rarity: Rarity) => void;
  onSlotToggle: (slotNumber: number) => void;
  onBanToggle: () => void;
  onLockToggle: (rarity: Rarity) => void;
}

export function SubEffectRow({
  effect,
  selection,
  moduleRarity,
  availableSlots,
  canLockMore,
  onRarityClick,
  onSlotToggle,
  onBanToggle,
  onLockToggle,
}: SubEffectRowProps) {
  const hasTarget = selection.minRarity !== null && selection.targetSlots.length > 0;

  return (
    <tr
      className={`
        transition-colors duration-150
        ${selection.isBanned ? 'opacity-50 bg-slate-900/20' : ''}
        ${selection.isLocked ? 'bg-cyan-500/10' : ''}
        ${hasTarget && !selection.isBanned && !selection.isLocked ? 'bg-orange-500/5' : ''}
        hover:bg-slate-800/40
      `}
    >
      {/* Ban Toggle */}
      <td className="px-2 py-2.5 text-center">
        <BanToggle
          isBanned={selection.isBanned}
          isLocked={selection.isLocked}
          onToggle={onBanToggle}
        />
      </td>

      {/* Lock Toggle */}
      <td className="px-2 py-2.5 text-center">
        <LockToggle
          isLocked={selection.isLocked}
          lockedRarity={selection.lockedRarity}
          isBanned={selection.isBanned}
          canLockMore={canLockMore}
          moduleRarity={moduleRarity}
          onToggle={onLockToggle}
        />
      </td>

      {/* Effect Name */}
      <td className="px-4 py-2.5 text-sm font-medium text-slate-200 whitespace-nowrap">
        <span className={selection.isBanned ? 'line-through text-slate-400' : ''}>
          {effect.displayName}
        </span>
      </td>

      {/* Rarity Value Cells */}
      <RarityCellsRow
        effect={effect}
        selection={selection}
        moduleRarity={moduleRarity}
        onRarityClick={selection.isLocked ? onLockToggle : onRarityClick}
      />

      {/* Slot Selector */}
      <td className="px-2 py-2.5">
        <SlotSelector
          selection={selection}
          availableSlots={availableSlots}
          onSlotToggle={onSlotToggle}
        />
      </td>
    </tr>
  );
}

interface BanToggleProps {
  isBanned: boolean;
  isLocked: boolean;
  onToggle: () => void;
}

function BanToggle({ isBanned, isLocked, onToggle }: BanToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isLocked}
      className={`
        w-7 h-7 rounded-md border transition-all duration-200 flex items-center justify-center
        focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900
        ${isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${isBanned
          ? 'bg-red-500/15 border-red-500/50 text-red-400 hover:bg-red-500/25 hover:border-red-500/70'
          : 'bg-slate-800/40 border-slate-600/40 text-slate-500 hover:border-slate-500/60 hover:bg-slate-700/50 hover:text-slate-400'
        }
      `}
      title={isLocked ? 'Cannot ban a locked effect' : (isBanned ? 'Unban effect' : 'Ban effect (Lab Research)')}
      aria-pressed={isBanned}
    >
      {isBanned ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
        </svg>
      )}
    </button>
  );
}

interface LockToggleProps {
  isLocked: boolean;
  lockedRarity: Rarity | null;
  isBanned: boolean;
  canLockMore: boolean;
  moduleRarity: Rarity;
  onToggle: (rarity: Rarity) => void;
}

/**
 * Get tooltip text for lock toggle button
 */
function getLockToggleTooltip(
  isLocked: boolean,
  lockedRarity: Rarity | null,
  isBanned: boolean,
  canLockMore: boolean
): string {
  if (isLocked) return `Locked at ${lockedRarity} - click to unlock`;
  if (isBanned) return 'Cannot lock a banned effect';
  if (!canLockMore) return 'Maximum locks reached';
  return 'Lock this effect (already on module)';
}

function LockToggle({
  isLocked,
  lockedRarity,
  isBanned,
  canLockMore,
  moduleRarity,
  onToggle,
}: LockToggleProps) {
  const canToggle = isLocked || (canLockMore && !isBanned);
  const tooltipText = getLockToggleTooltip(isLocked, lockedRarity, isBanned, canLockMore);

  const handleClick = () => {
    if (!canToggle) return;
    const rarity = lockedRarity ?? moduleRarity;
    onToggle(rarity);
  };

  const buttonClasses = isLocked
    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/25 hover:border-cyan-500/70'
    : 'bg-slate-800/40 border-slate-600/40 text-slate-500 hover:border-slate-500/60 hover:bg-slate-700/50 hover:text-slate-400';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canToggle}
      className={`
        relative w-7 h-7 rounded-md border transition-all duration-200 flex items-center justify-center
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900
        ${!canToggle ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${buttonClasses}
      `}
      title={tooltipText}
      aria-pressed={isLocked}
    >
      <LockIcon isLocked={isLocked} />
      <LockRarityIndicator isLocked={isLocked} lockedRarity={lockedRarity} />
    </button>
  );
}

function LockIcon({ isLocked }: { isLocked: boolean }) {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      {isLocked ? (
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
      ) : (
        <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z" />
      )}
    </svg>
  );
}

function LockRarityIndicator({ isLocked, lockedRarity }: { isLocked: boolean; lockedRarity: Rarity | null }) {
  if (!isLocked || !lockedRarity) return null;

  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 shadow-sm"
      style={{ backgroundColor: getRarityColor(lockedRarity) }}
      title={lockedRarity}
    />
  );
}
