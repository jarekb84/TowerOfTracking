# Deep Dive 04: File-per-Field (Pure Data)

**Status:** Exploration · **Related:** [../EXPLORATION-field-registry-architecture.md](../EXPLORATION-field-registry-architecture.md) · Sibling deep-dives: [03-codegen.md](03-codegen.md), [05-file-per-field-composable.md](05-file-per-field-composable.md)

---

## 1. Abstract and motivation

Every one of the app's ~150 game-field concepts gets its own tiny TypeScript file. The file is the field's home: it names the field, declares its display text, its color, its section, its legacy V2 keys, its "is a coin source" flag, and any other pure-data metadata. A Vite `import.meta.glob` loader aggregates every `*.field.ts` in `src/shared/domain/fields/registry/` into one big read-only array. Feature code stops hand-authoring arrays of fields and instead queries the aggregated registry with predicates.

The animating idea is **maximum granularity per field, with nothing composed**. No manifest. No codegen. No behavior-attachment layer. Each field file is plain data — a single default export — and the consumer side writes `getFieldsWhere(f => f.isCoinSource)` instead of maintaining a hand-edited `COIN_FIELDS` list. The big wins are per-field `git blame`, a single obvious place to look when someone asks "what do we know about `coins_goldenTower`?", and natural locality: the field's story is never scattered across seven files. The big cost is 150 files in a directory and painful fan-out when a cross-cutting change (e.g., "every field now needs a `unit` property") hits every file at once.

This document is the pure-data variant. The composable variant — where features *register behavior* against fields rather than read data from them — is covered in [05-file-per-field-composable.md](05-file-per-field-composable.md).

---

## 2. How it works

```
┌─────────────────────────────────────────────────────────────────────────┐
│  src/shared/domain/fields/registry/                                      │
│                                                                          │
│    ┌─ coins/                                                             │
│    │   ├─ coins-earned.field.ts         (total)                          │
│    │   ├─ golden-tower.field.ts                                          │
│    │   ├─ death-wave.field.ts                                            │
│    │   ├─ spotlight.field.ts                                             │
│    │   └─ ...14 total coin source files                                  │
│    │                                                                     │
│    ├─ damage/                                                            │
│    │   ├─ damage-dealt.field.ts          (total)                         │
│    │   ├─ chain-lightning.field.ts                                       │
│    │   └─ ...15 total damage source files                                │
│    │                                                                     │
│    ├─ battle-report/                                                     │
│    ├─ enemies-destroyed/                                                 │
│    ├─ enemies-hit-by/                                                    │
│    ├─ records/                                                           │
│    ├─ currencies/                                                        │
│    ├─ utility/                                                           │
│    ├─ counts/                                                            │
│    ├─ ... (142 files total, grouped by V3 section prefix)                │
│    │                                                                     │
│    ├─ index.ts          ← import.meta.glob loader, query helpers         │
│    └─ types.ts          ← FieldDefinition interface                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ import { getCoinFields, getFieldByKey,
                                  │          getV2MigrationMap } from '…/registry'
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  consumer feature files                                                  │
│    breakdown-sources/coin-sources.ts    → COIN_FIELDS = getCoinFields()  │
│    breakdown-sources/damage-sources.ts  → DAMAGE_FIELDS = getDamageFields() │
│    run-details/section-config.ts        → queries registry by section     │
│    migrations/v2-to-v3-field-map.ts     → built from legacyKeys property  │
│    field-utils.ts (type detection)      → queries registry by fieldType   │
└─────────────────────────────────────────────────────────────────────────┘
```

Key properties of this layout:

- **The registry directory is the source of truth.** No field exists anywhere without a file in `registry/`.
- **Consumer files shrink dramatically.** `coin-sources.ts` goes from a 14-line hand-authored array to a one-line `export const COIN_FIELDS = getCoinFields()`.
- **The loader is a Vite primitive.** `import.meta.glob('./**/*.field.ts', { eager: true })` produces a module map at build time; no dynamic loading, no runtime cost per import.
- **Subfolders are organizational, not semantic.** The category (coin source, damage source, battle-report-essential, etc.) is declared *in the field file*, not inferred from the folder. The folder just keeps 142 files from becoming one flat 142-entry directory.

---

## 3. Evaluation questions

### 3.a Adding a new V29 field

Create one new file. That is the whole workflow.

`registry/coins/v29-new-source.field.ts`:

