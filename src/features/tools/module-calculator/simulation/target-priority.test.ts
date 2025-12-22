import { describe, it, expect } from 'vitest';
import type { SlotTarget } from '../types';
import {
  getCurrentPriorityTargets,
  removeLockedEffectFromTargets,
  buildMinRarityMap,
  isTargetInCurrentPriority,
} from './target-priority';

describe('target-priority', () => {
  describe('getCurrentPriorityTargets', () => {
    it('returns empty array for empty targets', () => {
      expect(getCurrentPriorityTargets([])).toEqual([]);
    });

    it('returns single target when only one exists', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'rare' },
      ];

      const result = getCurrentPriorityTargets(targets);
      expect(result).toHaveLength(1);
      expect(result[0].slotNumber).toBe(1);
    });

    it('returns only minimum slot number targets when effects differ', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'rare' },
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'rare' },
        { slotNumber: 3, acceptableEffects: ['critFactor'], minRarity: 'rare' },
      ];

      const result = getCurrentPriorityTargets(targets);

      // Only slot 1 since it doesn't share effects with others
      expect(result).toHaveLength(1);
      expect(result[0].slotNumber).toBe(1);
    });

    it('returns all targets in same priority group (shared effects)', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
        { slotNumber: 2, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
        { slotNumber: 3, acceptableEffects: ['critFactor'], minRarity: 'rare' },
      ];

      const result = getCurrentPriorityTargets(targets);

      // Slots 1 and 2 share effects, so they're in the same priority group
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.slotNumber).sort()).toEqual([1, 2]);
    });

    it('correctly identifies priority after effect removal', () => {
      // Simulate the state after one effect from a shared pool is locked
      const targets: SlotTarget[] = [
        // Slot 2 now only accepts critChance (attackSpeed was locked)
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'rare' },
        { slotNumber: 3, acceptableEffects: ['critFactor'], minRarity: 'rare' },
      ];

      const result = getCurrentPriorityTargets(targets);

      // Slot 2 is now the minimum, and it doesn't share effects with slot 3
      expect(result).toHaveLength(1);
      expect(result[0].slotNumber).toBe(2);
    });

    it('handles partial effect overlap', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
        { slotNumber: 2, acceptableEffects: ['critChance', 'critFactor'], minRarity: 'rare' },
        { slotNumber: 3, acceptableEffects: ['coinBonus'], minRarity: 'rare' },
      ];

      const result = getCurrentPriorityTargets(targets);

      // Slots 1 and 2 share 'critChance', so they're in the same priority group
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.slotNumber).sort()).toEqual([1, 2]);
    });
  });

  describe('removeLockedEffectFromTargets', () => {
    it('removes effect from all targets acceptable effects', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
        { slotNumber: 2, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
      ];

      const result = removeLockedEffectFromTargets(targets, 'attackSpeed');

      expect(result).toHaveLength(2);
      expect(result[0].acceptableEffects).toEqual(['critChance']);
      expect(result[1].acceptableEffects).toEqual(['critChance']);
    });

    it('filters out targets with empty acceptable effects', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'rare' },
        { slotNumber: 2, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
      ];

      const result = removeLockedEffectFromTargets(targets, 'attackSpeed');

      // Slot 1 is removed because it only had attackSpeed
      expect(result).toHaveLength(1);
      expect(result[0].slotNumber).toBe(2);
      expect(result[0].acceptableEffects).toEqual(['critChance']);
    });

    it('preserves targets that do not contain the removed effect', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'rare' },
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'rare' },
      ];

      const result = removeLockedEffectFromTargets(targets, 'attackSpeed');

      expect(result).toHaveLength(1);
      expect(result[0].slotNumber).toBe(2);
      expect(result[0].acceptableEffects).toEqual(['critChance']);
    });

    it('returns empty array when all effects are removed', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'rare' },
      ];

      const result = removeLockedEffectFromTargets(targets, 'attackSpeed');

      expect(result).toEqual([]);
    });
  });

  describe('buildMinRarityMap', () => {
    it('returns empty map for empty targets', () => {
      const result = buildMinRarityMap([]);
      expect(result.size).toBe(0);
    });

    it('maps effect to its minimum rarity', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'epic' },
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'legendary' },
      ];

      const result = buildMinRarityMap(targets);

      expect(result.get('attackSpeed')).toBe('epic');
      expect(result.get('critChance')).toBe('legendary');
    });

    it('uses lower rarity when effect appears in multiple targets', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        { slotNumber: 2, acceptableEffects: ['attackSpeed'], minRarity: 'epic' },
      ];

      const result = buildMinRarityMap(targets);

      // Should use 'epic' as it's the lower (more permissive) requirement
      expect(result.get('attackSpeed')).toBe('epic');
    });

    it('handles multiple effects per target', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
      ];

      const result = buildMinRarityMap(targets);

      expect(result.get('attackSpeed')).toBe('rare');
      expect(result.get('critChance')).toBe('rare');
    });
  });

  describe('isTargetInCurrentPriority', () => {
    it('returns true for target in current priority group', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'rare' },
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'rare' },
      ];

      const result = isTargetInCurrentPriority(targets[0], targets);
      expect(result).toBe(true);
    });

    it('returns false for target not in current priority group', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'rare' },
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'rare' },
      ];

      // Slot 2 is not in the current priority group (slot 1 is minimum)
      const result = isTargetInCurrentPriority(targets[1], targets);
      expect(result).toBe(false);
    });

    it('returns true for all targets in same priority group', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
        { slotNumber: 2, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
        { slotNumber: 3, acceptableEffects: ['critFactor'], minRarity: 'rare' },
      ];

      // Both slots 1 and 2 are in current priority group (they share effects)
      expect(isTargetInCurrentPriority(targets[0], targets)).toBe(true);
      expect(isTargetInCurrentPriority(targets[1], targets)).toBe(true);
      expect(isTargetInCurrentPriority(targets[2], targets)).toBe(false);
    });
  });

  describe('integration: priority progression simulation', () => {
    it('correctly progresses through priority groups', () => {
      // Simulate the progression of a manual/Monte Carlo session
      let targets: SlotTarget[] = [
        // Priority 1: slots 1 and 2 share attackSpeed and critChance
        { slotNumber: 1, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
        { slotNumber: 2, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'rare' },
        // Priority 2: slot 3 has a different effect
        { slotNumber: 3, acceptableEffects: ['critFactor'], minRarity: 'rare' },
      ];

      // Step 1: Initial state - current priority should be slots 1 and 2
      let currentPriority = getCurrentPriorityTargets(targets);
      expect(currentPriority.map((t) => t.slotNumber).sort()).toEqual([1, 2]);

      // Step 2: Lock attackSpeed in slot 1 - remove from remaining targets
      targets = removeLockedEffectFromTargets(
        targets.filter((t) => t.slotNumber !== 1), // Remove slot 1 (it's filled)
        'attackSpeed' // Remove attackSpeed from remaining targets
      );

      // Now slot 2 should only accept critChance
      expect(targets.find((t) => t.slotNumber === 2)?.acceptableEffects).toEqual(['critChance']);

      // Current priority should now be slot 2 only (critChance doesn't overlap with slot 3)
      currentPriority = getCurrentPriorityTargets(targets);
      expect(currentPriority.map((t) => t.slotNumber)).toEqual([2]);

      // Step 3: Lock critChance in slot 2
      targets = removeLockedEffectFromTargets(
        targets.filter((t) => t.slotNumber !== 2), // Remove slot 2 (it's filled)
        'critChance'
      );

      // Now only slot 3 remains
      expect(targets).toHaveLength(1);
      expect(targets[0].slotNumber).toBe(3);

      // Current priority should be slot 3
      currentPriority = getCurrentPriorityTargets(targets);
      expect(currentPriority.map((t) => t.slotNumber)).toEqual([3]);

      // Step 4: Lock critFactor - all targets fulfilled
      targets = removeLockedEffectFromTargets(
        targets.filter((t) => t.slotNumber !== 3),
        'critFactor'
      );

      expect(targets).toHaveLength(0);
      expect(getCurrentPriorityTargets(targets)).toEqual([]);
    });
  });
});
