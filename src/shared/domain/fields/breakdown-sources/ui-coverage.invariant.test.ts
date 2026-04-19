import { describe, expect, it } from 'vitest';
import { COIN_FIELDS, DAMAGE_FIELDS } from './index';
import supportedFieldsData from '../../../../../sampleData/supportedFields.json';

/**
 * UI-coverage invariants — catch silent drift between what V3 fields
 * exist in the canonical schema (`supportedFields.json`) and what the
 * expanded-run-details UI chooses to display.
 *
 * When a field exists in storage but the UI doesn't render it, users
 * see "data loss" even though the data is intact on disk. These tests
 * force any exclusion to be explicit, so adding a new V3 field under a
 * known section fails the build until someone decides where it goes.
 */

const supportedFields = supportedFieldsData as string[];

/**
 * Explicitly excluded from the coin-source breakdown (not a source, or
 * rendered elsewhere). Expand this set — don't silently skip a new field.
 */
const COIN_FIELDS_EXPLICIT_EXCLUDES: ReadonlySet<string> = new Set([
  // Battle Report's `coinsEarned` is the TOTAL for the breakdown; it
  // doesn't display as a source. (COINS_EARNED_CATEGORY.totalField
  // points here.) It lives under `battleReport_coinsEarned`, not
  // `coins_coinsEarned`, but keep this list of known `coins_*` entries
  // that shouldn't appear in the UI source breakdown.
  'coins_coinsEarned',
]);

/**
 * Explicit excludes for the damage-source breakdown. `damage_damageDealt`
 * is the total field for the breakdown and doesn't render as a source.
 */
const DAMAGE_FIELDS_EXPLICIT_EXCLUDES: ReadonlySet<string> = new Set([
  'damage_damageDealt',
]);

describe('UI coverage invariants — coin section', () => {
  it('every coins_* field in supportedFields is either in COIN_FIELDS or an explicit exclude', () => {
    const uiCoinFieldNames = new Set(COIN_FIELDS.map((f) => f.fieldName));
    const coinSectionFields = supportedFields.filter((f) => f.startsWith('coins_'));

    const missing = coinSectionFields.filter(
      (f) => !uiCoinFieldNames.has(f) && !COIN_FIELDS_EXPLICIT_EXCLUDES.has(f)
    );

    expect(
      missing,
      `coins_* fields present in supportedFields but not in COIN_FIELDS or excludes:\n${missing
        .map((f) => `  ${f}`)
        .join('\n')}\n\nEither add them to COIN_FIELDS (coin-sources.ts) or to COIN_FIELDS_EXPLICIT_EXCLUDES here.`
    ).toEqual([]);
  });

  it('every COIN_FIELDS entry points at a real supportedFields key', () => {
    const supportedSet = new Set(supportedFields);
    const orphans = COIN_FIELDS.map((f) => f.fieldName).filter((f) => !supportedSet.has(f));
    expect(
      orphans,
      `COIN_FIELDS entries pointing at fields not in supportedFields.json:\n${orphans.map((f) => `  ${f}`).join('\n')}`
    ).toEqual([]);
  });
});

describe('UI coverage invariants — damage section', () => {
  it('every damage_* field in supportedFields is either in DAMAGE_FIELDS or an explicit exclude', () => {
    const uiDamageFieldNames = new Set(DAMAGE_FIELDS.map((f) => f.fieldName));
    const damageSectionFields = supportedFields.filter((f) => f.startsWith('damage_'));

    const missing = damageSectionFields.filter(
      (f) => !uiDamageFieldNames.has(f) && !DAMAGE_FIELDS_EXPLICIT_EXCLUDES.has(f)
    );

    expect(
      missing,
      `damage_* fields present in supportedFields but not in DAMAGE_FIELDS or excludes:\n${missing
        .map((f) => `  ${f}`)
        .join('\n')}\n\nEither add them to DAMAGE_FIELDS (damage-sources.ts) or to DAMAGE_FIELDS_EXPLICIT_EXCLUDES here.`
    ).toEqual([]);
  });

  it('every DAMAGE_FIELDS entry points at a real supportedFields key', () => {
    const supportedSet = new Set(supportedFields);
    const orphans = DAMAGE_FIELDS.map((f) => f.fieldName).filter((f) => !supportedSet.has(f));
    expect(
      orphans,
      `DAMAGE_FIELDS entries pointing at fields not in supportedFields.json:\n${orphans.map((f) => `  ${f}`).join('\n')}`
    ).toEqual([]);
  });
});
