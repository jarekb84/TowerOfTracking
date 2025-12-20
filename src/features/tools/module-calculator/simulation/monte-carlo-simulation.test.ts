import { describe, it, expect } from 'vitest';
import type { CalculatorConfig } from '../types';
import {
  runSimulation,
  simulateSingleRun,
  calculateStatistics,
  createSimulationConfig,
} from './monte-carlo-simulation';

describe('monte-carlo-simulation', () => {
  const createBasicConfig = (): CalculatorConfig => ({
    moduleType: 'cannon',
    moduleLevel: 141,
    moduleRarity: 'ancestral',
    slotCount: 5,
    bannedEffects: [],
    slotTargets: [
      { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'rare' },
      { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'rare' },
    ],
    preLockedEffects: [],
  });

  describe('simulateSingleRun', () => {
    it('completes a simulation run with valid config', () => {
      const config = createBasicConfig();
      const result = simulateSingleRun(config);

      expect(result.totalRolls).toBeGreaterThan(0);
      expect(result.totalShardCost).toBeGreaterThan(0);
      expect(result.lockOrder).toHaveLength(2);
    });

    it('locks effects in some order', () => {
      const config = createBasicConfig();
      const result = simulateSingleRun(config);

      // Each lock should have the expected properties
      result.lockOrder.forEach((lock) => {
        expect(lock.effectId).toBeTruthy();
        expect(lock.rarity).toBeTruthy();
        expect(lock.slotNumber).toBeGreaterThan(0);
        expect(lock.rollsToAcquire).toBeGreaterThan(0);
        expect(lock.shardCostPerRoll).toBeGreaterThan(0);
      });
    });

    it('fills all target slots', () => {
      const config = createBasicConfig();
      const result = simulateSingleRun(config);

      const filledSlots = new Set(result.lockOrder.map((l) => l.slotNumber));
      expect(filledSlots.size).toBe(2);
    });

    it('respects minimum rarity requirements', () => {
      const config: CalculatorConfig = {
        ...createBasicConfig(),
        slotTargets: [
          { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        ],
      };

      const result = simulateSingleRun(config);

      // The locked effect should be at least legendary
      const lockedRarity = result.lockOrder[0].rarity;
      expect(['legendary', 'mythic', 'ancestral']).toContain(lockedRarity);
    });
  });

  describe('runSimulation', () => {
    it('runs multiple iterations', () => {
      const config = createSimulationConfig(createBasicConfig(), 100);
      const results = runSimulation(config);

      expect(results.runCount).toBe(100);
    });

    it('calculates shard cost statistics', () => {
      const config = createSimulationConfig(createBasicConfig(), 100);
      const results = runSimulation(config);

      expect(results.shardCost.min).toBeLessThanOrEqual(results.shardCost.median);
      expect(results.shardCost.median).toBeLessThanOrEqual(results.shardCost.max);
      expect(results.shardCost.percentile10).toBeLessThanOrEqual(results.shardCost.percentile90);
    });

    it('calculates roll count statistics', () => {
      const config = createSimulationConfig(createBasicConfig(), 100);
      const results = runSimulation(config);

      expect(results.rollCount.min).toBeGreaterThan(0);
      expect(results.rollCount.max).toBeGreaterThanOrEqual(results.rollCount.min);
    });

    it('generates histogram buckets', () => {
      const config = createSimulationConfig(createBasicConfig(), 100);
      const results = runSimulation(config);

      expect(results.shardCostHistogram.length).toBeGreaterThan(0);

      // Bucket counts should sum to total runs
      const totalCount = results.shardCostHistogram.reduce((sum, b) => sum + b.count, 0);
      expect(totalCount).toBe(100);
    });
  });

  describe('calculateStatistics', () => {
    it('handles empty array', () => {
      const result = calculateStatistics([]);
      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.mean).toBe(0);
    });

    it('calculates correct statistics for known values', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const result = calculateStatistics(values);

      expect(result.min).toBe(10);
      expect(result.max).toBe(100);
      expect(result.mean).toBe(55);
      expect(result.median).toBe(55);
    });

    it('calculates percentiles correctly', () => {
      // 100 values from 1 to 100
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      const result = calculateStatistics(values);

      expect(result.percentile10).toBeCloseTo(10.9, 0);
      expect(result.percentile90).toBeCloseTo(90.1, 0);
      expect(result.percentile95).toBeCloseTo(95.05, 0);
    });
  });

  describe('createSimulationConfig', () => {
    it('creates config with defaults', () => {
      const calcConfig = createBasicConfig();
      const simConfig = createSimulationConfig(calcConfig);

      expect(simConfig.calculatorConfig).toBe(calcConfig);
      expect(simConfig.iterations).toBe(10000);
      expect(simConfig.shardCostPerRoll).toBe(100);
    });

    it('accepts custom values', () => {
      const calcConfig = createBasicConfig();
      const simConfig = createSimulationConfig(calcConfig, 5000, 200);

      expect(simConfig.iterations).toBe(5000);
      expect(simConfig.shardCostPerRoll).toBe(200);
    });
  });
});
