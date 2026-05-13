import type { GameRunField } from '@/shared/types/game-run.types';
import { RunType, RunTypeValue, isRunTypeValue } from './types';

/**
 * TRANSITIONAL — audited and deleted by commit 11b. Post-commit-10 the
 * parser-boundary remap ensures every production caller hands V3-canonical
 * fields here, so the V2-key fallback leg is dead in production. Kept only
 * for pre-cutover test fixtures. Commit 11b's "Files touched" list
 * references this function for audit + deletion.
 */
function pickField(
  fields: Record<string, GameRunField>,
  v3Key: string,
  v2Key: string
): GameRunField | undefined {
  return fields[v3Key] ?? fields[v2Key];
}

/**
 * Determines run type from already-hydrated fields. Reads `_runType` directly
 * — the parsers' `hydrateRun` populates it via the `runTypeFromTier` deriver
 * (explicit value wins; else tier-`+` → 'tournament'). Falls back to 'farm'.
 */
export function detectRunTypeFromFields(fields: Record<string, GameRunField>): RunTypeValue {
  const raw = fields._runType?.rawValue?.toLowerCase();
  return raw && isRunTypeValue(raw) ? raw : RunType.FARM;
}

/**
 * Checks if hydrated fields carry a usable run-type signal. Post-hydration,
 * `_runType` is populated iff the import provided an explicit value OR the
 * tier carries a tournament `+` suffix — both qualify as "explicit."
 */
export function hasExplicitRunType(fields: Record<string, GameRunField>): boolean {
  const raw = fields._runType?.rawValue?.toLowerCase();
  return !!raw && isRunTypeValue(raw);
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
  // Tier parses to the leading integer via the `'tier'` data type (see
  // `field-utils.ts`'s switch and `EXPLORATION-tier-handling.md`). The legacy
  // V2-shaped fallback path may still surface fields under their original
  // numeric data type for some test fixtures; both shapes resolve to a number
  // via `field.value`.
  return {
    tier: (pickField(fields, 'battleReport_tier', 'tier')?.value as number) || 0,
    wave: (pickField(fields, 'battleReport_wave', 'wave')?.value as number) || 0,
    coinsEarned:
      (pickField(fields, 'battleReport_coinsEarned', 'coinsEarned')?.value as number) || 0,
    cellsEarned:
      (pickField(fields, 'battleReport_cellsEarned', 'cellsEarned')?.value as number) || 0,
    realTime: (pickField(fields, 'battleReport_realTime', 'realTime')?.value as number) || 0,
  };
}
