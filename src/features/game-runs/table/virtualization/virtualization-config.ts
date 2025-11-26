/**
 * Configuration constants for table virtualization.
 * These values are used to estimate row heights before measurement.
 */

const VIRTUALIZATION_CONFIG = {
  desktop: {
    /** Estimated height of a collapsed table row in pixels */
    collapsedRowHeight: 52,
    /** Estimated height of an expanded table row in pixels (will be measured dynamically) */
    expandedRowHeight: 400,
    /** Number of rows to render outside the visible area for smooth scrolling */
    overscan: 5,
  },
  mobile: {
    /** Estimated height of a collapsed card in pixels */
    collapsedCardHeight: 180,
    /** Estimated height of an expanded card in pixels (will be measured dynamically) */
    expandedCardHeight: 500,
    /** Number of cards to render outside the visible area */
    overscan: 3,
  },
} as const;

export type VirtualizationVariant = 'desktop' | 'mobile';

/**
 * Get the estimated row height based on variant and expansion state.
 */
export function getEstimatedRowHeight(
  variant: VirtualizationVariant,
  isExpanded: boolean
): number {
  if (variant === 'desktop') {
    const config = VIRTUALIZATION_CONFIG.desktop;
    return isExpanded ? config.expandedRowHeight : config.collapsedRowHeight;
  }
  const config = VIRTUALIZATION_CONFIG.mobile;
  return isExpanded ? config.expandedCardHeight : config.collapsedCardHeight;
}

/**
 * Get the overscan count for a variant.
 */
export function getOverscan(variant: VirtualizationVariant): number {
  return VIRTUALIZATION_CONFIG[variant].overscan;
}
