import { describe, it, expect } from 'vitest';
import type { SlotTarget } from '../types';
import { buildInitialPool, preparePool } from './pool-dynamics';
import {
  rollRound,
  rollUntilPriorityHit,
  lockEffect,
  isSimulationComplete,
  buildMinRarityMap,
} from './simulation-engine';

describe('simulation-engine', () => {
  const createTestPool = () => {
    const pool = buildInitialPool('cannon', 'ancestral', []);
    return preparePool(pool);
  };

  describe('rollRound', () => {
    it('returns results for each slot', () => {
      const pool = createTestPool();
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
      ];
      const minRarityMap = buildMinRarityMap(targets);

      const result = rollRound(pool, 4, targets, minRarityMap);

      expect(result.slotResults).toHaveLength(4);
      result.slotResults.forEach((sr) => {
        expect(sr.entry).toBeDefined();
        expect(sr.entry.effect).toBeDefined();
        expect(sr.entry.rarity).toBeDefined();
      });
    });

    it('returns empty results for empty pool', () => {
      const emptyPool = { entries: [], cumulativeProbs: [] };
      const targets: SlotTarget[] = [];
      const minRarityMap = new Map();

      const result = rollRound(emptyPool, 4, targets, minRarityMap);

      expect(result.slotResults).toHaveLength(0);
      expect(result.hasTargetHit).toBe(false);
      expect(result.hasCurrentPriorityHit).toBe(false);
    });

    it('returns empty results for zero slots', () => {
      const pool = createTestPool();
      const targets: SlotTarget[] = [];
      const minRarityMap = new Map();

      const result = rollRound(pool, 0, targets, minRarityMap);

      expect(result.slotResults).toHaveLength(0);
    });

    it('correctly identifies target matches', () => {
      const pool = createTestPool();
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
      ];
      const minRarityMap = buildMinRarityMap(targets);

      // Roll many times to eventually hit a target
      let hitFound = false;
      for (let i = 0; i < 100 && !hitFound; i++) {
        const result = rollRound(pool, 4, targets, minRarityMap);
        if (result.hasTargetHit) {
          hitFound = true;
          expect(result.slotResults.some((sr) => sr.isTargetMatch)).toBe(true);
        }
      }

      expect(hitFound).toBe(true);
    });

    it('never produces duplicate effects in the same round', () => {
      const pool = createTestPool();
      const targets: SlotTarget[] = [];
      const minRarityMap = new Map();

      // Roll many rounds with multiple slots to check for duplicates
      // This is a critical invariant: a module cannot have duplicate effects
      for (let i = 0; i < 200; i++) {
        const result = rollRound(pool, 5, targets, minRarityMap);

        // Extract effect IDs from this round
        const effectIds = result.slotResults.map((sr) => sr.entry.effect.id);

        // Check for duplicates using a Set
        const uniqueIds = new Set(effectIds);
        expect(uniqueIds.size).toBe(effectIds.length);
      }
    });

    it('distinguishes current priority from future priority targets', () => {
      const pool = createTestPool();
      // Two different priorities
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
        { slotNumber: 2, acceptableEffects: ['critFactor'], minRarity: 'common' },
      ];
      const minRarityMap = buildMinRarityMap(targets);

      // Roll until we get a hit
      let currentPriorityHit = false;
      for (let i = 0; i < 100 && !currentPriorityHit; i++) {
        const result = rollRound(pool, 4, targets, minRarityMap);
        if (result.hasCurrentPriorityHit) {
          currentPriorityHit = true;
          expect(result.firstPriorityHit).not.toBeNull();
          expect(result.firstPriorityHit?.target.slotNumber).toBe(1);
        }
      }

      expect(currentPriorityHit).toBe(true);
    });
  });

  describe('rollUntilPriorityHit', () => {
    it('returns null for empty pool', () => {
      const emptyPool = { entries: [], cumulativeProbs: [] };
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
      ];
      const minRarityMap = buildMinRarityMap(targets);

      const result = rollUntilPriorityHit({
        pool: emptyPool,
        openSlotCount: 4,
        remainingTargets: targets,
        minRarityMap,
      });

      expect(result).toBeNull();
    });

    it('eventually hits a target', () => {
      const pool = createTestPool();
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
      ];
      const minRarityMap = buildMinRarityMap(targets);

      const result = rollUntilPriorityHit({
        pool,
        openSlotCount: 4,
        remainingTargets: targets,
        minRarityMap,
      });

      expect(result).not.toBeNull();
      expect(result!.entry.effect.id).toBe('attackSpeed');
      expect(result!.rounds).toBeGreaterThan(0);
    });

    it('respects max rounds limit', () => {
      const pool = createTestPool();
      // Use a nonexistent effect to ensure we hit max rounds
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['nonexistent'], minRarity: 'common' },
      ];
      const minRarityMap = buildMinRarityMap(targets);

      const result = rollUntilPriorityHit(
        { pool, openSlotCount: 4, remainingTargets: targets, minRarityMap },
        10
      );

      expect(result).toBeNull();
    });
  });

  describe('lockEffect', () => {
    it('removes effect from pool', () => {
      const pool = createTestPool();
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'common' },
      ];

      const initialCount = pool.entries.filter((e) => e.effect.id === 'attackSpeed').length;
      expect(initialCount).toBeGreaterThan(0);

      const { newPool } = lockEffect(pool, targets, 'attackSpeed', 1);

      const finalCount = newPool.entries.filter((e) => e.effect.id === 'attackSpeed').length;
      expect(finalCount).toBe(0);
    });

    it('removes effect from remaining targets', () => {
      const pool = createTestPool();
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'common' },
        { slotNumber: 2, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'common' },
      ];

      const { newRemainingTargets } = lockEffect(pool, targets, 'attackSpeed', 1);

      // Slot 1 should be removed (it was filled)
      expect(newRemainingTargets.find((t) => t.slotNumber === 1)).toBeUndefined();

      // Slot 2 should have attackSpeed removed from acceptable effects
      const slot2 = newRemainingTargets.find((t) => t.slotNumber === 2);
      expect(slot2?.acceptableEffects).not.toContain('attackSpeed');
      expect(slot2?.acceptableEffects).toContain('critChance');
    });

    it('removes targets with empty acceptable effects', () => {
      const pool = createTestPool();
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
        { slotNumber: 2, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
      ];

      const { newRemainingTargets } = lockEffect(pool, targets, 'attackSpeed', 1);

      // Both slots only accepted attackSpeed, so after locking:
      // Slot 1 is removed (filled), Slot 2 has no more acceptable effects
      expect(newRemainingTargets).toHaveLength(0);
    });
  });

  describe('isSimulationComplete', () => {
    it('returns true when no remaining targets', () => {
      const pool = createTestPool();
      expect(isSimulationComplete([], pool)).toBe(true);
    });

    it('returns true when pool is empty', () => {
      const emptyPool = { entries: [], cumulativeProbs: [] };
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
      ];
      expect(isSimulationComplete(targets, emptyPool)).toBe(true);
    });

    it('returns false when targets remain and pool has entries', () => {
      const pool = createTestPool();
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
      ];
      expect(isSimulationComplete(targets, pool)).toBe(false);
    });
  });

  describe('integration: Monte Carlo and manual mode use same logic', () => {
    it('rollRound produces consistent behavior across multiple calls', () => {
      const pool = createTestPool();
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
      ];
      const minRarityMap = buildMinRarityMap(targets);

      // Both Monte Carlo and manual mode call this function
      // Verify it works consistently
      const results: boolean[] = [];
      for (let i = 0; i < 50; i++) {
        const result = rollRound(pool, 4, targets, minRarityMap);
        results.push(result.hasTargetHit);
      }

      // Should have some hits and some misses (probabilistic but very likely over 50 rolls)
      const hitCount = results.filter((r) => r).length;
      expect(hitCount).toBeGreaterThan(0);
      expect(hitCount).toBeLessThan(50);
    });

    it('lockEffect maintains correct state progression', () => {
      let pool = createTestPool();
      let targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'common' },
        { slotNumber: 2, acceptableEffects: ['attackSpeed', 'critChance'], minRarity: 'common' },
        { slotNumber: 3, acceptableEffects: ['critFactor'], minRarity: 'common' },
      ];

      // Lock attackSpeed in slot 1
      let result = lockEffect(pool, targets, 'attackSpeed', 1);
      pool = result.newPool;
      targets = result.newRemainingTargets;

      // Slot 2 should now only have critChance
      const slot2 = targets.find((t) => t.slotNumber === 2);
      expect(slot2?.acceptableEffects).toEqual(['critChance']);

      // Slot 3 should be unchanged
      const slot3 = targets.find((t) => t.slotNumber === 3);
      expect(slot3?.acceptableEffects).toEqual(['critFactor']);

      // Lock critChance in slot 2
      result = lockEffect(pool, targets, 'critChance', 2);
      pool = result.newPool;
      targets = result.newRemainingTargets;

      // Only slot 3 should remain
      expect(targets).toHaveLength(1);
      expect(targets[0].slotNumber).toBe(3);

      // Lock critFactor in slot 3
      result = lockEffect(pool, targets, 'critFactor', 3);
      targets = result.newRemainingTargets;

      // All targets should be complete
      expect(targets).toHaveLength(0);
    });
  });
});
