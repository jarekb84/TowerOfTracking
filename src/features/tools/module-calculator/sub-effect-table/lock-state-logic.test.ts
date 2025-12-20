/**
 * Lock State Logic Tests
 *
 * Tests for lock-related functions in table-state-logic.ts
 */

import { describe, it, expect } from 'vitest';
import type { EffectSelection } from '../types';
import {
  createEmptySelection,
  toggleLocked,
  canLockMore,
  countLockedEffects,
  getLockedEffects,
} from './table-state-logic';

describe('lock-state-logic', () => {
  describe('toggleLocked', () => {
    it('locks effect at specified rarity when under max locks', () => {
      const selection = createEmptySelection('attackSpeed');
      const updated = toggleLocked(selection, 'legendary', 0, 4);

      expect(updated.isLocked).toBe(true);
      expect(updated.lockedRarity).toBe('legendary');
    });

    it('clears targeting settings when locking', () => {
      const selection: EffectSelection = {
        effectId: 'attackSpeed',
        minRarity: 'epic',
        targetSlots: [1, 2],
        isBanned: false,
        isLocked: false,
        lockedRarity: null,
      };
      const updated = toggleLocked(selection, 'legendary', 0, 4);

      expect(updated.isLocked).toBe(true);
      expect(updated.minRarity).toBeNull();
      expect(updated.targetSlots).toEqual([]);
    });

    it('unlocks effect when clicking same locked rarity', () => {
      const selection: EffectSelection = {
        effectId: 'attackSpeed',
        minRarity: null,
        targetSlots: [],
        isBanned: false,
        isLocked: true,
        lockedRarity: 'legendary',
      };
      const updated = toggleLocked(selection, 'legendary', 1, 4);

      expect(updated.isLocked).toBe(false);
      expect(updated.lockedRarity).toBeNull();
    });

    it('changes locked rarity when clicking different rarity on locked effect', () => {
      const selection: EffectSelection = {
        effectId: 'attackSpeed',
        minRarity: null,
        targetSlots: [],
        isBanned: false,
        isLocked: true,
        lockedRarity: 'legendary',
      };
      const updated = toggleLocked(selection, 'mythic', 1, 4);

      expect(updated.isLocked).toBe(true);
      expect(updated.lockedRarity).toBe('mythic');
    });

    it('does not lock when at max locks limit', () => {
      const selection = createEmptySelection('attackSpeed');
      const updated = toggleLocked(selection, 'legendary', 4, 4);

      expect(updated.isLocked).toBe(false);
      expect(updated.lockedRarity).toBeNull();
    });

    it('still allows unlocking when at max locks', () => {
      const selection: EffectSelection = {
        effectId: 'attackSpeed',
        minRarity: null,
        targetSlots: [],
        isBanned: false,
        isLocked: true,
        lockedRarity: 'legendary',
      };
      const updated = toggleLocked(selection, 'legendary', 4, 4);

      expect(updated.isLocked).toBe(false);
      expect(updated.lockedRarity).toBeNull();
    });
  });

  describe('canLockMore', () => {
    it('returns true when under max locks', () => {
      expect(canLockMore(0, 4)).toBe(true);
      expect(canLockMore(2, 4)).toBe(true);
      expect(canLockMore(3, 4)).toBe(true);
    });

    it('returns false when at or exceeds max locks', () => {
      expect(canLockMore(4, 4)).toBe(false);
      expect(canLockMore(5, 4)).toBe(false);
    });
  });

  describe('countLockedEffects', () => {
    it('counts locked effects', () => {
      const selections: EffectSelection[] = [
        { effectId: 'a', minRarity: null, targetSlots: [], isBanned: false, isLocked: true, lockedRarity: 'legendary' },
        { effectId: 'b', minRarity: 'epic', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
        { effectId: 'c', minRarity: null, targetSlots: [], isBanned: false, isLocked: true, lockedRarity: 'mythic' },
      ];

      expect(countLockedEffects(selections)).toBe(2);
    });

    it('returns 0 for empty array', () => {
      expect(countLockedEffects([])).toBe(0);
    });

    it('returns 0 when no effects are locked', () => {
      const selections: EffectSelection[] = [
        { effectId: 'a', minRarity: 'legendary', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
        { effectId: 'b', minRarity: 'epic', targetSlots: [2], isBanned: false, isLocked: false, lockedRarity: null },
      ];

      expect(countLockedEffects(selections)).toBe(0);
    });
  });

  describe('getLockedEffects', () => {
    it('returns locked effects with their rarities', () => {
      const selections: EffectSelection[] = [
        { effectId: 'a', minRarity: null, targetSlots: [], isBanned: false, isLocked: true, lockedRarity: 'legendary' },
        { effectId: 'b', minRarity: 'epic', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
        { effectId: 'c', minRarity: null, targetSlots: [], isBanned: false, isLocked: true, lockedRarity: 'mythic' },
      ];

      const locked = getLockedEffects(selections);

      expect(locked).toHaveLength(2);
      expect(locked).toContainEqual({ effectId: 'a', rarity: 'legendary' });
      expect(locked).toContainEqual({ effectId: 'c', rarity: 'mythic' });
    });

    it('returns empty array when no effects are locked', () => {
      const selections: EffectSelection[] = [
        { effectId: 'a', minRarity: 'legendary', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
      ];

      expect(getLockedEffects(selections)).toEqual([]);
    });

    it('excludes locked effects without a locked rarity', () => {
      const selections: EffectSelection[] = [
        { effectId: 'a', minRarity: null, targetSlots: [], isBanned: false, isLocked: true, lockedRarity: null },
      ];

      expect(getLockedEffects(selections)).toEqual([]);
    });
  });
});
