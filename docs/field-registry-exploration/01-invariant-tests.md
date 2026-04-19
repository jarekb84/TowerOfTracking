# Approach 1: Invariant Tests on the Status Quo

**Status:** Deep-dive · **Parent:** [EXPLORATION-field-registry-architecture.md](../EXPLORATION-field-registry-architecture.md)
**Effort:** Small · **Payoff:** Medium · **Novelty:** Low

---

## 1. Abstract & motivation

Keep the existing file-per-concern architecture exactly as it is. Do not introduce a central registry, codegen, or file-per-field restructuring. Instead, add a thin *test layer* that treats every pairing of files as a relationship with an invariant. If `coins_goldenTower` appears in `sampleData/supportedFields.json` but not in `COIN_FIELDS`, the test suite fails and names both files. If the V28 sample parser produces `battleReport_killedBy` with `dataType: 'number'`, the test suite fails and names the parser file.

This approach wins when the pain is *silent drift between otherwise well-factored files*, which is exactly what V28 exposed. It is the cheapest possible move that converts an entire class of "landed in storage but didn't render" bugs from production incidents into red CI builds. It does **not** reduce the cognitive load of tracing a field across seven files — that is a separate problem solved by approaches 2, 5, 6, 7, and 8. What it does buy is *correctness under change*: no matter how many files a field touches, the pairwise contracts between those files are mechanically enforced.

## 2. How it works

The mental model is: every cross-file contract that is currently held together by "someone remembers to update both files" becomes a Vitest test that asserts the contract mechanically. The contract is expressed as a set, a map, or a derivation, and the test asserts set equality, bijective coverage, or behavioral round-trip.

```
                     Current file-per-concern structure (unchanged)
   +------------------------------------------------------------------+
   |                                                                  |
   |  section-aware-parser.ts        supportedFields.json             |
   |          |                              |                        |
   |          v                              v                        |
   |  v2-to-v3-field-map.ts  <----- field-utils.ts (type detection)   |
   |          |                              |                        |
   |          v                              v                        |
   |  coin-sources.ts / damage-sources.ts    section-config.ts        |
   |                                                                  |
   +------------------------------------------------------------------+
                               |
                               |   NEW: invariant test layer
                               v
   +------------------------------------------------------------------+
   |  v28-sample-parse.invariant.test.ts                              |
   |  ui-coverage.invariant.test.ts                                   |
   |  v2-v3-schema-inverse-check.test.ts                              |
   |  section-config-coverage.invariant.test.ts        <-- NEW        |
   |  parser-roundtrip.invariant.test.ts               <-- NEW        |
   |  field-utils-type-detection.invariant.test.ts     <-- NEW        |
   |  color-uniqueness.invariant.test.ts               <-- NEW        |
   +------------------------------------------------------------------+
                               |
                               v
                         v28-field-matrix.csv
                      (the source-of-truth fixture)
```

### What counts as an invariant

An invariant is a statement of the form "for every X in file A, there must be a corresponding Y in file B (or an explicit exception)." Concretely:

| Invariant class | Example | Test file |
|---|---|---|
| Coverage | Every `coins_*` in `supportedFields.json` is in `COIN_FIELDS` or explicit exclude | `ui-coverage.invariant.test.ts` |
| Inverse coverage | Every `COIN_FIELDS` entry points at a real `supportedFields.json` key | `ui-coverage.invariant.test.ts` |
| Typed parse | Every sample V28 file produces `battleReport_killedBy` with `dataType: 'string'` | `v28-sample-parse.invariant.test.ts` |
| Migration completeness | Every V2 game field is either mapped or in `INTENTIONALLY_DROPPED_V2_FIELDS` | `v2-v3-schema-inverse-check.test.ts` |
| Round-trip | `parse(raw) → serialize → parse` is a fixed point | (new) |
| Uniqueness | No duplicate entries in `supportedFields.json`; no duplicate colors within a breakdown category | (new) |
| Derivation | `section-config.ts` covers every `supportedFields.json` key except `SKIP_FIELDS` | (new) |

The **source of truth** these tests compare against is the committed `scripts/migration-data-prep/out/v28-field-matrix.csv` plus the committed `sampleData/v28/*.txt` fixtures. Both are data, not code — they represent "what the game actually exports" and they are the only thing in the repo that is authoritative about the external schema.

## 3. Evaluation

### 3a. Adding a new V29 field (e.g., `coins_dragonBreath`)

Walkthrough when V29 ships and `Coins / Dragon Breath` appears in the export:

1. Re-run `scripts/migration-data-prep/extract-v28-fields.mjs` (renamed to `extract-v29-fields.mjs` or parameterized). The script regenerates `v28-field-matrix.csv` with a new row `Coins,Dragon Breath,coins,dragonBreath,coinsDragonBreath,...`.
2. Commit a new V29 sample under `sampleData/v29/Farming_2026-09-15.txt`.
3. **Red CI: `v2-v3-schema-inverse-check.test.ts`** fails on the "every v28 matrix pair has a supportedFields entry" assertion, naming `coins_dragonBreath` as missing.
4. Add `coins_dragonBreath` to `sampleData/supportedFields.json`.
5. **Red CI: `ui-coverage.invariant.test.ts`** fails on "every `coins_*` field in supportedFields is either in `COIN_FIELDS` or an explicit exclude," naming `coins_dragonBreath`.
6. Add `coins_dragonBreath` to `src/shared/domain/fields/breakdown-sources/coin-sources.ts` with display name and color, or add it to `COIN_FIELDS_EXPLICIT_EXCLUDES`.
7. **Red CI: `section-config-coverage.invariant.test.ts`** (the one proposed below) fails because `coins_dragonBreath` is not in `CATEGORIZED_FIELDS` and not in `SKIP_FIELDS`. Since `COINS_EARNED_CONFIG` now includes it transitively via `COIN_FIELDS`, this test would pass once step 6 is done — but if the engineer put it in the exclude list, they must explicitly decide where it renders in run-details.
8. Green CI.

Files you touch: `v28-field-matrix.csv` (regenerated), one V29 sample file, `supportedFields.json`, `coin-sources.ts`. The tests catch steps 4, 6, and 7 if skipped. You cannot ship a field to storage that the UI won't render — the build will not pass.

### 3b. Renaming a field (e.g., `coins_goldenTower` → `coins_goldenTowerIncome`)

1. Update the V2→V3 migration map so old storage still works: `v2-to-v3-field-map.ts` already has the old→new translation at import time; rename the target.
2. Update `supportedFields.json` (replace `coins_goldenTower` with `coins_goldenTowerIncome`).
3. **Red CI: `ui-coverage.invariant.test.ts`** flags `coins_goldenTower` in `COIN_FIELDS` as an orphan and `coins_goldenTowerIncome` as uncovered.
4. Update `COIN_FIELDS`.
5. `v28-sample-parse.invariant.test.ts` will fail against the V28 samples unless the parser also emits the new key, so you must update the parser or the migration layer to produce `coins_goldenTowerIncome` from the section-aware parse of `Golden Tower` under `Coins`.
6. Greps for the literal string `coins_goldenTower` catch lingering references in chart code, color configs, or tier-trend logic. The invariant tests don't help with these unless they're in files the invariant tests already cover, which is the honest limitation discussed below.

### 3c. Adding a new UI view (e.g., a "Shards Earned" analysis page)

This is where invariant tests are *weakest*. The new view is a new consumer of fields; it has no prior invariant relationship. To integrate it into the safety net, you would:

1. Build the new view in `src/features/analysis/shards-earned/` referencing the relevant `currencies_*Shards` fields.
2. Add a new invariant test `shards-view-coverage.invariant.test.ts` that asserts the view's field list matches a predicate over `supportedFields.json` (e.g., "every `currencies_*Shards` key is rendered by the Shards Earned view, or is in an exclude list").
3. Going forward, new shards will either appear in the view automatically or trigger a red CI.

The cost is **one new invariant test per new view**. If the view wants to render an arbitrary user-selected field (like `FieldAnalyticsView`), the invariant is different: "every `supportedFields.json` key is selectable in the field dropdown" — still expressible, but the test is about the dropdown options, not the rendering.

### 3d. Discoverability: "where is `coins_goldenTower` used?"

**This approach does not improve discoverability.** The answer is still "grep the codebase." The invariant tests catch drift *after* you forget a file; they do not make it easier to find the files in the first place.

A partial mitigation: the invariant test names themselves become a rough index. Running `grep -r "coins_" src/**/*.invariant.test.ts` tells you which files participate in cross-file contracts for coin fields. This is a weak substitute for a real registry.

Honest verdict: if the primary pain is "I can't find where this field is used," pick approach 4, 5, 7, or 8 instead. Approach 1 only solves the "I forgot to update one of the files I already know about" pain.

### 3e. What silently breaks if someone forgets a step

With the invariant suite in place, the following failure modes become impossible (they trigger red CI):