```ts
import type { FieldDefinition } from '../types';

const field: FieldDefinition = {
  key: 'coins_v29NewSource',
  displayName: 'V29 New Source',
  section: 'coins',
  color: '#c084fc',
  isCoinSource: true,
  fieldType: 'number',
  legacyKeys: [],   // no V2 ancestor
};

export default field;
```

That's it. The Vite glob picks it up on next reload. `getCoinFields()` now returns 15 fields. `COIN_FIELDS` in the consumer file is recomputed. The run-details view, the source analysis breakdown, the chart color picker, and the "known fields" invariant test all see the new field automatically.

The template is short enough to scan and copy in seconds. The field-file template is effectively: one import, one typed object, one default export.

### 3.b Renaming a field

Rename the file, keep the metadata unchanged. Because the `key` is inside the file (not derived from the filename), you have two choices:

- **Identity rename** (e.g., `golden-tower.field.ts` → `gt.field.ts`): rename the file. Zero code changes. The field key stays `coins_goldenTower`.
- **Key rename** (e.g., V28 rebrands "Golden Tower" to "Gold Spike"): edit the `key` inside the file AND push the old key down into `legacyKeys`. Rename the file to match if you want the filename to reflect the new name. No other file in the codebase changes — every consumer reads from the aggregated registry.

The `legacyKeys` array is the migration hook. The V2→V3 migration map is rebuilt from it (see 3.g.6).

### 3.c Adding a new UI view — the worst case

This is the approach's weakest evaluation dimension. Suppose a new "Run Rating" view wants to show three metrics with a custom sort order and color override. With the status quo, you add a `run-rating-config.ts` file next to `section-config.ts` and you're done. With file-per-field, you have three realistic options:

1. **Add a flag to the FieldDefinition interface** (e.g., `isRunRatingSource?: boolean` with an optional `runRatingSortOrder?: number`). Then touch every relevant field file to set it. That's a PR that modifies N files for a single feature — a 150-file fan-out in the worst case even if you only flag 3 fields, because at minimum you're adding an optional property to the type. Other fields don't need edits, but reviewers may want to see a decision recorded ("does `counts_nuke` participate in Run Rating? no"), leading to explicit `isRunRatingSource: false` flags everywhere.
2. **Add a separate `run-rating.ts` consumer file** that hand-lists the three field keys, then looks them up via `getFieldByKey`. Cheap but reintroduces a hand-authored list — the exact pattern the registry was supposed to eliminate.
3. **Introduce a generic `tags: string[]` property** on every field, then set `tags: ['run-rating']` on the three participants. This is effectively the trait/tag approach from deep-dive 08; once you go that way, file-per-field is no longer "pure data" in any meaningful sense. You have become a tag system that happens to store tags in individual files.

None of these is clean. File-per-field optimizes for "one place per field" and pays for it with "many places per feature." If the project is feature-light and field-heavy (lots of new fields, few new views), this is fine. If the project is feature-heavy (new views every sprint), this hurts.

### 3.d Discoverability

Excellent in one direction, mediocre in the other.

- **"What is this field?"** — perfect. One file. Open `coins/golden-tower.field.ts`, read 30 lines, done. `git log` on that file shows every change to anything about Golden Tower ever.
- **"What are all the coin sources?"** — solvable, but not by ls-ing the folder. The folder happens to be named `coins/` but you can't trust folder membership to mean "coin source" (e.g., `coins/coins-earned.field.ts` is a total, not a source). Use `getCoinFields()` in a REPL or IDE "find usages" on the predicate `f.isCoinSource`. Acceptable for devs who know the query helpers exist.
- **"Where is this field used in the UI?"** — same as today: grep for the field key. The registry doesn't help here unless you add back-references, which would duplicate data.

The cognitive model is inverted compared to the status quo. Today you learn the file layout (coin-sources lives here, section-config lives there). With file-per-field you learn the query helpers.

### 3.e Silent-break modes

This is where file-per-field actually *beats* the status quo, but only for a specific class of bug.

**Prevented silent breaks:**
- Color drift across views — the color lives in the field file and is the only source. Consumers can't hand-author a different color without being obviously wrong.
- Display-name drift — same argument.
- "New V28 field not showing in run-details" — if the field file exists and declares a section, the run-details view picks it up via query. Forgetting to add it to `section-config.ts` is no longer a possible failure mode because `section-config.ts` doesn't hand-list fields anymore.

