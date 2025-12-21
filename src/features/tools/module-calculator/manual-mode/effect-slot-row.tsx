/**
 * Effect Slot Row
 *
 * Single slot row with effect display and lock toggle for manual mode.
 */

import type { ManualSlot } from './types';
import { getRarityColor } from '@/shared/domain/module-data';

interface EffectSlotRowProps {
  slot: ManualSlot;
  onLock: (slotNumber: number) => void;
  onUnlock: (slotNumber: number) => void;
  canLock: boolean;
}

export function EffectSlotRow({
  slot,
  onLock,
  onUnlock,
  canLock,
}: EffectSlotRowProps) {
  const hasEffect = slot.effect !== null && slot.rarity !== null;

  const handleLockClick = () => {
    if (slot.isLocked) {
      onUnlock(slot.slotNumber);
    } else if (hasEffect && canLock) {
      onLock(slot.slotNumber);
    }
  };

  const rowClassName = buildRowClassName(slot.isLocked, slot.isTargetMatch && hasEffect);

  return (
    <div className={rowClassName}>
      {/* Slot Number */}
      <SlotNumber number={slot.slotNumber} />

      {/* Rarity Badge */}
      <RarityBadge rarity={slot.rarity} />

      {/* Effect Text */}
      <EffectText slot={slot} />

      {/* Target Match Indicator */}
      {slot.isTargetMatch && hasEffect && (
        <TargetMatchIndicator />
      )}

      {/* Lock Button */}
      <LockButton
        isLocked={slot.isLocked}
        canLock={canLock && hasEffect}
        onClick={handleLockClick}
      />
    </div>
  );
}

function buildRowClassName(isLocked: boolean, isTargetMatch: boolean): string {
  const base = 'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200';

  if (isLocked && isTargetMatch) {
    return `${base} bg-green-500/8 border border-cyan-500/40`;
  }
  if (isLocked) {
    return `${base} bg-cyan-500/5 border border-cyan-500/30`;
  }
  if (isTargetMatch) {
    return `${base} bg-green-500/8 border border-green-500/30`;
  }
  return `${base} bg-slate-800/20 border border-slate-700/30 hover:bg-slate-800/40 hover:border-slate-700/50`;
}

interface SlotNumberProps {
  number: number;
}

function SlotNumber({ number }: SlotNumberProps) {
  return (
    <span className="text-xs text-slate-500 w-5 text-center tabular-nums font-medium">
      {number}
    </span>
  );
}

interface RarityBadgeProps {
  rarity: ManualSlot['rarity'];
}

function RarityBadge({ rarity }: RarityBadgeProps) {
  // Fixed width to accommodate "Legendary" (longest word), all badges same size
  const badgeWidth = 'w-[5rem]';

  if (!rarity) {
    return (
      <span className={`inline-flex items-center justify-center text-[10px] font-medium text-slate-600 uppercase tracking-wide ${badgeWidth} py-0.5`}>
        ---
      </span>
    );
  }

  const color = getRarityColor(rarity);
  const label = formatRarityLabel(rarity);

  return (
    <span
      className={`inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-wide ${badgeWidth} py-0.5 px-1 rounded border`}
      style={{
        backgroundColor: `${color}12`,
        color: color,
        borderColor: `${color}25`,
      }}
    >
      {label}
    </span>
  );
}

function formatRarityLabel(rarity: string): string {
  // Full rarity names with proper capitalization (matching the game's display)
  const labels: Record<string, string> = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
    mythic: 'Mythic',
    ancestral: 'Ancestral',
  };
  return labels[rarity] ?? rarity;
}

interface EffectTextProps {
  slot: ManualSlot;
}

function EffectText({ slot }: EffectTextProps) {
  if (!slot.effect || !slot.rarity) {
    return (
      <span className="flex-1 text-sm text-slate-600 italic">
        Waiting for roll...
      </span>
    );
  }

  const rawValue = slot.effect.values[slot.rarity];
  const value = typeof rawValue === 'number' ? rawValue : (rawValue ? parseFloat(rawValue) : 0);
  const displayName = slot.effect.displayName;
  const valuePrefix = formatValuePrefix(value, slot.effect.id);

  return (
    <span className="flex-1 text-sm text-slate-300 truncate">
      <span className="text-orange-400 font-semibold tabular-nums">{valuePrefix}</span>
      <span className="mx-1.5 text-slate-600">|</span>
      <span className="text-slate-200">{displayName}</span>
    </span>
  );
}

function formatValuePrefix(value: number, effectId: string): string {
  // Percentage-based effects (most effects use percentages)
  const isPercentage = !effectId.includes('Flat');

  if (isPercentage) {
    // Values are already in percentage form in the data
    return `+${value}%`;
  }

  // Flat values
  return `+${value}`;
}

function TargetMatchIndicator() {
  return (
    <span
      className="flex items-center justify-center w-5 h-5 text-green-400"
      title="Target match!"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    </span>
  );
}

interface LockButtonProps {
  isLocked: boolean;
  canLock: boolean;
  onClick: () => void;
}

function LockButton({ isLocked, canLock, onClick }: LockButtonProps) {
  const disabled = !isLocked && !canLock;
  const className = buildLockButtonClassName(isLocked, disabled);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      title={isLocked ? 'Unlock slot' : 'Lock slot'}
      aria-pressed={isLocked}
    >
      <LockIcon isLocked={isLocked} />
    </button>
  );
}

function buildLockButtonClassName(isLocked: boolean, disabled: boolean): string {
  const base = 'flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900';

  if (isLocked) {
    return `${base} text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 hover:border-cyan-500/40 focus-visible:ring-cyan-500/50`;
  }
  if (disabled) {
    return `${base} text-slate-700 cursor-not-allowed`;
  }
  return `${base} text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50 focus-visible:ring-slate-500/50`;
}

function LockIcon({ isLocked }: { isLocked: boolean }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      {isLocked ? (
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
      ) : (
        <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z" />
      )}
    </svg>
  );
}
