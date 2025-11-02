import { useState, useEffect } from 'react';
import { getViewportSize, debounce, type ViewportSize, type Breakpoint } from '../utils/viewport';

interface UseViewportOptions {
  /** Breakpoint for desktop/mobile transition (default: 'md') */
  breakpoint?: Breakpoint;
  /** Debounce delay in milliseconds for resize events (default: 150) */
  debounceMs?: number;
}

/**
 * Hook for detecting viewport size and handling responsive rendering
 * Returns current viewport size and automatically updates on window resize
 * 
 * @param options Configuration for breakpoint and debounce timing
 * @returns Current viewport size ('desktop' | 'mobile')
 */
export function useViewport({ 
  breakpoint = 'md', 
  debounceMs = 150 
}: UseViewportOptions = {}): ViewportSize {
  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => {
    return getViewportSize(breakpoint);
  });

  useEffect(() => {
    const handleResize = debounce(() => {
      const newSize = getViewportSize(breakpoint);
      setViewportSize(newSize);
    }, debounceMs);

    // Only add event listener in browser environment
    if (typeof window !== 'undefined') {
      const resizeHandler = handleResize as EventListener;
      window.addEventListener('resize', resizeHandler);
      
      // Set initial size after mount to handle SSR/client mismatch
      const initialSize = getViewportSize(breakpoint);
      if (initialSize !== viewportSize) {
        setViewportSize(initialSize);
      }
      
      return () => {
        window.removeEventListener('resize', resizeHandler);
      };
    }
  }, [breakpoint, debounceMs]);

  return viewportSize;
}