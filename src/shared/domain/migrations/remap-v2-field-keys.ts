import type { GameRunField } from '@/shared/types/game-run.types';
import { resolveFieldByAnyKey } from '@/shared/domain/field-graph';
import { INTENTIONALLY_DROPPED_V2_FIELDS } from './intentionally-dropped';

/**
 * Rename V2-shaped field keys to V3 canonical keys on an in-memory
 * `ParsedGameRun.fields` map. Used at every V2-era entry point (legacy
 * clipboard paste, V2 CSV import, V1→V2 in-memory migration) so runs land in
 * storage under their V3 names and match the exporter's `v3_` header prefix.
 *
 * - Legacy keys with a `RENAMED_FROM` edge in the graph (V2→V3 game-field
 *   renames AND V1→V2 internal-field renames) are remapped to canonical.
 * - Keys already canonical (`battleReport_tier`, `_date`, ...) pass through.
 * - V2 keys in INTENTIONALLY_DROPPED_V2_FIELDS are discarded.
 * - Unknown keys pass through unchanged so the caller can emit them under
 *   `unrecognizedField_` if desired.
 *
 * When multiple V2 keys map to the same V3 key (duplicate legacy spellings
 * like `coinsFromOrb` + `coinsFromOrbs`), the LAST non-empty source wins.
 *
 * TRANSITIONAL — the `INTENTIONALLY_DROPPED_V2_FIELDS` membership check
 * collapses to a graph query in commit 11 (`INTENTIONALLY_DROPPED_IN_SCHEMA`
 * edges). After commit 11, the function reduces to a one-liner:
 * `Object.fromEntries(Object.entries(fields).flatMap(([k, v]) => { const r =
 * resolveFieldByAnyKey(k); return r ? [[r.id, v]] : []; }))`.
 */
export function remapV2FieldKeys(
  fields: Record<string, GameRunField>,
): Record<string, GameRunField> {
  const result: Record<string, GameRunField> = {};

  for (const [key, field] of Object.entries(fields)) {
    if (INTENTIONALLY_DROPPED_V2_FIELDS[key] !== undefined) continue;

    const node = resolveFieldByAnyKey(key);
    const targetKey = node?.id ?? key;

    const existing = result[targetKey];
    if (!existing) {
      result[targetKey] = field;
      continue;
    }

    // Two V2 keys collapsed to the same canonical. Last non-empty wins.
    if (field.rawValue) result[targetKey] = field;
  }

  return result;
}