- New field in `supportedFields.json` without a `COIN_FIELDS` / `DAMAGE_FIELDS` entry or explicit exclude.
- `COIN_FIELDS` entry pointing at a non-existent `supportedFields.json` key.
- V2 field removed from `V2_TO_V3_FIELD_MAP` without being added to `INTENTIONALLY_DROPPED_V2_FIELDS`.
- V28 sample parse producing wrong `dataType` for `battleReport_killedBy`, `battleReport_battleDate`, `battleReport_realTime`, `battleReport_gameTime`.
- V28 matrix row with no corresponding `supportedFields.json` entry.
- Duplicate entries in `supportedFields.json`.

The following failure modes **remain possible** (this approach doesn't catch them):

- A chart file hardcodes a color for `coins_goldenTower` that differs from `COIN_FIELDS`. (Needs approach 6 or a dedicated color-consistency test.)
- A new hook derives a per-hour value for `cells_cellsEarned` but not for its future sibling `cells_cellsBonus`. (Needs approach 5 or 7.)
- A field is conceptually a "source of damage" but nobody thought to add it to `DAMAGE_FIELDS`. (The invariant test only fires if the field is in `supportedFields.json`, which requires someone to have regenerated the matrix and committed the V29 sample.)
- A field is added to `supportedFields.json` manually without the V28 matrix regeneration, so `v2-v3-schema-inverse-check.test.ts` passes but the field isn't actually produced by the parser.

### 3f. File tree impact

Add a small number of files, all co-located with the code they constrain:

```
src/
  features/analysis/shared/parsing/
    v28-sample-parse.invariant.test.ts           (exists)
    parser-roundtrip.invariant.test.ts           (NEW)
    field-utils-type-detection.invariant.test.ts (NEW)
  shared/domain/fields/breakdown-sources/
    ui-coverage.invariant.test.ts                (exists)
    color-uniqueness.invariant.test.ts           (NEW)
  shared/domain/migrations/
    v2-v3-schema-inverse-check.test.ts           (exists)
  features/game-runs/card-view/run-details/
    section-config-coverage.invariant.test.ts    (NEW)
```

Total: ~4 new files, each 50–150 lines. No changes to production code. No reorganization. This is the smallest possible footprint among the eight approaches.

### 3g. Concrete code samples

Four representative invariant tests, each targeting a real bug class that shipped during V28.

#### Sample 1: Section-config coverage (catches "field in storage, missing from UI")

**Path:** `src/features/game-runs/card-view/run-details/section-config-coverage.invariant.test.ts`

This would have caught the V28 bug where `coins_waveSkip` landed in storage but the run-details card never rendered it because the engineer forgot to add it to any section config.

```ts
import { describe, expect, it } from 'vitest';
import {
  CATEGORIZED_FIELDS,
  SKIP_FIELDS,
} from './section-config';
import supportedFieldsData from '../../../../../sampleData/supportedFields.json';

const supportedFields = supportedFieldsData as string[];

/**
 * Fields that are valid canonical keys but intentionally do NOT appear in
 * the run-details card (rendered elsewhere, or internal). Expanding this
 * set is an explicit, reviewable decision.
 */
const UNCATEGORIZED_ALLOWED: ReadonlySet<string> = new Set([
  // Rendered in the card header, not in a section
  'battleReport_tier',
  'battleReport_wave',
]);

describe('section-config coverage invariants', () => {
  it('every supportedFields key is categorized, skipped, or explicitly allowed uncategorized', () => {
    const uncategorized = supportedFields.filter(
      (f) =>
        !CATEGORIZED_FIELDS.has(f) &&
        !SKIP_FIELDS.has(f) &&
        !UNCATEGORIZED_ALLOWED.has(f),
    );

    expect(
      uncategorized,
      `supportedFields entries not covered by any run-details section:\n${uncategorized
        .map((f) => `  ${f}`)
        .join('\n')}\n\nAdd them to a section in section-config.ts, or to SKIP_FIELDS, or to UNCATEGORIZED_ALLOWED here.`,
    ).toEqual([]);
  });

  it('every CATEGORIZED_FIELDS entry points at a real supportedFields key', () => {
    const supportedSet = new Set(supportedFields);
    const orphans = [...CATEGORIZED_FIELDS].filter((f) => !supportedSet.has(f));
    expect(
      orphans,
      `section-config references fields not in supportedFields.json:\n${orphans.map((f) => `  ${f}`).join('\n')}`,
    ).toEqual([]);
  });
});
```

#### Sample 2: Type-detection invariants (catches composite-key mis-detection)

**Path:** `src/features/analysis/shared/parsing/field-utils-type-detection.invariant.test.ts`

The V28 bug: `getFieldConfig('battleReport_killedBy')` was called with the composite key, which contains no space so it missed `'killed by'` in `EXACT_FIELD_CONFIGS`, fell through pattern matching, and defaulted to `number`. The fix was to pass the display label to the detector. This test locks the fixed behavior in place against both the composite key and the label.

```ts
import { describe, expect, it } from 'vitest';
import { detectFieldType } from './field-utils';

/**
 * Type-detection invariants. Each row encodes "for this (key, label) pair,
 * the detector must return this type, regardless of whether the caller
 * passes the composite key or the display label."
 *
 * The V28 regression: Killed By was detected as `number` because the
 * composite key `battleReport_killedBy` was passed to the detector and
 * failed to match `EXACT_FIELD_CONFIGS['killed by']`.
 */
const TYPE_CASES: ReadonlyArray<{
  compositeKey: string;
  label: string;
  expected: 'number' | 'duration' | 'string' | 'date';
}> = [
  { compositeKey: 'battleReport_killedBy', label: 'Killed By', expected: 'string' },
  { compositeKey: 'battleReport_battleDate', label: 'Battle Date', expected: 'date' },
  { compositeKey: 'battleReport_realTime', label: 'Real Time', expected: 'duration' },
  { compositeKey: 'battleReport_gameTime', label: 'Game Time', expected: 'duration' },
  { compositeKey: 'coins_goldenTower', label: 'Golden Tower', expected: 'number' },
  { compositeKey: 'totalEnemies_scatters', label: 'Scatters', expected: 'number' },
  { compositeKey: 'damage_deathWave', label: 'Death Wave', expected: 'number' },
];

describe('field type detection — composite key and display label must agree', () => {
  for (const { compositeKey, label, expected } of TYPE_CASES) {
    it(`${compositeKey} / "${label}" -> ${expected}`, () => {
      const fromComposite = detectFieldType(compositeKey);
      const fromLabel = detectFieldType(label);
      expect(fromComposite, `${compositeKey} via composite key`).toBe(expected);
      expect(fromLabel, `"${label}" via display label`).toBe(expected);
    });
  }
});
```

#### Sample 3: Parser round-trip (catches silent lossy serialization)

**Path:** `src/features/analysis/shared/parsing/parser-roundtrip.invariant.test.ts`

This is the most under-used invariant in the current suite. It asserts that the CSV serialization used by localStorage is lossless: parse a V28 sample, serialize to the storage format, parse the result back, and compare. Any field that drops, changes type, or changes raw value between round-trips indicates a silent bug somewhere in the parse→store→load pipeline — including the `detectDateIssue`-on-V2-key bug that only checked `battleDate` (the V2 key) after the V3 migration had already rewritten it to `battleReport_battleDate`.

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseGameRun } from './data-parser';
import { serializeRunsToCsv } from '@/features/data-export/csv-export/csv-exporter';
import { parseCsvImport } from '@/features/data-import/csv-import/csv-parser';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..');
const V28_SAMPLES_DIR = join(REPO_ROOT, 'sampleData', 'v28');

