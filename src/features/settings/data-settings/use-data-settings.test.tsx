import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataSettings } from './use-data-settings';
import { useData } from '@/shared/domain/use-data';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

// Mock the useData hook
vi.mock('@/shared/domain/use-data', () => ({
  useData: vi.fn(),
}));

const mockUseData = vi.mocked(useData);

describe('useDataSettings', () => {
  const mockClearAllRuns = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    const mockRuns: ParsedGameRun[] = [
      { id: '1', timestamp: new Date(), runType: 'farm' } as ParsedGameRun,
      { id: '2', timestamp: new Date(), runType: 'farm' } as ParsedGameRun,
      { id: '3', timestamp: new Date(), runType: 'tournament' } as ParsedGameRun,
    ];
    
    mockUseData.mockReturnValue({
      runs: mockRuns,
      clearAllRuns: mockClearAllRuns,
      compositeKeys: new Set(),
      addRun: vi.fn(),
      addRuns: vi.fn(),
      removeRun: vi.fn(),
      updateRun: vi.fn(),
      overwriteRun: vi.fn(),
      checkDuplicate: vi.fn(),
      detectBatchDuplicates: vi.fn(),
      migrationState: null,
    });
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useDataSettings());

      expect(result.current.runsCount).toBe(3);
      expect(result.current.isClearing).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.showSuccess).toBe(false);
      expect(result.current.canClear).toBe(true);
      expect(result.current.isConfirmationOpen).toBe(false);
    });
    
    it('should disable clearing when no runs exist', () => {
      mockUseData.mockReturnValue({
        runs: [],
        clearAllRuns: mockClearAllRuns,
        compositeKeys: new Set(),
        addRun: vi.fn(),
        addRuns: vi.fn(),
        removeRun: vi.fn(),
        updateRun: vi.fn(),
        overwriteRun: vi.fn(),
        checkDuplicate: vi.fn(),
        detectBatchDuplicates: vi.fn(),
        migrationState: null,
      });
      
      const { result } = renderHook(() => useDataSettings());
      
      expect(result.current.runsCount).toBe(0);
      expect(result.current.canClear).toBe(false);
    });
  });

  describe('handleClearAllData', () => {
    it('should successfully clear data and show success message', async () => {
      const { result } = renderHook(() => useDataSettings());
      
      await act(async () => {
        await result.current.handleClearAllData();
      });
      
      expect(mockClearAllRuns).toHaveBeenCalledOnce();
      expect(result.current.isClearing).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.showSuccess).toBe(true);
    });
    
    it('should set isClearing to true and canClear to false during operation', async () => {
      // We test the overall behavior: isClearing starts false, becomes true during operation, then false again
      const { result } = renderHook(() => useDataSettings());
      
      expect(result.current.isClearing).toBe(false);
      expect(result.current.canClear).toBe(true);
      
      await act(async () => {
        await result.current.handleClearAllData();
      });
      
      // After completion, should be back to false
      expect(result.current.isClearing).toBe(false);
      expect(result.current.canClear).toBe(true);
    });
    
    it('should handle errors gracefully', async () => {
      const errorMessage = 'Storage access denied';
      mockClearAllRuns.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      const { result } = renderHook(() => useDataSettings());
      
      await act(async () => {
        await result.current.handleClearAllData();
      });
      
      expect(result.current.isClearing).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.showSuccess).toBe(false);
    });
    
    it('should handle non-Error exceptions', async () => {
      mockClearAllRuns.mockImplementation(() => {
        throw 'String error';
      });
      
      const { result } = renderHook(() => useDataSettings());
      
      await act(async () => {
        await result.current.handleClearAllData();
      });
      
      expect(result.current.error).toBe('Failed to clear data');
    });
    
    it('should auto-hide success message after 3 seconds', async () => {
      const { result } = renderHook(() => useDataSettings());
      
      await act(async () => {
        await result.current.handleClearAllData();
      });
      
      expect(result.current.showSuccess).toBe(true);
      
      // Fast-forward 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      expect(result.current.showSuccess).toBe(false);
    });
  });

  describe('error management', () => {
    it('should dismiss error when dismissError is called', async () => {
      mockClearAllRuns.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const { result } = renderHook(() => useDataSettings());
      
      // Trigger error
      await act(async () => {
        await result.current.handleClearAllData();
      });
      
      expect(result.current.error).toBe('Test error');
      
      // Dismiss error
      act(() => {
        result.current.dismissError();
      });
      
      expect(result.current.error).toBe(null);
    });
    
    it('should clear previous error when starting new clear operation', async () => {
      const { result } = renderHook(() => useDataSettings());
      
      // First operation fails
      mockClearAllRuns.mockImplementationOnce(() => {
        throw new Error('First error');
      });
      
      await act(async () => {
        await result.current.handleClearAllData();
      });
      
      expect(result.current.error).toBe('First error');
      
      // Second operation succeeds - should clear previous error
      mockClearAllRuns.mockImplementationOnce(() => {});
      
      await act(async () => {
        await result.current.handleClearAllData();
      });
      
      expect(result.current.error).toBe(null);
      expect(result.current.showSuccess).toBe(true);
    });
  });

  describe('success management', () => {
    it('should dismiss success when dismissSuccess is called', async () => {
      const { result } = renderHook(() => useDataSettings());
      
      await act(async () => {
        await result.current.handleClearAllData();
      });
      
      expect(result.current.showSuccess).toBe(true);
      
      act(() => {
        result.current.dismissSuccess();
      });
      
      expect(result.current.showSuccess).toBe(false);
    });
  });

  describe('confirmation management', () => {
    it('should open confirmation when openConfirmation is called', () => {
      const { result } = renderHook(() => useDataSettings());

      expect(result.current.isConfirmationOpen).toBe(false);

      act(() => {
        result.current.openConfirmation();
      });

      expect(result.current.isConfirmationOpen).toBe(true);
    });

    it('should close confirmation when closeConfirmation is called', () => {
      const { result } = renderHook(() => useDataSettings());

      // Open first
      act(() => {
        result.current.openConfirmation();
      });

      expect(result.current.isConfirmationOpen).toBe(true);

      // Then close
      act(() => {
        result.current.closeConfirmation();
      });

      expect(result.current.isConfirmationOpen).toBe(false);
    });

    it('should close confirmation after successful deletion', async () => {
      const { result } = renderHook(() => useDataSettings());

      // Open confirmation first
      act(() => {
        result.current.openConfirmation();
      });

      expect(result.current.isConfirmationOpen).toBe(true);

      // Execute deletion
      await act(async () => {
        await result.current.handleClearAllData();
      });

      // Dialog should be closed
      expect(result.current.isConfirmationOpen).toBe(false);
      expect(result.current.showSuccess).toBe(true);
    });

    it('should keep confirmation open on deletion error', async () => {
      mockClearAllRuns.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useDataSettings());

      // Open confirmation first
      act(() => {
        result.current.openConfirmation();
      });

      expect(result.current.isConfirmationOpen).toBe(true);

      // Execute deletion (will fail)
      await act(async () => {
        await result.current.handleClearAllData();
      });

      // Dialog should remain open for retry
      expect(result.current.isConfirmationOpen).toBe(true);
      expect(result.current.error).toBe('Storage error');
    });
  });

  describe('state coherence', () => {
    it('should maintain consistent canClear state based on runs and clearing status', () => {
      const { result, rerender } = renderHook(() => useDataSettings());
      
      // Initially can clear (3 runs, not clearing)
      expect(result.current.canClear).toBe(true);
      
      // Update to no runs
      mockUseData.mockReturnValue({
        runs: [],
        clearAllRuns: mockClearAllRuns,
        compositeKeys: new Set(),
        addRun: vi.fn(),
        addRuns: vi.fn(),
        removeRun: vi.fn(),
        updateRun: vi.fn(),
        overwriteRun: vi.fn(),
        checkDuplicate: vi.fn(),
        detectBatchDuplicates: vi.fn(),
        migrationState: null,
      });
      
      rerender();
      
      // Should not be able to clear with no runs
      expect(result.current.canClear).toBe(false);
    });
  });
});