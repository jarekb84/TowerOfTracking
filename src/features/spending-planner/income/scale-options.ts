/**
 * Scale Options Configuration
 *
 * Defines available scale suffixes for currency values.
 * Derived from the shared SCALE_DEFINITIONS to avoid duplication.
 */

import { SCALE_DEFINITIONS } from '@/shared/formatting/number-scale'

export const SCALE_OPTIONS = [
  { value: '', label: '--', multiplier: 1 },
  ...SCALE_DEFINITIONS.map(({ suffix, multiplier }) => ({
    value: suffix,
    label: suffix,
    multiplier,
  })),
] as const
