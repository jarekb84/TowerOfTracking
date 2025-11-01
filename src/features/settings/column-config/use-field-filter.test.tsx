// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFieldFilter } from './use-field-filter';
import type { FieldTrendData } from '@/features/analysis/tier-trends/types';

// Mock field trend data for testing
const mockTrends: FieldTrendData[] = [
  {
    fieldName: 'wave',
    displayName: 'Wave',
    dataType: 'number',
    values: [100, 120, 140],
    change: { absolute: 40, percent: 40, direction: 'up' },
    trendType: 'upward',
    significance: 'medium'
  },
  {
    fieldName: 'coinsEarned',
    displayName: 'Coins Earned', 
    dataType: 'number',
    values: [1000, 2000, 3000],
    change: { absolute: 2000, percent: 200, direction: 'up' },
    trendType: 'upward',
    significance: 'high'
  },
  {
    fieldName: 'timeElapsed',
    displayName: 'Time Elapsed',
    dataType: 'duration',
    values: [300, 280, 260],
    change: { absolute: -40, percent: -13.3, direction: 'down' },
    trendType: 'downward', 
    significance: 'low'
  }
];

describe('useFieldFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should return all trends when no search term', () => {
    const { result } = renderHook(() => useFieldFilter(mockTrends));

    expect(result.current.searchTerm).toBe('');
    expect(result.current.debouncedSearchTerm).toBe('');
    expect(result.current.isSearchActive).toBe(false);
    expect(result.current.filteredTrends).toEqual(mockTrends);
    expect(result.current.hasMatches).toBe(true);
  });

  it('should update searchTerm immediately', () => {
    const { result } = renderHook(() => useFieldFilter(mockTrends));

    act(() => {
      result.current.handleSearchChange('wave');
    });

    expect(result.current.searchTerm).toBe('wave');
    expect(result.current.debouncedSearchTerm).toBe(''); // Not debounced yet
  });

  it('should debounce searchTerm updates', () => {
    const { result } = renderHook(() => useFieldFilter(mockTrends));

    act(() => {
      result.current.handleSearchChange('coin');
    });

    // Immediately after - debounced term should still be empty
    expect(result.current.debouncedSearchTerm).toBe('');
    expect(result.current.isSearchActive).toBe(false);

    // After default 200ms delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.debouncedSearchTerm).toBe('coin');
    expect(result.current.isSearchActive).toBe(true);
  });

  it('should filter trends based on debounced search', () => {
    const { result } = renderHook(() => useFieldFilter(mockTrends));

    act(() => {
      result.current.handleSearchChange('coin');
    });

    // Before debounce - shows all trends
    expect(result.current.filteredTrends).toEqual(mockTrends);

    // After debounce - filters to matching trends
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.filteredTrends).toHaveLength(1);
    expect(result.current.filteredTrends[0].fieldName).toBe('coinsEarned');
  });

  it('should clear search term and reset filtering', () => {
    const { result } = renderHook(() => useFieldFilter(mockTrends));

    // Set a search term
    act(() => {
      result.current.handleSearchChange('wave');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.searchTerm).toBe('wave');
    expect(result.current.debouncedSearchTerm).toBe('wave');

    // Clear search
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchTerm).toBe('');

    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.debouncedSearchTerm).toBe('');
    expect(result.current.isSearchActive).toBe(false);
    expect(result.current.filteredTrends).toEqual(mockTrends);
  });

  it('should handle custom debounce delay', () => {
    const { result } = renderHook(() => 
      useFieldFilter(mockTrends, { debounceMs: 500 })
    );

    act(() => {
      result.current.handleSearchChange('test');
    });

    // After 200ms (default delay) - should not be debounced
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debouncedSearchTerm).toBe('');

    // After 500ms total - should be debounced
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedSearchTerm).toBe('test');
  });

  it('should handle no matches correctly', () => {
    const { result } = renderHook(() => useFieldFilter(mockTrends));

    act(() => {
      result.current.handleSearchChange('nonexistent');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.filteredTrends).toHaveLength(0);
    expect(result.current.hasMatches).toBe(false);
    expect(result.current.isSearchActive).toBe(true);
  });

  it('should handle empty trends array', () => {
    const { result } = renderHook(() => useFieldFilter([]));

    expect(result.current.filteredTrends).toEqual([]);
    expect(result.current.hasMatches).toBe(false);

    act(() => {
      result.current.handleSearchChange('test');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.filteredTrends).toEqual([]);
    expect(result.current.hasMatches).toBe(false);
  });
});