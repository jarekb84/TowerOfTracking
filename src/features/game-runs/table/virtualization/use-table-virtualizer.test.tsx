import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTableVirtualizer } from './use-table-virtualizer';
import type { Row } from '@tanstack/react-table';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

// Mock TanStack Virtual
const mockMeasureElement = vi.fn();
const mockGetVirtualItems = vi.fn(() => [
  { index: 0, start: 0, size: 52, key: 'row-0' },
  { index: 1, start: 52, size: 52, key: 'row-1' },
]);
const mockGetTotalSize = vi.fn(() => 104);

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: mockGetVirtualItems,
    getTotalSize: mockGetTotalSize,
    measureElement: mockMeasureElement,
  })),
}));

function createMockRow(id: string, isExpanded: boolean): Row<ParsedGameRun> {
  return {
    id,
    getIsExpanded: () => isExpanded,
  } as unknown as Row<ParsedGameRun>;
}

function createContainerRef() {
  const div = document.createElement('div');
  return { current: div };
}

describe('useTableVirtualizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return virtual items from the virtualizer', () => {
    const containerRef = createContainerRef();
    const rows = [createMockRow('row-0', false), createMockRow('row-1', false)];

    const { result } = renderHook(() =>
      useTableVirtualizer({
        containerRef,
        rows,
        variant: 'desktop',
      })
    );

    expect(result.current.virtualItems).toHaveLength(2);
    expect(result.current.virtualItems[0].index).toBe(0);
    expect(result.current.virtualItems[1].index).toBe(1);
  });

  it('should return total size from the virtualizer', () => {
    const containerRef = createContainerRef();
    const rows = [createMockRow('row-0', false), createMockRow('row-1', false)];

    const { result } = renderHook(() =>
      useTableVirtualizer({
        containerRef,
        rows,
        variant: 'desktop',
      })
    );

    expect(result.current.totalSize).toBe(104);
  });

  it('should return measureElement function', () => {
    const containerRef = createContainerRef();
    const rows = [createMockRow('row-0', false)];

    const { result } = renderHook(() =>
      useTableVirtualizer({
        containerRef,
        rows,
        variant: 'desktop',
      })
    );

    expect(typeof result.current.measureElement).toBe('function');
  });

  describe('variant handling', () => {
    it('should work with desktop variant', () => {
      const containerRef = createContainerRef();
      const rows = [createMockRow('row-0', false)];

      const { result } = renderHook(() =>
        useTableVirtualizer({
          containerRef,
          rows,
          variant: 'desktop',
        })
      );

      expect(result.current.virtualItems).toBeDefined();
    });

    it('should work with mobile variant', () => {
      const containerRef = createContainerRef();
      const rows = [createMockRow('row-0', false)];

      const { result } = renderHook(() =>
        useTableVirtualizer({
          containerRef,
          rows,
          variant: 'mobile',
        })
      );

      expect(result.current.virtualItems).toBeDefined();
    });
  });

  describe('empty rows handling', () => {
    it('should handle empty rows array', () => {
      const containerRef = createContainerRef();
      mockGetVirtualItems.mockReturnValueOnce([]);
      mockGetTotalSize.mockReturnValueOnce(0);

      const { result } = renderHook(() =>
        useTableVirtualizer({
          containerRef,
          rows: [],
          variant: 'desktop',
        })
      );

      expect(result.current.virtualItems).toEqual([]);
      expect(result.current.totalSize).toBe(0);
    });
  });
});
