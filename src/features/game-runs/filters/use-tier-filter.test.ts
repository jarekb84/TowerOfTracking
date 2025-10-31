import { describe, it, expect } from 'vitest';
import { filterRunsByTier, getAvailableTiers } from './tier-filter-logic';
import type { ParsedGameRun } from '../../data-tracking/types/game-run.types';

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

describe('useTierFilter logic integration', () => {
  it('should properly integrate with filterRunsByTier function', () => {
    const runs = [
      mockRun('1', 1),
      mockRun('2', 2),
      mockRun('3', 1)
    ];

    // Test direct function usage
    const filteredRuns = filterRunsByTier(runs, 1);
    expect(filteredRuns).toHaveLength(2);
    expect(filteredRuns.every(run => run.tier === 1)).toBe(true);
  });

  it('should properly integrate with getAvailableTiers function', () => {
    const runs = [
      mockRun('1', 3),
      mockRun('2', 1),
      mockRun('3', 2),
      mockRun('4', 1)
    ];

    // Test direct function usage
    const availableTiers = getAvailableTiers(runs);
    expect(availableTiers).toEqual([3, 2, 1]);
  });

  it('should handle empty runs array correctly', () => {
    const runs: ParsedGameRun[] = [];
    
    const filteredRuns = filterRunsByTier(runs, 1);
    expect(filteredRuns).toEqual([]);
    
    const availableTiers = getAvailableTiers(runs);
    expect(availableTiers).toEqual([]);
  });

  it('should handle single tier scenario', () => {
    const runs = [mockRun('1', 5), mockRun('2', 5)];
    
    const availableTiers = getAvailableTiers(runs);
    expect(availableTiers).toEqual([5]);
    
    // Filter should show all runs when tier matches
    const filteredRuns = filterRunsByTier(runs, 5);
    expect(filteredRuns).toEqual(runs);
    
    // Filter should show empty when tier doesn't match
    const noMatchRuns = filterRunsByTier(runs, 1);
    expect(noMatchRuns).toEqual([]);
  });

  it('should handle null tier selection correctly', () => {
    const runs = [mockRun('1', 1), mockRun('2', 2)];
    
    const filteredRuns = filterRunsByTier(runs, null);
    expect(filteredRuns).toEqual(runs);
  });

  it('should return consistent results for tier sorting', () => {
    const runs = [
      mockRun('1', 10),
      mockRun('2', 1),
      mockRun('3', 5),
      mockRun('4', 2)
    ];
    
    const availableTiers = getAvailableTiers(runs);
    expect(availableTiers).toEqual([10, 5, 2, 1]);
  });
});

// Test hook-specific behavior without rendering
describe('useTierFilter hook behavior', () => {
  it('should determine when filter should be shown', () => {
    const runsWithMultipleTiers = [mockRun('1', 1), mockRun('2', 2)];
    const availableTiers = getAvailableTiers(runsWithMultipleTiers);
    const shouldShow = availableTiers.length > 1;
    expect(shouldShow).toBe(true);

    const runsWithSingleTier = [mockRun('1', 1), mockRun('2', 1)];
    const singleTierAvailable = getAvailableTiers(runsWithSingleTier);
    const shouldShowSingle = singleTierAvailable.length > 1;
    expect(shouldShowSingle).toBe(false);
  });

  it('should handle filter state transitions correctly', () => {
    const runs = [
      mockRun('1', 1),
      mockRun('2', 2),
      mockRun('3', 1)
    ];

    // Initially show all runs (null selection)
    let filteredRuns = filterRunsByTier(runs, null);
    expect(filteredRuns).toEqual(runs);

    // Filter by tier 1
    filteredRuns = filterRunsByTier(runs, 1);
    expect(filteredRuns).toHaveLength(2);
    expect(filteredRuns.every(run => run.tier === 1)).toBe(true);

    // Back to showing all runs
    filteredRuns = filterRunsByTier(runs, null);
    expect(filteredRuns).toEqual(runs);
  });
});