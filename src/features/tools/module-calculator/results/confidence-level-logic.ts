/**
 * Confidence Level Logic
 *
 * Configuration and utilities for simulation confidence levels.
 */

import type { ConfidenceLevel, ConfidenceLevelOption } from '../types';

/**
 * Available confidence level options
 */
export const CONFIDENCE_LEVELS: ConfidenceLevelOption[] = [
  {
    value: 'low',
    label: 'Quick',
    iterations: 1000,
    description: '1,000 simulations',
  },
  {
    value: 'medium',
    label: 'Balanced',
    iterations: 10000,
    description: '10,000 simulations',
  },
  {
    value: 'high',
    label: 'Precise',
    iterations: 100000,
    description: '100,000 simulations',
  },
];

/**
 * Default confidence level
 */
export const DEFAULT_CONFIDENCE_LEVEL: ConfidenceLevel = 'medium';

/**
 * Get iterations for a confidence level
 */
export function getIterationsForLevel(level: ConfidenceLevel): number {
  const option = CONFIDENCE_LEVELS.find((l) => l.value === level);
  return option?.iterations ?? 10000;
}