function listV28Samples(): string[] {
  return readdirSync(V28_SAMPLES_DIR)
    .filter((f) => f.toLowerCase().endsWith('.txt'))
    .sort();
}

describe('parser round-trip invariants', () => {
  for (const fileName of listV28Samples()) {
    it(`${fileName} round-trips through CSV export without losing fields`, () => {
      const raw = readFileSync(join(V28_SAMPLES_DIR, fileName), 'utf8');
      const original = parseGameRun(raw);

      const csv = serializeRunsToCsv([original]);
      const [roundTripped] = parseCsvImport(csv).runs;

      const originalKeys = Object.keys(original.fields).sort();
      const roundTrippedKeys = Object.keys(roundTripped.fields).sort();

      expect(roundTrippedKeys, `${fileName}: field set changed across round-trip`).toEqual(originalKeys);

      for (const key of originalKeys) {
        const before = original.fields[key]!;
        const after = roundTripped.fields[key]!;
        expect(after.dataType, `${fileName}: ${key} dataType changed`).toBe(before.dataType);
        expect(after.rawValue, `${fileName}: ${key} rawValue changed`).toBe(before.rawValue);
      }

      // The date-issue detection bug: after V3 migration the battle date
      // lives under `battleReport_battleDate`, not `battleDate`. If the
      // round-tripped run has a valid battleDate field, the parsed-at
      // timestamp must derive from it — not silently fall back to "now".
      const battleDate = roundTripped.fields.battleReport_battleDate;
      if (battleDate && battleDate.rawValue) {
        const ageDays = (Date.now() - roundTripped.timestamp.getTime()) / 86400_000;
        expect(
          ageDays,
          `${fileName}: timestamp silently defaulted to now instead of reading battleReport_battleDate`,
        ).toBeGreaterThan(0.5);
      }
    });
  }
});
```

#### Sample 4: Color uniqueness within a breakdown category

**Path:** `src/shared/domain/fields/breakdown-sources/color-uniqueness.invariant.test.ts`

Not a bug that shipped in V28, but a class of bug the user flagged as painful: two fields in the same breakdown chart getting the same color and becoming indistinguishable in the stacked bar. Cheap to enforce.

```ts
import { describe, expect, it } from 'vitest';
import { COIN_FIELDS, DAMAGE_FIELDS } from './index';
import type { FieldConfig } from './types';

