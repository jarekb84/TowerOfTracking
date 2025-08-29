/**
 * Responsive table behavior patterns for consistent mobile/desktop switching
 * 
 * This module defines the architectural pattern for components that need
 * to switch between table view (desktop) and card view (mobile).
 * Extract when this pattern appears for the 3rd time.
 */

export interface ResponsiveTableConfig {
  /** CSS breakpoint for switching between mobile/desktop (default: 'md') */
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show table headers on desktop (default: true) */
  showHeaders?: boolean;
  /** Container padding for mobile view (default: 'p-4') */
  mobilePadding?: string;
  /** Gap between mobile cards (default: 'space-y-4') */
  cardSpacing?: string;
}

export const DEFAULT_RESPONSIVE_CONFIG: ResponsiveTableConfig = {
  breakpoint: 'md',
  showHeaders: true,
  mobilePadding: 'p-4',
  cardSpacing: 'space-y-4',
};

/**
 * Generates CSS classes for responsive table/card switching
 */
export function getResponsiveTableClasses(config: ResponsiveTableConfig = DEFAULT_RESPONSIVE_CONFIG) {
  const { breakpoint } = config;
  
  return {
    desktopTable: `hidden ${breakpoint}:table`,
    mobileContainer: `${breakpoint}:hidden ${config.cardSpacing} ${config.mobilePadding}`,
    desktopTableGroup: `hidden ${breakpoint}:table-row-group`,
  };
}

/**
 * Pattern documentation for future implementations:
 * 
 * 1. Create mobile card component for data display
 * 2. Use ResponsiveTable pattern in container component  
 * 3. Apply getResponsiveTableClasses() for consistent behavior
 * 4. Extract data transformation logic to separate utils
 * 5. Test both mobile and desktop views
 * 
 * Example usage:
 * ```tsx
 * const classes = getResponsiveTableClasses({ breakpoint: 'lg' });
 * return (
 *   <>
 *     <table className={classes.desktopTable}>
 *       <DesktopTableContent />
 *     </table>
 *     <div className={classes.mobileContainer}>
 *       <MobileCardContent />
 *     </div>
 *   </>
 * );
 * ```
 */