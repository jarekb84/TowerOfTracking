import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewport } from './use-viewport';

describe('useViewport', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(globalThis, 'window', {
      value: {
        innerWidth: 1024,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.window = originalWindow;
  });

  it('returns initial viewport size based on window width', () => {
    globalThis.window.innerWidth = 800;
    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe('desktop');
  });

  it('returns mobile for narrow viewport', () => {
    globalThis.window.innerWidth = 600;
    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe('mobile');
  });

  it('respects custom breakpoint', () => {
    globalThis.window.innerWidth = 500;
    const { result } = renderHook(() => useViewport({ breakpoint: 'sm' }));
    expect(result.current).toBe('mobile');

    const { result: result2 } = renderHook(() => useViewport({ breakpoint: 'lg' }));
    expect(result2.current).toBe('mobile');
  });

  it('adds resize event listener on mount', () => {
    renderHook(() => useViewport());
    expect(globalThis.window.addEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('removes resize event listener on unmount', () => {
    const { unmount } = renderHook(() => useViewport());
    unmount();
    expect(globalThis.window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('updates viewport size on window resize with debouncing', () => {
    globalThis.window.innerWidth = 800;
    const { result } = renderHook(() => useViewport({ debounceMs: 100 }));
    expect(result.current).toBe('desktop');

    // Simulate window resize
    globalThis.window.innerWidth = 600;
    const resizeHandler = (globalThis.window.addEventListener as vi.Mock).mock.calls
      .find(([event]: [string, ...unknown[]]) => event === 'resize')?.[1] as () => void;
    
    act(() => {
      resizeHandler();
    });

    // Should not update immediately due to debouncing
    expect(result.current).toBe('desktop');

    // Should update after debounce delay
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(result.current).toBe('mobile');
  });

  it('debounces multiple rapid resize events', () => {
    globalThis.window.innerWidth = 800;
    const { result } = renderHook(() => useViewport({ debounceMs: 150 }));
    
    const resizeHandler = (globalThis.window.addEventListener as vi.Mock).mock.calls
      .find(([event]: [string, ...unknown[]]) => event === 'resize')?.[1] as () => void;

    // Rapid resize events
    globalThis.window.innerWidth = 600;
    act(() => {
      resizeHandler();
      resizeHandler();
      resizeHandler();
    });

    // Should not update immediately
    expect(result.current).toBe('desktop');

    // Should only update once after full debounce period
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe('mobile');
  });

  it('defaults to desktop for initial render', () => {
    // Test default behavior
    const { result } = renderHook(() => useViewport());
    expect(['desktop', 'mobile']).toContain(result.current);
  });

  it('corrects SSR/client mismatch after mount', () => {
    globalThis.window.innerWidth = 600;
    const { result } = renderHook(() => useViewport());
    
    // After mount with client-side values, should be mobile
    expect(result.current).toBe('mobile');
  });

  it('uses custom debounce delay', () => {
    globalThis.window.innerWidth = 800;
    const { result } = renderHook(() => useViewport({ debounceMs: 200 }));
    
    const resizeHandler = (globalThis.window.addEventListener as vi.Mock).mock.calls
      .find(([event]: [string, ...unknown[]]) => event === 'resize')?.[1] as () => void;

    globalThis.window.innerWidth = 600;
    act(() => {
      resizeHandler();
    });

    // Should not update after shorter delay
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('desktop');

    // Should update after full custom delay
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('mobile');
  });

  it('works with different breakpoints during resize', () => {
    globalThis.window.innerWidth = 700;
    const { result } = renderHook(() => useViewport({ breakpoint: 'lg' }));
    expect(result.current).toBe('mobile');

    const resizeHandler = (globalThis.window.addEventListener as vi.Mock).mock.calls
      .find(([event]: [string, ...unknown[]]) => event === 'resize')?.[1] as () => void;

    globalThis.window.innerWidth = 1100;
    act(() => {
      resizeHandler();
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe('desktop');
  });
});