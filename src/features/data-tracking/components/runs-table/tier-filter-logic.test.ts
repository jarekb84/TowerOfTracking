import { describe, it, expect } from 'vitest';
import { filterRunsByTier, getAvailableTiers } from './tier-filter-logic';
import type { ParsedGameRun } from '../../types/game-run.types';

const mockRun = (id: string, tier: number): ParsedGameRun => ({
  id,
  timestamp: new Date(),
  fields: {},
  tier,
  wave: 1,
  coinsEarned: 100,
  cellsEarned: 10,
  realTime: 60,
  runType: 'farm'
});

describe('filterRunsByTier', () => {
  it('should return all runs when selectedTier is null', () => {
    const runs = [
      mockRun('1', 1),
      mockRun('2', 2),
      mockRun('3', 3)
    ];

    const result = filterRunsByTier(runs, null);
    
    expect(result).toEqual(runs);
  });

  it('should filter runs by specific tier', () => {
    const runs = [
      mockRun('1', 1),
      mockRun('2', 2),
      mockRun('3', 1),
      mockRun('4', 3)
    ];

    const result = filterRunsByTier(runs, 1);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('3');
  });

  it('should return empty array when no runs match tier', () => {
    const runs = [
      mockRun('1', 1),
      mockRun('2', 2)
    ];

    const result = filterRunsByTier(runs, 5);
    
    expect(result).toEqual([]);
  });

  it('should handle empty runs array', () => {
    const result = filterRunsByTier([], 1);
    
    expect(result).toEqual([]);
  });
});

describe('getAvailableTiers', () => {
  it('should return unique tiers sorted in descending order', () => {
    const runs = [
      mockRun('1', 3),
      mockRun('2', 1),
      mockRun('3', 2),
      mockRun('4', 1),
      mockRun('5', 3)
    ];

    const result = getAvailableTiers(runs);
    
    expect(result).toEqual([3, 2, 1]);
  });

  it('should handle single tier', () => {
    const runs = [
      mockRun('1', 5),
      mockRun('2', 5)
    ];

    const result = getAvailableTiers(runs);
    
    expect(result).toEqual([5]);
  });

  it('should handle empty runs array', () => {
    const result = getAvailableTiers([]);
    
    expect(result).toEqual([]);
  });

  it('should handle runs with various tier orders', () => {
    const runs = [
      mockRun('1', 10),
      mockRun('2', 1),
      mockRun('3', 5)
    ];

    const result = getAvailableTiers(runs);
    
    expect(result).toEqual([10, 5, 1]);
  });
});