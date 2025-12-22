/* eslint-disable max-lines-per-function */
/**
 * Sub-Effect Table Hook
 *
 * Manages the selection state for the sub-effect table.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { ModuleType, Rarity, SubEffectConfig } from '@/shared/domain/module-data';
import { getSubEffectsForModule, filterByModuleRarity } from '@/shared/domain/module-data';
import type { EffectSelection, SlotTarget, PreLockedEffect } from '../types';
import {
  createEmptySelection,
  toggleMinRarity,
  toggleSlotAssignment,
  toggleBanned,
  toggleLocked,
  countEffectsPerSlot,
  countLockedEffects,
} from './table-state-logic';
import {
  selectionsToSlotTargets,
  selectionsToBannedEffects,
  selectionsToPreLockedEffects,
} from '../configuration/module-config-logic';

export interface UseSubEffectTableResult {
  effects: SubEffectConfig[];
  availableEffects: SubEffectConfig[];
  selections: Map<string, EffectSelection>;
  handleRarityClick: (effectId: string, rarity: Rarity) => void;
  handleSlotToggle: (effectId: string, slotNumber: number) => void;
  handleBanToggle: (effectId: string) => void;
  handleLockToggle: (effectId: string, rarity: Rarity) => void;
  getSelection: (effectId: string) => EffectSelection;
  effectsPerSlot: Map<number, number>;
  slotTargets: SlotTarget[];
  bannedEffects: string[];
  preLockedEffects: PreLockedEffect[];
  lockedCount: number;
  maxLocks: number;
  clearAllSelections: () => void;
  /** Lock an effect programmatically (for bidirectional sync with manual mode) */
  programmaticLock: (effectId: string, rarity: Rarity) => void;
  /** Unlock an effect programmatically (for bidirectional sync with manual mode) */
  programmaticUnlock: (effectId: string) => void;
  /** Set selections directly (for loading from persistence) */
  setSelections: React.Dispatch<React.SetStateAction<Map<string, EffectSelection>>>;
}

/**
 * Compute derived values from selections array
 */
function useDerivedSelectionValues(selectionsArray: EffectSelection[], slotCount: number) {
  const effectsPerSlot = useMemo(
    () => countEffectsPerSlot(selectionsArray, slotCount),
    [selectionsArray, slotCount]
  );

  const slotTargets = useMemo(
    () => selectionsToSlotTargets(selectionsArray),
    [selectionsArray]
  );

  const bannedEffects = useMemo(
    () => selectionsToBannedEffects(selectionsArray),
    [selectionsArray]
  );

  const preLockedEffects = useMemo(
    () => selectionsToPreLockedEffects(selectionsArray),
    [selectionsArray]
  );

  const lockedCount = useMemo(
    () => countLockedEffects(selectionsArray),
    [selectionsArray]
  );

  return { effectsPerSlot, slotTargets, bannedEffects, preLockedEffects, lockedCount };
}

export function useSubEffectTable(
  moduleType: ModuleType,
  moduleRarity: Rarity,
  slotCount: number,
  initialSelections?: Map<string, EffectSelection>
): UseSubEffectTableResult {
  const [selections, setSelections] = useState<Map<string, EffectSelection>>(
    () => initialSelections ?? new Map()
  );

  const effects = useMemo(() => getSubEffectsForModule(moduleType), [moduleType]);
  const availableEffects = useMemo(() => filterByModuleRarity(effects, moduleRarity), [effects, moduleRarity]);
  const maxLocks = Math.max(0, slotCount - 1);

  const getSelection = useCallback(
    (effectId: string): EffectSelection => selections.get(effectId) ?? createEmptySelection(effectId),
    [selections]
  );

  const updateSelection = useCallback(
    (effectId: string, updater: (selection: EffectSelection) => EffectSelection) => {
      setSelections((prev) => {
        const current = prev.get(effectId) ?? createEmptySelection(effectId);
        const next = new Map(prev);
        next.set(effectId, updater(current));
        return next;
      });
    },
    []
  );

  const handleRarityClick = useCallback(
    (effectId: string, rarity: Rarity) => updateSelection(effectId, (s) => toggleMinRarity(s, rarity)),
    [updateSelection]
  );

  const handleSlotToggle = useCallback(
    (effectId: string, slotNumber: number) => updateSelection(effectId, (s) => toggleSlotAssignment(s, slotNumber)),
    [updateSelection]
  );

  const handleBanToggle = useCallback(
    (effectId: string) => updateSelection(effectId, toggleBanned),
    [updateSelection]
  );

  const handleLockToggle = useCallback(
    (effectId: string, rarity: Rarity) => {
      setSelections((prev) => {
        const selectionsArr = Array.from(prev.values());
        const currentLockCount = countLockedEffects(selectionsArr);
        const current = prev.get(effectId) ?? createEmptySelection(effectId);
        const next = new Map(prev);
        next.set(effectId, toggleLocked(current, rarity, currentLockCount, maxLocks));
        return next;
      });
    },
    [maxLocks]
  );

  const clearAllSelections = useCallback(() => setSelections(new Map()), []);

  // Programmatic lock - bypasses UI toggle logic, directly sets locked state
  const programmaticLock = useCallback(
    (effectId: string, rarity: Rarity) => {
      setSelections((prev) => {
        const current = prev.get(effectId) ?? createEmptySelection(effectId);
        const next = new Map(prev);
        next.set(effectId, {
          ...current,
          isLocked: true,
          lockedRarity: rarity,
          // Clear targeting since effect is now locked
          minRarity: null,
          targetSlots: [],
        });
        return next;
      });
    },
    []
  );

  // Programmatic unlock - bypasses UI toggle logic, directly clears locked state
  const programmaticUnlock = useCallback(
    (effectId: string) => {
      setSelections((prev) => {
        const current = prev.get(effectId);
        if (!current) return prev;

        const next = new Map(prev);
        next.set(effectId, {
          ...current,
          isLocked: false,
          lockedRarity: null,
        });
        return next;
      });
    },
    []
  );

  const selectionsArray = useMemo(() => Array.from(selections.values()), [selections]);
  const derived = useDerivedSelectionValues(selectionsArray, slotCount);

  return {
    effects,
    availableEffects,
    selections,
    handleRarityClick,
    handleSlotToggle,
    handleBanToggle,
    handleLockToggle,
    getSelection,
    ...derived,
    maxLocks,
    clearAllSelections,
    programmaticLock,
    programmaticUnlock,
    /** Set selections directly (for loading from persistence) */
    setSelections,
  };
}