**New silent-break modes introduced:**
- **Field file missing** — someone parses a new raw V28 key and never creates a registry file. The parser still produces data; the UI still shows the value in a fallback "Miscellaneous" bucket. This is the exact bug class the status quo already has. File-per-field doesn't fix parse-side forgetfulness without invariant tests (see Combinations below).
- **Orphaned legacyKeys** — someone renames a field, forgets to push the old key into `legacyKeys`, and old localStorage runs lose that value on migration. The file structure doesn't prevent this.
- **Filename/key mismatch** — `golden-tower.field.ts` declares `key: 'coins_goldenBot'` (typo). The file loads, the key wins. The filename is decorative. A naming-convention invariant test is cheap and recommended (see Combinations).

### 3.f File tree impact

You add ~145 files. Grouped by V3 section prefix, because flat 145 files in one directory is obviously untenable:

```
registry/
├── battle-report/       (10 files)
├── bonus-health-gained/ (1 file)
├── cash/                (3 files)
├── coins/               (14 files)
├── counts/              (9 files)
├── currencies/          (17 files)
├── damage/              (15 files)
├── damage-blocked/      (7 files)
├── damage-taken/        (2 files)
├── enemies-destroyed-by/ (12 files)
├── enemies-hit-by/      (16 files)
├── health-regenerated/  (3 files)
├── killed-with-effect-active/ (6 files)
├── records/             (8 files)
├── total-enemies/       (12 files)
├── utility/             (6 files)
├── index.ts
└── types.ts
```

**Naming conventions (must be strict):**
- Filename: `kebab-case-label.field.ts` — matches the `labelCamel` column from the v28 matrix.
- Folder: `kebab-case-section` — matches the `sectionCamel` column.
- Field key inside file: `<sectionCamel>_<labelCamel>` — the existing V3 canonical convention.

Strictness matters because without it, two fields could collide on filename (`coins/orbs.field.ts` vs `damage/orbs.field.ts` is fine because of folder scoping; `coins/orbs.field.ts` vs `coins/orbs-v2.field.ts` is a smell). Enforce with a naming-lint invariant test.

### 3.g Concrete code samples

#### 3.g.1 The `FieldDefinition` type (`registry/types.ts`)

```ts
export type FieldSection =
  | 'battleReport' | 'bonusHealthGained' | 'cash' | 'coins' | 'counts'
  | 'currencies' | 'damage' | 'damageBlocked' | 'damageTaken'
  | 'enemiesDestroyedBy' | 'enemiesHitBy' | 'healthRegenerated'
  | 'killedWithEffectActive' | 'records' | 'totalEnemies' | 'utility';

export type FieldType = 'number' | 'duration' | 'date' | 'string';

export interface FieldDefinition {
  /** V3 canonical key: `<sectionCamel>_<labelCamel>`. */
  key: string;
  /** Human-readable label for UI. */
  displayName: string;
  /** Section grouping, used for run-details categorization. */
  section: FieldSection;
  /** Hex color. Required — consumers never hand-pick. */
  color: string;
  /** Value shape, drives parsing and formatting. */
  fieldType: FieldType;
  /** V2 legacy keys that map to this field. Used to build the migration map. */
  legacyKeys: string[];

  // Capability flags — purely data, queried via predicates.
  isCoinSource?: boolean;
  isDamageSource?: boolean;
  isEnemiesHitBySource?: boolean;
  isEnemiesDestroyedBySource?: boolean;
  isRunDetailsEssential?: boolean;
  isRecord?: boolean;

  // Optional overrides.
  perHourField?: string;    // link to the /hour counterpart
  totalField?: string;      // this field is a source of... total
}
```

#### 3.g.2 A single field file (`registry/coins/golden-tower.field.ts`)

```ts
import type { FieldDefinition } from '../types';

const field: FieldDefinition = {
  key: 'coins_goldenTower',
  displayName: 'Golden Tower',
  section: 'coins',
  color: '#fbbf24',
  fieldType: 'number',
  legacyKeys: ['coinsFromGoldenTower', 'goldenTowerCoins'],
  isCoinSource: true,
  totalField: 'battleReport_coinsEarned',
};

export default field;
```

30 lines would be generous. This is the whole file. Everything a human or AI could want to know about Golden Tower is here.

#### 3.g.3 A "total" field file (`registry/battle-report/coins-earned.field.ts`)

```ts
import type { FieldDefinition } from '../types';

const field: FieldDefinition = {
  key: 'battleReport_coinsEarned',
  displayName: 'Coins Earned',
  section: 'battleReport',
  color: '#facc15',
  fieldType: 'number',
  legacyKeys: ['coinsEarned'],
  isRunDetailsEssential: true,
  perHourField: 'battleReport_coinsPerHour',
};

export default field;
```

