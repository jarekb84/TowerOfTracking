import type { GameRunField } from '@/shared/types/game-run.types';
import { formatIsoDate, formatIsoTime } from '@/shared/formatting/date-formatters';
import { RunType, isRunTypeValue } from '@/shared/domain/run-types/types';

// Registry of named derivation functions. Each `IS_DERIVED_FROM` edge in
// `derivations.edges.ts` carries a `{ deriver: <name> }` payload pointing at
// one of these. The cascade walker in `apply-derivations.ts` invokes the
// registered function with the current field map's inputs.
//
// Signature contract:
//  - `inputs` is keyed by input-field id (the IS_DERIVED_FROM edge target).
//    Values are the live `GameRunField` for each input, or `undefined` when
//    the input field is absent from the run.
//  - `current` is the live `GameRunField` for the derived field itself, or
//    `undefined` when this is the first derivation pass.
//  - Returning a string overwrites the derived field. Returning `undefined`
//    preserves the current value — used to express priority semantics
//    (e.g. an explicit `_runType` from the import wins over tier-pattern
//    fallback).

export type DerivedValue = string | undefined;

export type Deriver = (
  inputs: Record<string, GameRunField | undefined>,
  current: GameRunField | undefined,
) => DerivedValue;

export const DERIVER_NAMES = {
  dateFromBattleDate: 'deriver:dateFromBattleDate',
  timeFromBattleDate: 'deriver:timeFromBattleDate',
  runTypeFromTier: 'deriver:runTypeFromTier',
} as const;

export type DeriverName = typeof DERIVER_NAMES[keyof typeof DERIVER_NAMES];

function asDate(field: GameRunField | undefined): Date | undefined {
  if (!(field?.value instanceof Date)) return undefined;
  return isNaN(field.value.getTime()) ? undefined : field.value;
}

function isNonEmpty(field: GameRunField | undefined): boolean {
  return !!field?.rawValue;
}

// Explicit `_date` / `_time` from a CSV import wins over the battleDate-
// derived value. This matches the legacy parser behavior; the edit-time
// cascade overrides explicit values by clearing them in
// `cascadeFromInputChange` before re-invoking the deriver.
function dateFromBattleDate(
  inputs: Record<string, GameRunField | undefined>,
  current: GameRunField | undefined,
): DerivedValue {
  if (isNonEmpty(current)) return undefined;
  const battleDate = asDate(inputs.battleReport_battleDate);
  return battleDate ? formatIsoDate(battleDate) : undefined;
}

function timeFromBattleDate(
  inputs: Record<string, GameRunField | undefined>,
  current: GameRunField | undefined,
): DerivedValue {
  if (isNonEmpty(current)) return undefined;
  const battleDate = asDate(inputs.battleReport_battleDate);
  return battleDate ? formatIsoTime(battleDate) : undefined;
}

// Two-tier priority: explicit `_runType` (from import or user edit) wins over
// the tier-`+` fallback. Spec §11.4 gotcha 4 — "the two-tier priority is a
// deriver implementation detail." Returns undefined for plain (non-`+`)
// tiers with no explicit value so `_runType` stays unset for the modal farm
// case; the cached `ParsedGameRun.runType` prop falls back to 'farm' via
// `extractKeyStatsFromFields`.
function runTypeFromTier(
  inputs: Record<string, GameRunField | undefined>,
  current: GameRunField | undefined,
): DerivedValue {
  const explicit = current?.rawValue?.toLowerCase();
  if (explicit && isRunTypeValue(explicit)) return undefined;

  const tierRaw = inputs.battleReport_tier?.rawValue ?? '';
  if (/\+/.test(tierRaw)) return RunType.TOURNAMENT;
  return undefined;
}

export const DERIVERS: Readonly<Record<DeriverName, Deriver>> = {
  [DERIVER_NAMES.dateFromBattleDate]: dateFromBattleDate,
  [DERIVER_NAMES.timeFromBattleDate]: timeFromBattleDate,
  [DERIVER_NAMES.runTypeFromTier]: runTypeFromTier,
};
