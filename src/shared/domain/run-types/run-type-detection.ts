import type { GameRunField } from '@/shared/types/game-run.types';
import { RunType, RunTypeValue } from './types';

/**
 * Determines run type from CSV field data
 * Priority: Explicit run_type field > Tier string pattern detection
 */
export function detectRunTypeFromFields(fields: Record<string, GameRunField>): RunTypeValue {
  // Check for explicit run_type field first
  const runTypeField = fields.runType?.rawValue?.toLowerCase();
  if (runTypeField) {
    const explicitType = mapExplicitRunType(runTypeField);
    if (explicitType) {
      return explicitType;
    }
  }

  // Fallback to auto-detection from tier string
  const tierStr = fields.tier?.rawValue || '';
  return /\+/.test(tierStr) ? RunType.TOURNAMENT : RunType.FARM;
}

/**
 * Checks if clipboard data contains an explicit run_type field
 * Returns true if the data explicitly specifies a run type, false otherwise
 */
export function hasExplicitRunType(fields: Record<string, GameRunField>): boolean {
  const runTypeField = fields.runType?.rawValue?.toLowerCase();
  if (!runTypeField) {
    return false;
  }

  const explicitType = mapExplicitRunType(runTypeField);
  return explicitType !== null;
}

/**
 * Maps explicit run type string to RunType enum
 */
function mapExplicitRunType(runTypeValue: string): RunTypeValue | null {
  switch (runTypeValue) {
    case 'milestone':
      return RunType.MILESTONE;
    case 'tournament':
      return RunType.TOURNAMENT;
    case 'farm':
      return RunType.FARM;
    default:
      return null;
  }
}

/**
 * Extracts numeric values from fields with fallback defaults
 */
export function extractNumericStats(fields: Record<string, GameRunField>): {
  tier: number;
  wave: number;
  coinsEarned: number;
  cellsEarned: number;
  realTime: number;
} {
  return {
    tier: (fields.tier?.value as number) || 0,
    wave: (fields.wave?.value as number) || 0,
    coinsEarned: (fields.coinsEarned?.value as number) || 0,
    cellsEarned: (fields.cellsEarned?.value as number) || 0,
    realTime: (fields.realTime?.value as number) || 0,
  };
}