#### 3.g.4 The aggregating `index.ts`

```ts
import type { FieldDefinition, FieldSection } from './types';

// Vite glob: eager means modules are loaded at build time.
// The keys of `modules` are paths like './coins/golden-tower.field.ts'.
const modules = import.meta.glob<{ default: FieldDefinition }>(
  './**/*.field.ts',
  { eager: true }
);

const ALL_FIELDS: readonly FieldDefinition[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.key.localeCompare(b.key));

const FIELDS_BY_KEY = new Map(ALL_FIELDS.map((f) => [f.key, f]));

// ---- Query helpers ----

export function getAllFields(): readonly FieldDefinition[] {
  return ALL_FIELDS;
}

export function getFieldByKey(key: string): FieldDefinition | undefined {
  return FIELDS_BY_KEY.get(key);
}

export function getFieldsWhere(
  predicate: (f: FieldDefinition) => boolean
): FieldDefinition[] {
  return ALL_FIELDS.filter(predicate);
}

export function getFieldsBySection(section: FieldSection): FieldDefinition[] {
  return ALL_FIELDS.filter((f) => f.section === section);
}

export function getCoinFields(): FieldDefinition[] {
  return ALL_FIELDS.filter((f) => f.isCoinSource);
}

export function getDamageFields(): FieldDefinition[] {
  return ALL_FIELDS.filter((f) => f.isDamageSource);
}

/**
 * Build the V2→V3 migration map from every field's legacyKeys.
 * Replaces the hand-authored src/shared/domain/migrations/v2-to-v3-field-map.ts
 * with a derived artifact.
 */
export function getV2MigrationMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of ALL_FIELDS) {
    for (const legacyKey of field.legacyKeys) {
      if (map[legacyKey] && map[legacyKey] !== field.key) {
        throw new Error(
          `Legacy key "${legacyKey}" claimed by both "${map[legacyKey]}" and "${field.key}". ` +
          `Each V2 key must map to exactly one V3 key.`
        );
      }
      map[legacyKey] = field.key;
    }
  }
  return map;
}
```

The `import.meta.glob` with `eager: true` is the critical Vite mechanic. At build time, Vite resolves the pattern into explicit imports and tree-shakes nothing (we want all of them). The runtime cost is one `Object.values` call per page load.

#### 3.g.5 Before/after for a consumer file

**Before** (`breakdown-sources/coin-sources.ts`, hand-authored 14-entry array — see the existing file at `src/shared/domain/fields/breakdown-sources/coin-sources.ts`):

```ts
export const COIN_FIELDS: FieldConfig[] = [
  { fieldName: 'coins_deathWave', displayName: 'Death Wave', color: '#ef4444' },
  { fieldName: 'coins_goldenTower', displayName: 'Golden Tower', color: '#fbbf24' },
  // ...12 more hand-maintained entries
];
```

**After** (`breakdown-sources/coin-sources.ts`, derived):

```ts
import { getCoinFields } from '@/shared/domain/fields/registry';
import type { FieldConfig } from './types';

export const COIN_FIELDS: FieldConfig[] = getCoinFields().map((f) => ({
  fieldName: f.key,
  displayName: f.displayName,
  color: f.color,
}));
```

Three lines of code instead of fifteen. More importantly, adding the next coin source no longer requires editing this file at all.

The same transformation applies to `damage-sources.ts`, to `section-config.ts` (where each `PlainFieldsConfig` becomes `getFieldsBySection('battleReport').filter(f => f.isRunDetailsEssential)`), and to the `supportedFields.json` invariant check.

#### 3.g.6 V2→V3 migration map, derived from field files

**Before** (`src/shared/domain/migrations/v2-to-v3-field-map.ts`, hand-maintained):

```ts
export const V2_TO_V3_FIELD_MAP: Record<string, string> = {
  coinsFromGoldenTower: 'coins_goldenTower',
  coinsFromDeathWave: 'coins_deathWave',
  // ...~150 entries
};
```

**After** (`src/shared/domain/migrations/v2-to-v3-field-map.ts`, derived):

```ts
import { getV2MigrationMap } from '@/shared/domain/fields/registry';

export const V2_TO_V3_FIELD_MAP: Record<string, string> = getV2MigrationMap();
```

The migration map is now *generated from the registry at module load time*, with a duplicate-legacy-key check baked into `getV2MigrationMap`. If two field files claim the same V2 key, the app fails loudly at startup instead of silently overwriting one mapping.

