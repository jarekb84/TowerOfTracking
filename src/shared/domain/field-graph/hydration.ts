import type { GameRunField, ParsedGameRun, RunTypeValue } from '@/shared/types/game-run.types';
import type { ImportFormatSettings } from '@/shared/locale/types';
import { remapV2FieldKeys } from '@/shared/domain/migrations/remap-v2-field-keys';
import { validateBattleDate } from '@/shared/formatting/date-formatters';
import { isRunTypeValue, RunType } from '@/shared/domain/run-types/types';
import { extractNumericStats } from '@/shared/domain/run-types/run-type-detection';
import {
  applyDerivations as applyDerivationsRaw,
  cascadeFromInputChange as cascadeFromInputChangeRaw,
} from './catalog/edges/derivations/apply-derivations';
import { appGraph } from './app-graph';
import { BATTLE_REPORT__BATTLE_DATE_NODE } from './catalog/fields.nodes';

// Lifecycle methods for `ParsedGameRun` — the graph orchestrates the back-half
// of the parse pipeline (V2-key remap, derivation cascade, cached-prop
// extraction, run assembly) and the cascade on edit. Parsers transform raw
// input into a `Record<string, GameRunField>`; this module takes over from
// there. Per `EXPLORATION-derivation-invocation-model.md` Human decision.
//
// These are lifecycle methods, distinct from per-edge queries (which live in
// `catalog/edges/<concept>/<concept>.queries.ts`). The 5b engine-API ADR's
// "engine class closed for new methods" rule targets query bloat; lifecycle
// methods get a deliberate carve-out.

export interface HydrationContext {
  customTimestamp?: Date;
  importFormat?: ImportFormatSettings;
}

export function hydrateRun(
  rawFields: Record<string, GameRunField>,
  ctx: HydrationContext = {},
): ParsedGameRun {
  const remapped = remapV2FieldKeys(rawFields);
  const fields = applyDerivationsRaw(appGraph(), remapped);
  const { timestamp, dateValidationError } = resolveTimestamp(fields, ctx);
  const stats = extractCachedStats(fields);
  return {
    id: crypto.randomUUID(),
    timestamp,
    fields,
    ...stats,
    ...(dateValidationError && { dateValidationError }),
  };
}

export function updateField(
  run: ParsedGameRun,
  fieldId: string,
  newField: GameRunField,
): ParsedGameRun {
  const next = { ...run.fields, [fieldId]: newField };
  const cascaded = cascadeFromInputChangeRaw(appGraph(), next, fieldId);
  return { ...run, fields: cascaded };
}

interface TimestampResolution {
  timestamp: Date;
  dateValidationError?: ParsedGameRun['dateValidationError'];
}

function resolveTimestamp(
  fields: Record<string, GameRunField>,
  ctx: HydrationContext,
): TimestampResolution {
  const fallback = ctx.customTimestamp ?? new Date();
  const battleDateField = fields[BATTLE_REPORT__BATTLE_DATE_NODE.id];
  if (!battleDateField) return { timestamp: fallback };

  const result = validateBattleDate(battleDateField.rawValue, {
    format: ctx.importFormat?.dateFormat ?? 'month-first',
    warnFutureDates: false,
  });
  if (result.success) return { timestamp: result.date };
  return { timestamp: fallback, dateValidationError: result.error };
}

interface CachedStats {
  tier: number;
  wave: number;
  coinsEarned: number;
  cellsEarned: number;
  realTime: number;
  runType: RunTypeValue;
}

function extractCachedStats(fields: Record<string, GameRunField>): CachedStats {
  const numericStats = extractNumericStats(fields);
  const raw = fields._runType?.rawValue?.toLowerCase();
  const runType: RunTypeValue = raw && isRunTypeValue(raw) ? raw : RunType.FARM;
  return { ...numericStats, runType };
}