function findColorCollisions(fields: FieldConfig[]): Array<{ color: string; fieldNames: string[] }> {
  const byColor = new Map<string, string[]>();
  for (const f of fields) {
    if (!f.color) continue;
    const normalized = f.color.toLowerCase();
    const existing = byColor.get(normalized) ?? [];
    existing.push(f.fieldName);
    byColor.set(normalized, existing);
  }
  return [...byColor.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([color, fieldNames]) => ({ color, fieldNames }));
}

describe('color uniqueness within breakdown categories', () => {
  it('COIN_FIELDS has no duplicate colors', () => {
    const collisions = findColorCollisions(COIN_FIELDS);
    expect(
      collisions,
      `COIN_FIELDS color collisions (chart series will be indistinguishable):\n${collisions
        .map((c) => `  ${c.color}: ${c.fieldNames.join(', ')}`)
        .join('\n')}`,
    ).toEqual([]);
  });

  it('DAMAGE_FIELDS has no duplicate colors', () => {
    const collisions = findColorCollisions(DAMAGE_FIELDS);
    expect(collisions).toEqual([]);
  });
});
```

Note: `COIN_FIELDS` currently has `coins_goldenTower` and `coins_goldenBot` both using `#fbbf24`. This test would fail on master today, which is exactly the value of the invariant — it flags a real UX bug that slipped in.

### 3h. Pros, cons, honest critique

**Pros**

- Minimal code change. No production files touched.
- Incremental adoption. Every new invariant test is independently valuable — there is no "and then the other 80%" cliff.
- Works with any future architectural choice. If the user later picks approach 2, 5, or 6, every invariant written against the status quo still applies because it is asserted over behavior and file content, not structure.
- Human-readable failure messages. When a test fails, it names the offending field and the two files involved.
- No runtime cost. Invariants run at test time only.
- Teaches the architecture. A new engineer reading the invariant test files learns the cross-file contracts faster than by reading production code.

**Cons**

- Does not improve discoverability. "Where is `coins_goldenTower` used?" is still a grep problem.
- Does not reduce cognitive load when tracing data flow. A field's story is still spread across 7 files.
- Does not eliminate hand-authored duplication. Colors, display names, and section memberships are still declared in multiple places; the tests just make sure they agree.
- Tests can drift too. An exclude list like `COIN_FIELDS_EXPLICIT_EXCLUDES` becomes a dumping ground if nobody polices it. The invariant moves from "enforced consistency" to "enforced with escape hatch."
- Cross-cutting concerns (colors in chart files, hardcoded field names in tier-trend hooks) require a test per concern. Each new test is real effort. The suite grows linearly with the number of cross-file contracts.
- Doesn't help with "missing invariant" — if nobody thought to write a test for "every `cash_*` field must have a per-hour sibling in `cellsPerHour`-style computation," the drift ships. This approach can only enforce invariants that humans identified.

**Honest critique: what this doesn't solve**

The user's pain is at least two-layered:
1. "A field landed in storage but didn't render" — *drift between files*. This approach solves it.
2. "I can't see at a glance what's happening with `coins_goldenTower`" — *cognitive load and discoverability*. This approach does **not** solve it.

If the user's frustration is primarily layer 2, invariant tests feel like putting seatbelts in a car that is still hard to drive. Still safer, still doesn't make driving pleasant.

### 3i. When this approach wins / loses

**Wins when:**

