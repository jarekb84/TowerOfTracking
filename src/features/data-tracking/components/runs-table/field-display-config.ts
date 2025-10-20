/**
 * Configuration for customizing field display behavior in run details
 */

export interface FieldDisplayConfig {
  /** Hide the field name/label */
  hideLabel?: boolean;
  /** Make the field take full width instead of half-width grid */
  fullWidth?: boolean;
  /** Left-align the value instead of right-align */
  leftAlignValue?: boolean;
  /** Custom CSS classes for the field container */
  containerClassName?: string;
  /** Custom CSS classes for the value */
  valueClassName?: string;
}

/**
 * Map of field names to their custom display configurations
 */
export const FIELD_DISPLAY_CONFIG: Record<string, FieldDisplayConfig> = {
  '_notes': {
    hideLabel: true,
    fullWidth: true,
    leftAlignValue: true,
    containerClassName: 'col-span-2',
    valueClassName: 'text-left whitespace-pre-wrap break-words leading-relaxed text-foreground/90',
  },
};

/**
 * Get display configuration for a specific field
 * @param fieldKey - The camelCase field key to look up
 * @returns Configuration object, or empty object if not found
 */
export function getFieldDisplayConfig(fieldKey: string): FieldDisplayConfig {
  return FIELD_DISPLAY_CONFIG[fieldKey] || {};
}
