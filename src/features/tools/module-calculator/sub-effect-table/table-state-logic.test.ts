/**
 * Table State Logic Tests
 *
 * Tests for non-lock selection state functions.
 * Lock-related tests are in lock-state-logic.test.ts
 */

import { describe, it, expect } from 'vitest';
import type { EffectSelection } from '../types';
import {
  createEmptySelection,
  toggleMinRarity,
  toggleSlotAssignment,
  toggleBanned,
  isRaritySelected,
  isMinimumRarity,
  isSlotAssigned,
  getEffectsForSlot,
  getSlotMinRarity,
  clearSelection,
  isValidSelection,
  countEffectsPerSlot,
  getSelectionSummary,
} from './table-state-logic';

describe('table-state-logic', () => {
  describe('createEmptySelection', () => {
    it('creates selection with null values', () => {
      const selection = createEmptySelection('attackSpeed');

      expect(selection.effectId).toBe('attackSpeed');
      expect(selection.minRarity).toBeNull();
      expect(selection.targetSlots).toEqual([]);
      expect(selection.isBanned).toBe(false);
    });
  });

  describe('toggleMinRarity', () => {
    it('sets rarity when not selected', () => {
      const selection = createEmptySelection('attackSpeed');
      const updated = toggleMinRarity(selection, 'legendary');

      expect(updated.minRarity).toBe('legendary');
    });

    it('clears rarity when clicking same rarity', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        minRarity: 'legendary',
      };
      const updated = toggleMinRarity(selection, 'legendary');

      expect(updated.minRarity).toBeNull();
    });

    it('changes to different rarity', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        minRarity: 'legendary',
      };
      const updated = toggleMinRarity(selection, 'mythic');

      expect(updated.minRarity).toBe('mythic');
    });
  });

  describe('toggleSlotAssignment', () => {
    it('adds slot when not assigned', () => {
      const selection = createEmptySelection('attackSpeed');
      const updated = toggleSlotAssignment(selection, 1);

      expect(updated.targetSlots).toEqual([1]);
    });

    it('removes slot when already assigned', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        targetSlots: [1, 2],
      };
      const updated = toggleSlotAssignment(selection, 1);

      expect(updated.targetSlots).toEqual([2]);
    });

    it('keeps slots sorted', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        targetSlots: [1, 3],
      };
      const updated = toggleSlotAssignment(selection, 2);

      expect(updated.targetSlots).toEqual([1, 2, 3]);
    });
  });

  describe('toggleBanned', () => {
    it('bans effect and clears other settings', () => {
      const selection: EffectSelection = {
        effectId: 'attackSpeed',
        minRarity: 'legendary',
        targetSlots: [1, 2],
        isBanned: false,
        isLocked: false,
        lockedRarity: null,
      };
      const updated = toggleBanned(selection);

      expect(updated.isBanned).toBe(true);
      expect(updated.minRarity).toBeNull();
      expect(updated.targetSlots).toEqual([]);
    });

    it('unbans effect', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        isBanned: true,
      };
      const updated = toggleBanned(selection);

      expect(updated.isBanned).toBe(false);
    });

  });

  describe('isRaritySelected', () => {
    it('returns true for rarities at or above minimum', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        minRarity: 'epic',
      };

      expect(isRaritySelected(selection, 'epic')).toBe(true);
      expect(isRaritySelected(selection, 'legendary')).toBe(true);
      expect(isRaritySelected(selection, 'ancestral')).toBe(true);
    });

    it('returns false for rarities below minimum', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        minRarity: 'epic',
      };

      expect(isRaritySelected(selection, 'common')).toBe(false);
      expect(isRaritySelected(selection, 'rare')).toBe(false);
    });

    it('returns false when no minimum set', () => {
      const selection = createEmptySelection('attackSpeed');

      expect(isRaritySelected(selection, 'epic')).toBe(false);
    });
  });

  describe('isMinimumRarity', () => {
    it('returns true only for exact minimum', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        minRarity: 'epic',
      };

      expect(isMinimumRarity(selection, 'epic')).toBe(true);
      expect(isMinimumRarity(selection, 'legendary')).toBe(false);
    });
  });

  describe('isSlotAssigned', () => {
    it('returns true when slot is in targetSlots', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        targetSlots: [1, 3],
      };

      expect(isSlotAssigned(selection, 1)).toBe(true);
      expect(isSlotAssigned(selection, 3)).toBe(true);
      expect(isSlotAssigned(selection, 2)).toBe(false);
    });
  });

  describe('getEffectsForSlot', () => {
    const selections: EffectSelection[] = [
      { effectId: 'attackSpeed', minRarity: 'legendary', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
      { effectId: 'critChance', minRarity: 'epic', targetSlots: [1, 2], isBanned: false, isLocked: false, lockedRarity: null },
      { effectId: 'critFactor', minRarity: null, targetSlots: [], isBanned: true, isLocked: false, lockedRarity: null },
    ];

    it('returns effects assigned to slot', () => {
      const effects = getEffectsForSlot(selections, 1);

      expect(effects).toHaveLength(2);
      expect(effects.map((e) => e.effectId)).toContain('attackSpeed');
      expect(effects.map((e) => e.effectId)).toContain('critChance');
    });

    it('excludes banned effects', () => {
      const selectionsWithBanned: EffectSelection[] = [
        ...selections,
        { effectId: 'banned', minRarity: 'epic', targetSlots: [1], isBanned: true, isLocked: false, lockedRarity: null },
      ];

      const effects = getEffectsForSlot(selectionsWithBanned, 1);
      expect(effects.map((e) => e.effectId)).not.toContain('banned');
    });
  });

  describe('getSlotMinRarity', () => {
    it('returns lowest min rarity among effects', () => {
      const selections: EffectSelection[] = [
        { effectId: 'attackSpeed', minRarity: 'legendary', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
        { effectId: 'critChance', minRarity: 'epic', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
      ];

      const minRarity = getSlotMinRarity(selections, 1);
      expect(minRarity).toBe('epic');
    });

    it('returns null for empty slot', () => {
      const minRarity = getSlotMinRarity([], 1);
      expect(minRarity).toBeNull();
    });
  });

  describe('clearSelection', () => {
    it('clears rarity and slots but keeps banned status', () => {
      const selection: EffectSelection = {
        effectId: 'attackSpeed',
        minRarity: 'legendary',
        targetSlots: [1, 2],
        isBanned: false,
        isLocked: false,
        lockedRarity: null,
      };

      const cleared = clearSelection(selection);

      expect(cleared.minRarity).toBeNull();
      expect(cleared.targetSlots).toEqual([]);
      expect(cleared.isBanned).toBe(false);
    });
  });

  describe('isValidSelection', () => {
    it('returns true for banned effects', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        isBanned: true,
      };

      expect(isValidSelection(selection)).toBe(true);
    });

    it('returns true for properly configured selection', () => {
      const selection: EffectSelection = {
        effectId: 'attackSpeed',
        minRarity: 'legendary',
        targetSlots: [1],
        isBanned: false,
        isLocked: false,
        lockedRarity: null,
      };

      expect(isValidSelection(selection)).toBe(true);
    });

    it('returns true for empty selection', () => {
      const selection = createEmptySelection('attackSpeed');
      expect(isValidSelection(selection)).toBe(true);
    });

    it('returns false for rarity without slots', () => {
      const selection: EffectSelection = {
        effectId: 'attackSpeed',
        minRarity: 'legendary',
        targetSlots: [],
        isBanned: false,
        isLocked: false,
        lockedRarity: null,
      };

      expect(isValidSelection(selection)).toBe(false);
    });

    it('returns false for slots without rarity', () => {
      const selection: EffectSelection = {
        effectId: 'attackSpeed',
        minRarity: null,
        targetSlots: [1],
        isBanned: false,
        isLocked: false,
        lockedRarity: null,
      };

      expect(isValidSelection(selection)).toBe(false);
    });
  });

  describe('countEffectsPerSlot', () => {
    it('counts effects assigned to each slot', () => {
      const selections: EffectSelection[] = [
        { effectId: 'attackSpeed', minRarity: 'legendary', targetSlots: [1, 2], isBanned: false, isLocked: false, lockedRarity: null },
        { effectId: 'critChance', minRarity: 'epic', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
      ];

      const counts = countEffectsPerSlot(selections, 3);

      expect(counts.get(1)).toBe(2);
      expect(counts.get(2)).toBe(1);
      expect(counts.get(3)).toBe(0);
    });
  });

  describe('getSelectionSummary', () => {
    it('returns "Banned" for banned effects', () => {
      const selection: EffectSelection = {
        ...createEmptySelection('attackSpeed'),
        isBanned: true,
      };

      expect(getSelectionSummary(selection)).toBe('Banned');
    });

    it('returns empty string for unconfigured effect', () => {
      const selection = createEmptySelection('attackSpeed');
      expect(getSelectionSummary(selection)).toBe('');
    });

    it('returns formatted summary for configured effect', () => {
      const selection: EffectSelection = {
        effectId: 'attackSpeed',
        minRarity: 'legendary',
        targetSlots: [1, 2],
        isBanned: false,
        isLocked: false,
        lockedRarity: null,
      };

      const summary = getSelectionSummary(selection);
      expect(summary).toContain('Legendary+');
      expect(summary).toContain('1, 2');
    });
  });
});