### 3.h Pros, cons, honest critique

**Pros:**
- **Per-field git blame is ideal.** `git log registry/coins/golden-tower.field.ts` tells you the complete history of Golden Tower — color changes, display-name tweaks, legacy-key additions — in one timeline.
- **One place to look per field.** When a user reports "Golden Tower looks wrong in Run Rating", you open one file first.
- **Natural locality.** All metadata about one concept sits together. This matches how humans think about a field.
- **Adding a field is trivial.** One file, no edits to other files, no churn magnet.
- **Migration-map derivation catches conflicts.** Two files can't claim the same V2 key without a build-time error.
- **Consumer files become query expressions.** Readers don't need to trust a hand-maintained list; they see the predicate directly.

**Cons:**
- **150+ files.** Even grouped by section, the directory is dense. IDE file-tree navigation gets slower. Cmd-P fuzzy search returns many candidates.
- **Opening files one at a time is tedious.** For reviews like "audit every field's color for WCAG contrast", you want to see the full table at once. File-per-field forces you to either open many tabs or write a one-off script.
- **Cross-cutting changes hit all 150 files.** Adding a required property (e.g., "every field now declares a `unit`") requires editing every field file. Codemod-able, but still a 150-file PR.
- **Glob-import performance.** 150 `.field.ts` modules at build time is fine — measured in low milliseconds for Vite — but the first time it becomes 500 files, you'll notice. Eager loading also means no code-splitting for the registry; the whole thing ships to the client.
- **Strict naming conventions are load-bearing.** Without lint enforcement, filename/key mismatches silently succeed.
- **Feature fan-out is bad.** New UI view = property added to every field file (or separate list, which defeats the point).
- **Discoverability for capability queries is indirect.** "What are all coin sources?" requires knowing about `getCoinFields` or the `isCoinSource` predicate; `ls coins/` is misleading.

**Mitigations:**
- **Bootstrap with codegen.** Don't hand-write 150 files. Write a one-time script that reads the current `section-config.ts`, `coin-sources.ts`, `damage-sources.ts`, and `v2-to-v3-field-map.ts`, and emits all 150 field files. This is deep-dive 03's territory used as a migration tool, not an ongoing build step.
- **Bulk-edit scripts.** Keep a `scripts/registry/` folder with small scripts: "add property X to every file in /coins", "normalize all colors to tailwind tokens". Cross-cutting changes become one script invocation.
- **Invariant tests** (deep-dive 01) compensate for missing compile-time guarantees: every `coins_*` key claimed by a parsed run maps to a field file, filename matches key, no orphaned `legacyKeys`.
- **Keep the directory section-grouped.** Flat is worse.

### 3.i When this wins, when it loses

**Wins when:**
- The project has strong per-field churn. New fields are added often; individual fields get color/display tweaks often.
- Git-blame culture is strong. Teams that actually read `git log` on a file get a lot of value.
- Cross-cutting changes are rare. The `FieldDefinition` interface is stable; adding a new property is a once-a-year event.
- AI agents are a major consumer. One-file-per-concept is easy for an LLM to reason about with limited context.

**Loses when:**
- The project is feature-heavy. New UI views appear often, each wants slightly different per-field properties.
- The field set is small (<30). At that size, a single manifest file is strictly better.
- Teams prefer "one screen = all fields at a glance" reviews. File-per-field makes bulk audits painful.
- Mobile / low-end builds matter. 150 eagerly-imported modules is not free.

**The honest verdict for this codebase:** probably too granular. We have ~150 fields but the churn pattern is mixed — we add fields in V28-size batches (not one-at-a-time), and new views show up every few sprints. A central manifest (deep-dive 02) or manifest-plus-traits (02 + 08) will almost certainly feel better in practice. File-per-field is in the options list because it optimizes the specific axis the user mentioned ("each field's story in one place"), not because it is the best all-around fit.

---

## 4. Combinations

### 4 + 1 (file-per-field + invariant tests)

The natural pairing. File-per-field eliminates *one* class of drift (metadata scattered across consumer files) but doesn't prevent *parser-side* forgetfulness or naming-convention violations. Invariant tests fill those gaps:

- `registry.invariant.test.ts` — every file in `registry/**/*.field.ts` has a filename matching its `key`.
- `registry.invariant.test.ts` — every V28 field observed in `sampleData/v28/*.txt` has a corresponding registry file.
- `migration.invariant.test.ts` — every legacy key in the current `v2-to-v3-field-map.ts` appears in exactly one field file's `legacyKeys`.
- `supported-fields.invariant.test.ts` — `sampleData/supportedFields.json` is bit-identical to `getAllFields().map(f => f.key)`.

