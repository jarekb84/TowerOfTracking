/**
 * Banned Effects Display
 *
 * Shared component for displaying banned effects in both
 * Target Summary and Manual Practice Mode panels.
 * Uses flat styling (no card wrapper) per PRD constraints.
 */

import { getSubEffectById } from '@/shared/domain/module-data';

interface BannedEffectsDisplayProps {
  bannedEffectIds: string[];
}

export function BannedEffectsDisplay({ bannedEffectIds }: BannedEffectsDisplayProps) {
  if (bannedEffectIds.length === 0) {
    return null;
  }

  const effectNames = bannedEffectIds.map((id) => {
    const effect = getSubEffectById(id);
    return effect?.displayName ?? id;
  });

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <BanIcon />
        <span className="text-xs text-slate-400 font-medium">
          Effects banned from pool ({bannedEffectIds.length}):
        </span>
      </div>
      <div className="ml-6 text-xs text-slate-500">
        {effectNames.join(', ')}
      </div>
    </div>
  );
}

function BanIcon() {
  return (
    <svg className="w-4 h-4 text-red-400/70" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" />
    </svg>
  );
}
