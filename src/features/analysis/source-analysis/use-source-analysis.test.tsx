/**
 * Tests for Source Analysis View State Hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { useSourceAnalysis } from './use-source-analysis';
import { SourceDuration, getDefaultRunTypeForCategory } from './types';

// Test fixtures
function createMockRun(
  id: string,
  timestamp: Date,
  fields: Record<string, number>,
  tier = 11,
  runType: 'farm' | 'tournament' = 'farm'
): ParsedGameRun {
  const runFields: Record<string, { value: number; rawValue: string; displayValue: string; originalKey: string; dataType: 'number' }> = {};

  for (const [key, value] of Object.entries(fields)) {
    runFields[key] = {
      value,
      rawValue: String(value),
      displayValue: String(value),
      originalKey: key,
      dataType: 'number'
    };
  }

  return {
    id,
    timestamp,
    fields: runFields,
    tier,
    wave: 1000,
    coinsEarned: 100000,
    cellsEarned: 50,
    realTime: 3600,
    runType
  };
}

const mockRuns: ParsedGameRun[] = [
  createMockRun('1', new Date('2024-03-15'), { orbDamage: 600, thornDamage: 400 }, 11, 'farm'),
  createMockRun('2', new Date('2024-03-16'), { orbDamage: 700, thornDamage: 300 }, 11, 'tournament'),
  createMockRun('3', new Date('2024-03-17'), { orbDamage: 500, thornDamage: 500 }, 12, 'farm'),
];

describe('useSourceAnalysis', () => {
  describe('initialization', () => {
    it('initializes with default filters', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      expect(result.current.filters.category).toBe('damageDealt');
      expect(result.current.filters.runType).toBe('tournament'); // Default for damageDealt
      expect(result.current.filters.tier).toBe('all');
      expect(result.current.filters.duration).toBe(SourceDuration.PER_RUN);
      expect(result.current.filters.quantity).toBe(10);
    });

    it('accepts initial filter overrides', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({
          runs: mockRuns,
          initialFilters: { category: 'coinIncome', tier: 11 }
        })
      );

      expect(result.current.filters.category).toBe('coinIncome');
      expect(result.current.filters.tier).toBe(11);
      expect(result.current.filters.runType).toBe('tournament'); // Default preserved from DEFAULT_FILTERS
    });
  });

  describe('filter updates', () => {
    it('updates category filter and sets default run type', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      // Starting with damageDealt → tournament
      expect(result.current.filters.category).toBe('damageDealt');
      expect(result.current.filters.runType).toBe('tournament');

      act(() => {
        result.current.setCategory('coinIncome');
      });

      // Switching to coinIncome → farm
      expect(result.current.filters.category).toBe('coinIncome');
      expect(result.current.filters.runType).toBe('farm');
    });

    it('switches run type when toggling between categories', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      // Toggle to coinIncome
      act(() => {
        result.current.setCategory('coinIncome');
      });
      expect(result.current.filters.runType).toBe('farm');

      // Toggle back to damageDealt
      act(() => {
        result.current.setCategory('damageDealt');
      });
      expect(result.current.filters.runType).toBe('tournament');
    });

    it('updates run type filter independently', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      // Can still manually change run type
      act(() => {
        result.current.setRunType('all');
      });

      expect(result.current.filters.runType).toBe('all');
    });

    it('updates tier filter', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      act(() => {
        result.current.setTier(11);
      });

      expect(result.current.filters.tier).toBe(11);
    });

    it('updates duration filter', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      act(() => {
        result.current.setDuration(SourceDuration.DAILY);
      });

      expect(result.current.filters.duration).toBe(SourceDuration.DAILY);
    });

    it('updates quantity filter with bounds', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      act(() => {
        result.current.setQuantity(5);
      });
      expect(result.current.filters.quantity).toBe(5);

      act(() => {
        result.current.setQuantity(0);
      });
      expect(result.current.filters.quantity).toBe(1); // Minimum is 1

      act(() => {
        result.current.setQuantity(100);
      });
      expect(result.current.filters.quantity).toBe(50); // Maximum is 50
    });
  });

  describe('analysis data', () => {
    it('returns null when runs are empty', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: [] })
      );

      expect(result.current.analysisData).toBeNull();
      expect(result.current.hasData).toBe(false);
    });

    it('calculates analysis data when runs exist', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      expect(result.current.analysisData).not.toBeNull();
      expect(result.current.hasData).toBe(true);
      expect(result.current.analysisData?.periods.length).toBeGreaterThan(0);
    });

    it('recalculates when filters change', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      const initialPeriodCount = result.current.analysisData?.periods.length;

      act(() => {
        result.current.setTier(11);
      });

      // Should have fewer periods with tier filter
      const filteredPeriodCount = result.current.analysisData?.periods.length;
      expect(filteredPeriodCount).toBeLessThanOrEqual(initialPeriodCount || 0);
    });
  });

  describe('highlight state', () => {
    it('initializes with no highlight', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      expect(result.current.highlightedSource).toBeNull();
    });

    it('sets highlighted source', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      act(() => {
        result.current.setHighlightedSource('orbDamage');
      });

      expect(result.current.highlightedSource).toBe('orbDamage');
    });

    it('clears highlighted source', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      act(() => {
        result.current.setHighlightedSource('orbDamage');
      });

      act(() => {
        result.current.setHighlightedSource(null);
      });

      expect(result.current.highlightedSource).toBeNull();
    });
  });

  describe('available tiers', () => {
    it('extracts unique tiers from runs', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      expect(result.current.availableTiers).toEqual([11, 12]);
    });

    it('returns empty array when no runs', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: [] })
      );

      expect(result.current.availableTiers).toEqual([]);
    });
  });

  describe('isLoading', () => {
    it('is always false for synchronous calculations', () => {
      const { result } = renderHook(() =>
        useSourceAnalysis({ runs: mockRuns })
      );

      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('getDefaultRunTypeForCategory', () => {
  it('returns tournament for damageDealt category', () => {
    expect(getDefaultRunTypeForCategory('damageDealt')).toBe('tournament');
  });

  it('returns farm for coinIncome category', () => {
    expect(getDefaultRunTypeForCategory('coinIncome')).toBe('farm');
  });
});