- The existing file organization is defensible but drift-prone.
- The team ships migrations or schema changes frequently and wants red CI to backstop human memory.
- There is no appetite for a larger refactor right now.
- The user wants the safety net to be *additive* and cheap to revert.

**Loses when:**

- The primary pain is "I can't find where this field is used." Tests don't index anything.
- There are more than ~20 cross-cutting concerns per field. The suite of tests becomes its own maintenance burden.
- The team wants a single place to see a field's complete story. That's approaches 4, 5, or 7.
- The derivable metadata (display name, color) is the pain. Write derivation code (approach 6) instead of tests that assert hand-authored values agree.

## 4. Combinations

Invariant tests pair well with every other approach because they are orthogonal — they assert behavior, not structure.

| Pair | Why it works |
|---|---|
| **1 + 6** (invariants + derivation) | Derive display name and color from the field key; write an invariant that asserts every hand-authored override in the override file corresponds to a real `supportedFields.json` key and no two overrides collide. The cheapest path that fixes the immediate V28 pain. |
| **1 + 2** (invariants + central manifest) | The manifest becomes the single source of truth; invariants assert the feature files that *select* from the manifest cover every entry they should. |
| **1 + 5** (invariants + file-per-field composable) | Each field's file declares its capabilities; invariants assert that every field declared as `isCoinSource` is actually rendered by the coin-breakdown UI. |
| **1 + 8** (invariants + traits) | Invariants assert that every trait has at least one consumer, and every consumer covers every field tagged with its trait. |

The user's preferred cheapest path mentioned in the overview is **1 + 6**: derive what can be derived, enforce with tests what can't be derived.

## 5. Adoption path

If the user picks this approach, the sequence of PRs that gets them to the "minimum viable invariant suite" is:

### PR 1 — Foundation (already merged on this branch)

- `src/features/analysis/shared/parsing/v28-sample-parse.invariant.test.ts` (exists)
- `src/shared/domain/fields/breakdown-sources/ui-coverage.invariant.test.ts` (exists)
- `src/shared/domain/migrations/v2-v3-schema-inverse-check.test.ts` (exists)
- `scripts/migration-data-prep/out/v28-field-matrix.csv` (the source-of-truth fixture)

### PR 2 — Catch the "landed in storage, missing from UI" class

- Add `section-config-coverage.invariant.test.ts` (sample 1 above).
- Populate `UNCATEGORIZED_ALLOWED` with the current gap set, so the test goes green on master. Every future field will fail the test by default.
- **Exit criterion:** a new V29 field added to `supportedFields.json` without a section assignment fails CI.

### PR 3 — Catch the "wrong type detected" class

- Add `field-utils-type-detection.invariant.test.ts` (sample 2 above).
- Audit every `battleReport_*` and `_date`/`_time` field for correct type and pin it.
- **Exit criterion:** passing the composite key vs. the display label to the type detector produces the same result.

### PR 4 — Catch silent serialization loss

- Add `parser-roundtrip.invariant.test.ts` (sample 3 above).
- Add round-trip fixtures for V2 exports in addition to V28, so the V2→V3 migration is round-trip-safe.
- **Exit criterion:** every committed sample file survives `parse → serializeRunsToCsv → parseCsvImport` with identical field sets, types, raw values, and a non-defaulted timestamp.

### PR 5 — Catch cross-UI color drift

- Add `color-uniqueness.invariant.test.ts` (sample 4 above).
- Fix the current `coins_goldenTower` / `coins_goldenBot` color collision.
- **Exit criterion:** no two fields in the same breakdown category share a color.

### PR 6 — Optional: trait-ish coverage for future views

- When adding a new analysis view, co-locate a `*-coverage.invariant.test.ts` that asserts the view covers every relevant field from `supportedFields.json`.
- **Exit criterion:** every new view ships with its own coverage invariant.

### Minimum viable suite

If the user wants the absolute cheapest floor that prevents a V28-class incident from recurring, PRs 2 + 3 are enough:

- Section-config coverage (catches missing-from-UI)
- Type-detection invariants (catches wrong-type)

Everything else is defense in depth.

---

## Summary

Invariant tests are the cheapest, most reversible move available. They convert the class of silent-drift bugs that V28 shipped into red CI. They do not improve discoverability and do not reduce cognitive load — if those are the primary pains, pair with approach 6 (derivation) or move to approaches 5, 7, or 8.

The right framing: this is a **safety net**, not an architecture. It catches mistakes against the existing architecture. Whether the architecture itself is the right one is a question the other seven deep-dives address.
