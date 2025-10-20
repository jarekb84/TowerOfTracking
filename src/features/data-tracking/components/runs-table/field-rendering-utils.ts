import { cn } from '../../../../shared/lib/utils';
import type { FieldDisplayConfig } from './field-display-config';

/**
 * Build container class name based on field display configuration
 */
export function buildContainerClassName(config: FieldDisplayConfig): string {
  // Full-width fields (like notes) get distinct styling
  if (config.fullWidth) {
    return cn(
      // Base container styles for full-width fields
      'flex p-4 bg-muted/10 rounded-lg border border-border/30',
      'transition-colors duration-200',

      // Full width span
      config.containerClassName || 'col-span-2',

      // Alignment for full-width content
      config.leftAlignValue ? 'justify-start items-start' : 'justify-between items-center',
    );
  }

  // Standard grid fields maintain existing interactive styling
  return cn(
    // Base styles for grid fields
    'flex items-center p-3 bg-muted/15 rounded-md border border-border/20',
    'transition-all duration-200 hover:bg-muted/25 hover:border-accent/30 hover:shadow-sm',

    // Justification
    'justify-between',
  );
}

/**
 * Build value class name based on field display configuration
 */
export function buildValueClassName(config: FieldDisplayConfig): string {
  // Full-width fields (like notes) use prose-friendly typography
  if (config.fullWidth) {
    return cn(
      // Non-monospace font for readability of prose content
      'text-sm',

      // Custom classes for full-width fields
      config.valueClassName || 'text-left',
    );
  }

  // Standard grid fields use monospace for data values
  return cn(
    // Base styles for data values
    'font-mono text-sm font-medium text-foreground',

    // Custom classes OR default shrink behavior
    config.valueClassName ? config.valueClassName : 'shrink-0',
  );
}
