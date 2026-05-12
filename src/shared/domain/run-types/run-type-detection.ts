import type { GameRunField } from '@/shared/types/game-run.types';
import { RunType, RunTypeValue, isRunTypeValue } from './types';

/**
 * Look up a field by its V3 canonical key, falling back to the V2 key when
 * the data hasn't been remapped yet (e.g. during the migration flow, or
 * when tests supply legacy-shaped fixtures). Keeps stat extraction working
 * across both schemas.
 */
function pickField(
  fields: Record<string, GameRunField>,
  v3Key: string,
  v2Key: string
): GameRunField | undefined {
  return fields[v3Key] ?? fields[v2Key];
}

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
  const tierStr = pickField(fields, 'battleReport_tier', 'tier')?.rawValue || '';
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

  return mapExplicitRunType(runTypeField) !== null;
}

/**
 * Canonicalize a lowercased explicit run-type string. Returns the value when
 * it matches one of the declared `RunTypeValue`s, else null.
 */
function mapExplicitRunType(runTypeValue: string): RunTypeValue | null {
  return isRunTypeValue(runTypeValue) ? runTypeValue : null;
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
  // Tournament tiers carry a '+' suffix (e.g. "8+") that breaks naive numeric
  // parsing. Extract the leading integer from rawValue so V2 tournament
  // pastes and V28 plain numbers both resolve to the same number.
  //
  // TRANSITIONAL — same logic is duplicated in
  // `data-parser.ts:extractKeyStatsFromFields`. Commit 9 (derivations) absorbs
  // both per the spec §11.3 / §11.4 gotcha 4: tier parsing becomes either a
  // dedicated data-type or a self-deriver, and `_runType IS_DERIVED_FROM
  // battleReport_tier { deriver: 'runTypeFromTier' }` removes the
  // `/\+/.test(tierStr)` branch from `detectRunTypeFromFields` below.
  const tierStr = pickField(fields, 'battleReport_tier', 'tier')?.rawValue ?? '';
  const tierMatch = tierStr.match(/^(\d+)/);
  const tier = tierMatch ? parseInt(tierMatch[1], 10) : 0;

  return {
    tier,
    wave: (pickField(fields, 'battleReport_wave', 'wave')?.value as number) || 0,
    coinsEarned:
      (pickField(fields, 'battleReport_coinsEarned', 'coinsEarned')?.value as number) || 0,
    cellsEarned:
      (pickField(fields, 'battleReport_cellsEarned', 'cellsEarned')?.value as number) || 0,
    realTime: (pickField(fields, 'battleReport_realTime', 'realTime')?.value as number) || 0,
  };
}
