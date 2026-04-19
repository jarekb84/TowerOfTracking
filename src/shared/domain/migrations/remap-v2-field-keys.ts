import type { GameRunField } from '@/shared/types/game-run.types';
import { V2_TO_V3_FIELD_MAP } from './v2-to-v3-field-map';
import { INTENTIONALLY_DROPPED_V2_FIELDS } from './intentionally-dropped';

/**
 * Rename V2-shaped field keys to V3 canonical keys on an in-memory
 * `ParsedGameRun.fields` map. Used at every V2-era entry point (legacy
 * clipboard paste, V2 CSV import) so runs land in storage under their V3
 * names and match the exporter's `v3_` header prefix.
 *
 * - V2 keys present in V2_TO_V3_FIELD_MAP are renamed.
 * - V2 keys in INTENTIONALLY_DROPPED_V2_FIELDS are discarded.
 * - Internal fields (leading underscore) pass through unchanged.
 * - Unknown keys pass through unchanged so the caller can emit them under
 *   `unrecognizedField_` if desired.
 * - Keys already shaped as V3 (`<section>_<label>` with an underscore in
 *   position 2+ and no leading underscore) pass through unchanged.
 *
 * When multiple V2 keys map to the same V3 key (duplicate legacy spellings
 * like `coinsFromOrb` + `coinsFromOrbs`), the LAST non-empty source wins.
 */
export function remapV2FieldKeys(
  fields: Record<string, GameRunField>
): Record<string, GameRunField> {
  const result: Record<string, GameRunField> = {};

  for (const [key, field] of Object.entries(fields)) {
    if (key.startsWith('_')) {
      result[key] = field;
      continue;
    }

    if (INTENTIONALLY_DROPPED_V2_FIELDS[key] !== undefined) {
      continue;
    }

    const v3Key = V2_TO_V3_FIELD_MAP[key];
    if (v3Key !== undefined) {
      const existing = result[v3Key];
      if (!existing || !field.rawValue) {
        // No existing value or the incoming is empty — prefer the existing.
        // If no existing yet, take this one.
        if (!existing) result[v3Key] = field;
        // else: keep existing non-empty value; drop this empty one.
      } else {
        // Duplicate target with two non-empty candidates. Last wins.
        result[v3Key] = field;
      }
      continue;
    }

    // Unknown key. Pass through.
    result[key] = field;
  }

  return result;
}
