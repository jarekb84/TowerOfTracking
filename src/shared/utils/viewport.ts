/**
 * Viewport detection utilities for responsive rendering
 */

export type ViewportSize = 'mobile' | 'desktop';
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Breakpoint pixel values matching Tailwind CSS defaults
 */
export const BREAKPOINT_VALUES: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/**
 * Determines if the current window width is above the specified breakpoint
 */
export function isDesktopViewport(breakpoint: Breakpoint = 'md'): boolean {
  if (typeof window === 'undefined') {
    return true; // Default to desktop for SSR
  }
  
  return window.innerWidth >= BREAKPOINT_VALUES[breakpoint];
}

/**
 * Gets the current viewport size based on breakpoint
 */
export function getViewportSize(breakpoint: Breakpoint = 'md'): ViewportSize {
  return isDesktopViewport(breakpoint) ? 'desktop' : 'mobile';
}

/**
 * Creates a debounced function that delays execution until after delay milliseconds 
 * have elapsed since its last invocation
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  }) as T;
}