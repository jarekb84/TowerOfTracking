/**
 * Form Field Layout Types
 *
 * Shared styling types for form controls and selector components.
 * These are UI-layer concerns used across multiple domain selectors.
 */

/**
 * Available accent colors for selector components
 * Provides visual theming for different feature areas
 */
type AccentColor = 'orange' | 'purple' | 'cyan'

/**
 * Layout direction for selector label placement
 * - 'horizontal': Label and control on same row
 * - 'vertical': Label above control
 * - 'auto': Vertical on mobile, horizontal on desktop
 */
export type SelectorLayout = 'horizontal' | 'vertical' | 'auto'

/**
 * Common styling props shared across all selector components
 * Provides consistent visual configuration options
 */
export interface SelectorStyleProps {
  /** Optional className for the wrapper */
  className?: string
  /** Accent color theme. Defaults to 'orange'. */
  accentColor?: AccentColor
  /** Label layout direction. Defaults to 'auto' (horizontal on desktop, vertical on mobile). */
  layout?: SelectorLayout
}
