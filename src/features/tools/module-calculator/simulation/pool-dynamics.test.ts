import { describe, it, expect } from 'vitest';
import type { SubEffectConfig } from '@/shared/domain/module-data';
import type { PoolEntry, SlotTarget } from '../types';
import {
  buildInitialPool,
  removeFromPool,
  removeEffectFromPool,
  calculateNormalizedProbabilities,
  getPoolEntryKey,
  parsePoolEntryKey,
  preparePool,
  simulateRollFast,
  removeFromPreparedPool,
  removeEffectFromPreparedPool,
  checkTargetMatch,
  calculateTargetHitProbability,
  getPoolSize,
  groupPoolByEffect,
} from './pool-dynamics';

describe('pool-dynamics', () => {
  describe('buildInitialPool', () => {
    it('builds pool for cannon module with all effects', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      expect(pool.length).toBeGreaterThan(0);

      // All entries should be for cannon effects
      pool.forEach((entry) => {
        expect(entry.effect.moduleType).toBe('cannon');
      });
    });

    it('respects module rarity cap', () => {
      const legendaryPool = buildInitialPool('cannon', 'legendary', []);

      // Should not contain mythic or ancestral entries
      legendaryPool.forEach((entry) => {
        expect(['common', 'rare', 'epic', 'legendary']).toContain(entry.rarity);
      });
    });

    it('excludes banned effects', () => {
      const pool = buildInitialPool('cannon', 'ancestral', ['attackSpeed']);

      const hasAttackSpeed = pool.some(
        (entry) => entry.effect.id === 'attackSpeed'
      );
      expect(hasAttackSpeed).toBe(false);
    });

    it('includes correct base probabilities', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);

      const commonEntry = pool.find((e) => e.rarity === 'common');
      const ancestralEntry = pool.find((e) => e.rarity === 'ancestral');

      expect(commonEntry?.baseProbability).toBeCloseTo(0.462, 3);
      expect(ancestralEntry?.baseProbability).toBeCloseTo(0.003, 4);
    });
  });

  describe('removeFromPool', () => {
    it('removes specific effect-rarity combination', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const initialSize = pool.length;

      const filtered = removeFromPool(pool, 'attackSpeed', 'legendary');

      expect(filtered.length).toBe(initialSize - 1);

      const hasRemovedEntry = filtered.some(
        (e) => e.effect.id === 'attackSpeed' && e.rarity === 'legendary'
      );
      expect(hasRemovedEntry).toBe(false);

      // Other rarities of same effect should remain
      const hasOtherRarities = filtered.some(
        (e) => e.effect.id === 'attackSpeed' && e.rarity !== 'legendary'
      );
      expect(hasOtherRarities).toBe(true);
    });
  });

  describe('removeEffectFromPool', () => {
    it('removes all rarities of an effect', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);

      const filtered = removeEffectFromPool(pool, 'attackSpeed');

      const hasAttackSpeed = filtered.some(
        (e) => e.effect.id === 'attackSpeed'
      );
      expect(hasAttackSpeed).toBe(false);
    });
  });

  describe('calculateNormalizedProbabilities', () => {
    it('probabilities sum to 1.0', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const normalized = calculateNormalizedProbabilities(pool);

      let sum = 0;
      normalized.forEach((prob) => {
        sum += prob;
      });

      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('adjusts probabilities when pool shrinks', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const smallerPool = pool.slice(0, Math.floor(pool.length / 2));

      const normalized = calculateNormalizedProbabilities(smallerPool);

      let sum = 0;
      normalized.forEach((prob) => {
        sum += prob;
      });

      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe('getPoolEntryKey / parsePoolEntryKey', () => {
    it('creates and parses keys correctly', () => {
      const key = getPoolEntryKey('attackSpeed', 'legendary');
      expect(key).toBe('attackSpeed:legendary');

      const parsed = parsePoolEntryKey(key);
      expect(parsed.effectId).toBe('attackSpeed');
      expect(parsed.rarity).toBe('legendary');
    });
  });

  describe('checkTargetMatch', () => {
    const mockEffect: SubEffectConfig = {
      id: 'attackSpeed',
      displayName: 'Attack Speed',
      moduleType: 'cannon',
      values: {
        common: 0.3,
        rare: 0.5,
        epic: 0.7,
        legendary: 1,
        mythic: 3,
        ancestral: 5,
      },
    };

    const mockEntry: PoolEntry = {
      effect: mockEffect,
      rarity: 'legendary',
      baseProbability: 0.025,
    };

    it('returns target when entry matches', () => {
      const targets: SlotTarget[] = [
        {
          slotNumber: 1,
          acceptableEffects: ['attackSpeed'],
          minRarity: 'epic',
        },
      ];
      const minRarities = new Map([['attackSpeed', 'epic' as const]]);

      const result = checkTargetMatch(mockEntry, targets, minRarities);
      expect(result).toEqual(targets[0]);
    });

    it('returns null when rarity too low', () => {
      const lowEntry: PoolEntry = { ...mockEntry, rarity: 'rare' };
      const targets: SlotTarget[] = [
        {
          slotNumber: 1,
          acceptableEffects: ['attackSpeed'],
          minRarity: 'epic',
        },
      ];
      const minRarities = new Map([['attackSpeed', 'epic' as const]]);

      const result = checkTargetMatch(lowEntry, targets, minRarities);
      expect(result).toBeNull();
    });

    it('returns null when effect not in targets', () => {
      const targets: SlotTarget[] = [
        {
          slotNumber: 1,
          acceptableEffects: ['critChance'],
          minRarity: 'epic',
        },
      ];
      const minRarities = new Map([['critChance', 'epic' as const]]);

      const result = checkTargetMatch(mockEntry, targets, minRarities);
      expect(result).toBeNull();
    });
  });

  describe('calculateTargetHitProbability', () => {
    it('returns probability > 0 when targets exist in pool', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const targets: SlotTarget[] = [
        {
          slotNumber: 1,
          acceptableEffects: ['attackSpeed'],
          minRarity: 'legendary',
        },
      ];
      const minRarities = new Map([['attackSpeed', 'legendary' as const]]);

      const probability = calculateTargetHitProbability(pool, targets, minRarities);
      expect(probability).toBeGreaterThan(0);
      expect(probability).toBeLessThan(1);
    });

    it('returns 0 when no targets match', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const targets: SlotTarget[] = [
        {
          slotNumber: 1,
          acceptableEffects: ['nonexistent'],
          minRarity: 'legendary',
        },
      ];
      const minRarities = new Map([['nonexistent', 'legendary' as const]]);

      const probability = calculateTargetHitProbability(pool, targets, minRarities);
      expect(probability).toBe(0);
    });
  });

  describe('getPoolSize', () => {
    it('returns correct pool size', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      expect(getPoolSize(pool)).toBe(pool.length);
    });
  });

  describe('groupPoolByEffect', () => {
    it('groups entries by effect id', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const groups = groupPoolByEffect(pool);

      // Should have multiple groups
      expect(groups.size).toBeGreaterThan(1);

      // Each group should contain entries for same effect
      groups.forEach((entries, effectId) => {
        entries.forEach((entry) => {
          expect(entry.effect.id).toBe(effectId);
        });
      });
    });
  });

  describe('preparePool', () => {
    it('creates cumulative probabilities that sum to 1.0', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const prepared = preparePool(pool);

      expect(prepared.entries).toEqual(pool);
      expect(prepared.cumulativeProbs.length).toBe(pool.length);
      expect(prepared.cumulativeProbs[prepared.cumulativeProbs.length - 1]).toBe(1.0);
    });

    it('cumulative probabilities are monotonically increasing', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const prepared = preparePool(pool);

      for (let i = 1; i < prepared.cumulativeProbs.length; i++) {
        expect(prepared.cumulativeProbs[i]).toBeGreaterThan(prepared.cumulativeProbs[i - 1]);
      }
    });

    it('handles empty pool', () => {
      const prepared = preparePool([]);

      expect(prepared.entries).toEqual([]);
      expect(prepared.cumulativeProbs).toEqual([]);
    });
  });

  describe('simulateRollFast', () => {
    it('returns an entry from the pool', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const prepared = preparePool(pool);
      const result = simulateRollFast(prepared, 0.5);

      expect(pool).toContainEqual(result);
    });

    it('returns first entry with random = 0', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const prepared = preparePool(pool);
      const result = simulateRollFast(prepared, 0);

      expect(result).toEqual(pool[0]);
    });

    it('returns last entry with random close to 1', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const prepared = preparePool(pool);
      const result = simulateRollFast(prepared, 0.9999999);

      expect(result).toEqual(pool[pool.length - 1]);
    });

    it('throws error for empty pool', () => {
      const prepared = preparePool([]);

      expect(() => simulateRollFast(prepared, 0.5)).toThrow('Cannot roll from empty pool');
    });
  });

  describe('removeFromPreparedPool', () => {
    it('removes specific effect-rarity and returns new prepared pool', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const prepared = preparePool(pool);
      const initialSize = prepared.entries.length;

      const newPrepared = removeFromPreparedPool(prepared, 'attackSpeed', 'legendary');

      expect(newPrepared.entries.length).toBe(initialSize - 1);
      expect(newPrepared.cumulativeProbs.length).toBe(initialSize - 1);

      // Should not contain removed entry
      const hasRemovedEntry = newPrepared.entries.some(
        (e) => e.effect.id === 'attackSpeed' && e.rarity === 'legendary'
      );
      expect(hasRemovedEntry).toBe(false);

      // New cumulative probs should sum to 1.0
      expect(newPrepared.cumulativeProbs[newPrepared.cumulativeProbs.length - 1]).toBe(1.0);
    });
  });

  describe('removeEffectFromPreparedPool', () => {
    it('removes ALL rarities of an effect from prepared pool', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const prepared = preparePool(pool);

      // Count how many attack speed entries exist before removal
      const attackSpeedCount = prepared.entries.filter(
        (e) => e.effect.id === 'attackSpeed'
      ).length;
      expect(attackSpeedCount).toBeGreaterThan(1); // Should have multiple rarities

      const newPrepared = removeEffectFromPreparedPool(prepared, 'attackSpeed');

      // Should have removed all attack speed entries
      expect(newPrepared.entries.length).toBe(prepared.entries.length - attackSpeedCount);

      // Should not contain any attack speed entries
      const hasAttackSpeed = newPrepared.entries.some(
        (e) => e.effect.id === 'attackSpeed'
      );
      expect(hasAttackSpeed).toBe(false);

      // New cumulative probs should sum to 1.0
      expect(newPrepared.cumulativeProbs[newPrepared.cumulativeProbs.length - 1]).toBe(1.0);
    });

    it('removes more entries than removeFromPreparedPool', () => {
      const pool = buildInitialPool('cannon', 'ancestral', []);
      const prepared = preparePool(pool);

      // removeFromPreparedPool removes only one entry
      const afterSingleRemove = removeFromPreparedPool(prepared, 'attackSpeed', 'legendary');
      // removeEffectFromPreparedPool removes all rarities
      const afterFullRemove = removeEffectFromPreparedPool(prepared, 'attackSpeed');

      // Full removal should remove more entries than single rarity removal
      expect(afterFullRemove.entries.length).toBeLessThan(afterSingleRemove.entries.length);
    });
  });
});
