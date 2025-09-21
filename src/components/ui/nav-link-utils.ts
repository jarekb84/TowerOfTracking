/**
 * Utility functions for navigation links
 */

/**
 * Determines if a given URL is external (starts with http:// or https://)
 * @param url - The URL to check
 * @returns true if the URL is external, false otherwise
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Creates the base CSS classes for navigation links
 * @param customClassName - Additional CSS classes to apply
 * @returns Combined CSS class string
 */
export function createNavLinkClassName(customClassName?: string): string {
  const baseClasses = [
    // Base styles - subtle and harmonious
    "group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-out",
    // Unselected state - subtle presence
    "text-slate-300 hover:text-slate-100",
    // Enhanced hover states with subtle background coordination
    "hover:bg-slate-800/60 hover:shadow-sm",
    // Enhanced focus styles for accessibility and keyboard navigation
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:bg-slate-800/60",
    // Subtle border enhancement on hover with smooth transition
    "hover:border-l-2 hover:border-slate-600/50 hover:pl-2.5",
    // Improved hover state for external links
    "has-[svg]:hover:border-orange-500/30",
    // Skip link support for screen readers
    "focus:z-10"
  ]

  return customClassName ? [...baseClasses, customClassName].join(' ') : baseClasses.join(' ')
}

/**
 * Creates the active state CSS classes for internal navigation links
 * @returns CSS class string for active state
 */
export function createActiveNavLinkClassName(): string {
  return [
    // Selected state - noticeable but not overwhelming
    "bg-orange-500/15 text-orange-100 border-l-2 border-orange-400/80 pl-2.5",
    // Coordinated hover state for selected items
    "hover:bg-orange-500/20 hover:border-orange-400",
    // Enhanced focus for active items
    "focus-visible:ring-orange-300 focus-visible:bg-orange-500/20",
    // Subtle shadow enhancement for selected state
    "shadow-sm shadow-orange-500/10",
    // Screen reader indication
    "aria-current:page"
  ].join(' ')
}