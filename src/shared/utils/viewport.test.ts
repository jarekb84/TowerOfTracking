import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isDesktopViewport, getViewportSize, debounce, BREAKPOINT_VALUES, type Breakpoint } from './viewport';

describe('viewport utilities', () => {
  describe('isDesktopViewport', () => {
    const originalWindow = globalThis.window;

    beforeEach(() => {
      // Mock window.innerWidth
      Object.defineProperty(globalThis, 'window', {
        value: {
          innerWidth: 1024,
        },
        writable: true,
      });
    });

    afterEach(() => {
      globalThis.window = originalWindow;
    });

    it('returns true for desktop width on default breakpoint (md)', () => {
      globalThis.window.innerWidth = 800;
      expect(isDesktopViewport()).toBe(true);
    });

    it('returns false for mobile width on default breakpoint (md)', () => {
      globalThis.window.innerWidth = 600;
      expect(isDesktopViewport()).toBe(false);
    });

    it('respects custom breakpoint', () => {
      globalThis.window.innerWidth = 500;
      expect(isDesktopViewport('sm')).toBe(false);

      globalThis.window.innerWidth = 700;
      expect(isDesktopViewport('sm')).toBe(true);
    });

    it('returns true when window is undefined (SSR)', () => {
      const originalWindow = globalThis.window;
      delete (globalThis as Record<string, unknown>).window;
      expect(isDesktopViewport()).toBe(true);
      globalThis.window = originalWindow;
    });

    it('works with all defined breakpoints', () => {
      Object.entries(BREAKPOINT_VALUES).forEach(([breakpoint, value]) => {
        globalThis.window.innerWidth = value;
        expect(isDesktopViewport(breakpoint as Breakpoint)).toBe(true);

        globalThis.window.innerWidth = value - 1;
        expect(isDesktopViewport(breakpoint as Breakpoint)).toBe(false);
      });
    });
  });

  describe('getViewportSize', () => {
    const originalWindow = globalThis.window;

    beforeEach(() => {
      Object.defineProperty(globalThis, 'window', {
        value: {
          innerWidth: 1024,
        },
        writable: true,
      });
    });

    afterEach(() => {
      globalThis.window = originalWindow;
    });

    it('returns desktop for wide viewport', () => {
      globalThis.window.innerWidth = 800;
      expect(getViewportSize()).toBe('desktop');
    });

    it('returns mobile for narrow viewport', () => {
      globalThis.window.innerWidth = 600;
      expect(getViewportSize()).toBe('mobile');
    });

    it('respects custom breakpoint', () => {
      globalThis.window.innerWidth = 500;
      expect(getViewportSize('lg')).toBe('mobile');

      globalThis.window.innerWidth = 1100;
      expect(getViewportSize('lg')).toBe('desktop');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('delays function execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous calls when called rapidly', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments correctly', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('works with different delay times', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 200);

      debouncedFn();
      vi.advanceTimersByTime(100);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('handles multiple separate debounced functions', () => {
      const mockFn1 = vi.fn();
      const mockFn2 = vi.fn();
      const debouncedFn1 = debounce(mockFn1, 100);
      const debouncedFn2 = debounce(mockFn2, 50);

      debouncedFn1();
      debouncedFn2();

      vi.advanceTimersByTime(50);
      expect(mockFn1).not.toHaveBeenCalled();
      expect(mockFn2).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(50);
      expect(mockFn1).toHaveBeenCalledTimes(1);
    });
  });

  describe('BREAKPOINT_VALUES', () => {
    it('contains all expected breakpoints with correct values', () => {
      expect(BREAKPOINT_VALUES).toEqual({
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
      });
    });
  });
});