Cheap. High value. Recommended as a hard requirement if this approach is picked.

### 4 + 3 (file-per-field + codegen for bootstrap)

Use codegen once, to generate the initial 150 files from the current configs. The output is not "generated" in the ongoing sense — the files are authored from that point forward — but the bootstrap is automated so a human doesn't have to hand-create 150 files. After bootstrap, the codegen script is retired or kept as a one-off bulk-edit tool.

This is the strongly recommended adoption path if file-per-field is chosen.

### 4 + 8 (file-per-field + traits)

If flag fan-out (3.c option 1) becomes painful, replace the boolean capability flags (`isCoinSource`, `isDamageSource`, etc.) with a `tags: string[]` property. Query helpers become `getFieldsByTag('coin-source')`. This is deep-dive 08's idea applied inside individual files. At that point the registry is more of a tag system with per-field files than a pure-data store; see deep-dive 08 for the tradeoffs.

---

## 5. Migration plan

A big-bang rewrite is unnecessary and risky. Incremental cut-over:

### Phase 1: Bootstrap the registry (no consumer changes)

1. Add `types.ts` with the `FieldDefinition` interface.
2. Write a one-time script (`scripts/migration-data-prep/generate-registry.mjs`) that:
   - Reads `breakdown-sources/coin-sources.ts` → seeds `isCoinSource: true` on those fields.
   - Reads `breakdown-sources/damage-sources.ts` → seeds `isDamageSource: true`.
   - Reads `section-config.ts` → seeds `section` and `isRunDetailsEssential`.
   - Reads `v2-to-v3-field-map.ts` → seeds `legacyKeys`.
   - Reads `scripts/migration-data-prep/out/v28-field-matrix.csv` → ensures every V28 field has a file.
   - Emits one `registry/<section>/<label>.field.ts` per field.
3. Add `registry/index.ts` with the glob loader and query helpers.
4. Commit. No consumer touches yet — registry is dormant.

### Phase 2: Cut over one consumer at a time

Each consumer cut-over is its own PR. Order matters — cheapest and most isolated first.

1. **Migration map** (`v2-to-v3-field-map.ts`) → `V2_TO_V3_FIELD_MAP = getV2MigrationMap()`. Add unit test asserting the derived map equals the hand-authored one before deletion. Delete the hand-authored file once green.
2. **Coin sources** (`coin-sources.ts`) → `COIN_FIELDS = getCoinFields().map(...)`. Same snapshot-equality check before cutover.
3. **Damage sources** (`damage-sources.ts`) → same pattern.
4. **Section config** (`section-config.ts`) → larger PR, cut one section at a time (BATTLE_REPORT_ESSENTIAL first, then MISCELLANEOUS, etc.).
5. **supportedFields.json** → replaced by `getAllFields().map(f => f.key)` in the relevant test/validator.

After each PR, run `npm run integration-precheck`. If the snapshot comparison passes and E2E is green, the cutover is safe.

### Phase 3: Remove scaffolding

1. Delete the hand-authored consumer files.
2. Add the invariant tests from the 4+1 combination.
3. Document the "add a new field" workflow in `CLAUDE.md`.
4. (Optional) Retire or archive the bootstrap codegen script.

### Rollback posture

Every phase is independently revertable because consumers are cut over one at a time. If the registry proves painful two months in, revert to whatever subset of consumers have been cut over and keep the rest hand-authored. The registry then lives as a "source of truth for migration and bootstrap", not the single source of truth — a less ambitious but still useful outcome.

---

## 6. Summary

File-per-field (pure data) is the most granular realistic option. It nails per-field git blame and per-field locality, and the Vite `import.meta.glob` primitive makes the aggregation almost free. It suffers on cross-cutting changes, directory density, and feature fan-out. For this codebase specifically — 150 fields, mixed churn patterns, a handful of cross-cutting features per year — it is a defensible but probably not optimal choice. The combinations (4+1 invariant tests, 4+3 bootstrap codegen) make it materially better. If the user's deepest preference is "I open exactly one file and see everything about this field", this is the approach that delivers on that preference most literally.

For the hybrid that keeps the file-per-field spine but lets features *register behavior* against each field (rather than store flags that features query), see [05-file-per-field-composable.md](05-file-per-field-composable.md).
