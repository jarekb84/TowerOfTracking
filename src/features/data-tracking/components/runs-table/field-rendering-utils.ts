import { cn } from '../../../../shared/lib/utils';
import type { FieldDisplayConfig } from './field-display-config';

/**
 * Build container class name based on field display configuration
 */
export function buildContainerClassName(config: FieldDisplayConfig): string {
  return cn(
    // Base styles - always applied
    'flex items-center p-3 bg-muted/15 rounded-md border border-border/20',
    'transition-all duration-200 hover:bg-muted/25 hover:border-accent/30 hover:shadow-sm',

    // Full width span
    config.fullWidth && (config.containerClassName || 'col-span-2'),

    // Justification
    config.fullWidth && config.leftAlignValue ? 'justify-start' : 'justify-between',
  );
}

/**
 * Build value class name based on field display configuration
 */
export function buildValueClassName(config: FieldDisplayConfig): string {
  return cn(
    // Base styles - always applied
    'font-mono text-sm font-medium text-foreground',

    // Custom classes OR default shrink behavior
    config.valueClassName ? config.valueClassName : 'shrink-0',
  );
}
