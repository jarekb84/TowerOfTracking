# 03. Codegen from a TypeScript Source-of-Truth

**Parent:** [EXPLORATION-field-registry-architecture.md](../EXPLORATION-field-registry-architecture.md)
**Sibling approaches:** 01 Invariant tests, 02 Central manifest, 04 File-per-field, 05 File-per-field + composable, 06 Algorithmic derivation, 07 Relationship graph, 08 Trait/tag system.

---

## 1. Abstract

One hand-authored TypeScript file (or small directory) declares every field in the system. A build-time generator reads that source and writes all the downstream artifacts the app actually consumes: `sampleData/supportedFields.json`, `COIN_FIELDS` in `coin-sources.generated.ts`, `DAMAGE_FIELDS` in `damage-sources.generated.ts`, the section config for `run-details/`, the `V2_TO_V3_FIELD_MAP` migration, and — optionally — fixture data for tests. The generated files carry a `DO NOT EDIT` header and a pre-commit hook plus CI check guarantee they are never out of sync with the source.

The motivation is that the current Tower of Tracking architecture already expresses field knowledge in ~7 files, and the files already agree *most of the time* because the shapes are simple. The problem is not that the shapes are wrong, it is that **nothing enforces the agreement**. Codegen turns the implicit contract between those files into a mechanical one: the seven consumer files still exist, still look feature-owned, but they are rebuilt from the same source. We have precedent for this pattern in the repo already — `scripts/migration-data-prep/scaffold-v2-to-v3-map.mjs` emits `v2-to-v3-field-map.generated.ts`, and TanStack Router emits `src/routeTree.gen.ts` on every dev build. We already trust codegen in this codebase; this proposal extends it to the field registry.

---

## 2. How it works

### 2.1 Data flow

```
                          fields-schema.ts
                       (HAND-AUTHORED SOURCE)
                                |
                                v
                 +--------------+--------------+
                 |                             |
                 |  scripts/generate-field-    |
                 |  artifacts.mjs              |
                 |  (reads schema, validates,  |
                 |   emits artifacts)          |
                 |                             |
                 +------+----+----+-----+------+
                        |    |    |     |
        +---------------+    |    |     +------------------+
        |                    |    |                        |
        v                    v    v                        v
sampleData/            coin-sources   section-config  v2-to-v3-field-
supportedFields.json   .generated.ts  .generated.ts   map.generated.ts
(JSON array)           (COIN_FIELDS)  (run-details)   (migration table)
                            |              |                 |
                            v              v                 v
                      damage-sources   sampleData/v28   tests that rely on
                      .generated.ts    /__fixtures__/   known field sets
```

The source file is TypeScript so the IDE gives jump-to-definition, autocomplete on section names, and type errors on typos. The generator is a Node `.mjs` script (same style as the V2→V3 scaffold) so it has zero build-time dependencies and runs anywhere `node` runs.

### 2.2 Build integration

Three independent checkpoints ensure generated files cannot go stale:

1. **Developer edits schema → runs `npm run generate:fields`**. This is the intended path; the script writes artifacts and the developer stages both the schema change and the generated diff.
2. **Pre-commit hook** (extending the existing `.husky/pre-commit`): regenerates and `git add`s the generated files automatically. A developer who edits the schema and forgets the script still produces a correct commit.
3. **CI check** (GitHub Action, or part of `integration-precheck`): runs `npm run generate:fields` and then `git diff --exit-code` on the known generated paths. If the working tree is dirty, CI fails with a clear message pointing at which artifact is stale. This is the last-line defense against a developer who bypasses hooks with `--no-verify`.

The third check is load-bearing: hooks can be bypassed, but a failing CI on `main` cannot.

---

## 3. Evaluation

### 3.1 Adding a new V29 field

Suppose V29 adds `coins_plasmaVortex`. Walkthrough:

1. Open `src/shared/domain/fields/schema/fields-schema.ts`.
2. Add one entry to the `FIELDS` array:
   ```ts
   defineField('coins_plasmaVortex', {
     section: 'coins',
     display: 'Plasma Vortex',
     color: '#c084fc',
     contributesTo: 'battleReport_coinsEarned',
     introducedIn: 'v29',
   }),
   ```
3. Run `npm run generate:fields`.
4. Observe four changed files in git:
   - `sampleData/supportedFields.json` — one new entry, alphabetically placed.
   - `coin-sources.generated.ts` — `COIN_FIELDS` gets the new `{ fieldName, displayName, color }` row.
   - `section-config.generated.ts` — `COINS_EARNED_CONFIG.sources` gets it.
   - `v2-to-v3-field-map.generated.ts` — unaffected unless V2 also had a `plasmaVortex` field.
5. Commit the schema edit + all four generated files as one unit.

The developer touched **one file**. The system touched **four**. That is the whole pitch.

### 3.2 Renaming a field

V28 renames `coins_goldenBot` to `coins_goldBot`. Walkthrough:

1. Edit the entry in `fields-schema.ts`: change the key, add `renamedFrom: 'coins_goldenBot'`.
2. Run `npm run generate:fields`.
3. The generator emits the new key into every artifact and writes an entry into `v2-to-v3-field-map.generated.ts` mapping the old key to the new one (so already-stored runs migrate on next load).
4. The generator also optionally emits `v3-field-renames.generated.ts` with a `{ oldKey: newKey }` map consumed by the storage-layer migration.

The renamed field propagates mechanically. The one thing the generator cannot do is **update consumer code that hard-codes the old string in JSX/logic** — those still need a grep. But the surface area of such hardcoded references is small in this codebase (mostly test fixtures) and the generated artifact diffs make them trivially visible in PR review.

### 3.3 Adding a new UI view

This is the approach's **weakest point**. Suppose a new feature adds "Efficiency Dashboard" that wants the union of `coins_*` and `battleReport_*` fields, sorted by a new `efficiencyCategory` trait.

Two options:

**Option A: new artifact**. Add the new trait to the schema (`efficiencyCategory?: 'attack' | 'defense' | 'economy'`) and teach the generator to emit `efficiency-dashboard.generated.ts`. The feature consumes the generated file. This is clean but the generator grows every time a new feature wants a projection.

**Option B: feature consumes existing artifacts**. The Efficiency Dashboard imports `COIN_FIELDS_GENERATED` and `BATTLE_REPORT_ESSENTIAL_GENERATED` directly and composes the view. The generator stays stable; the feature layer does the slicing in pure TypeScript. This is the answer 90% of the time.

The rule of thumb: the generator should emit **data**, not **views**. If the feature's need is "give me every field with this trait," that is a derivable query over the generated dataset, not a new artifact. Only promote to a generated artifact when multiple features need the same slice (like `COIN_FIELDS`, which is used by charts, source-analysis, and run-details).

### 3.4 Discoverability

**Where is this field used?** Currently: grep the raw key across seven files, hope you find all the spots. With codegen:

- One place to look: `fields-schema.ts`.
- "Where is this field *displayed*?" — grep `coins_plasmaVortex` anywhere in `src/`. Every hit except the schema is a generated file, and they all flow from that one source. Find-all-references on the schema entry surfaces every consumer module.
- The schema entry itself carries every fact about the field in one place: its section, its display name, its color, its migration history, its contribution to totals, its introduction version.

This is the main discoverability win. Before: read 7 files to understand a field. After: read 1.

### 3.5 Silent-break modes

The classic codegen trap: *developer edits schema, forgets to run the generator, nothing errors, stale artifact ships*. This is why the build integration in §2.2 has three layers:

| Layer | Catches | Bypassed by |
|---|---|---|
| `npm run generate:fields` | Nothing; it is the happy path | Forgetting to run it |
| `.husky/pre-commit` | Forgotten regen before commit | `git commit --no-verify` |
| CI `git diff --exit-code` | Everything else | Only by someone with admin merge rights, auditable |

Additional defensive measures baked into the output:

- Each generated file opens with a comment block:
  ```ts
  // AUTO-GENERATED by scripts/generate-field-artifacts.mjs
  // Source: src/shared/domain/fields/schema/fields-schema.ts
  // Do not hand-edit. Run `npm run generate:fields` to regenerate.
  ```
- Each generated file exports a `__GENERATED_FROM_SCHEMA_HASH` constant — a SHA-256 of the schema source. A runtime self-check on app startup (dev-only) logs a warning if the constants from different artifacts disagree.
- The generator is **deterministic**: same input, byte-identical output (sorted arrays, stable quoting). A noisy diff on a supposedly-no-op regen is a signal.

One silent-break mode that even CI cannot catch: a developer edits a generated file directly, commits it, runs the generator later which overwrites their change. The `DO NOT EDIT` header mitigates this socially; the pre-commit hook mitigates it mechanically (it regenerates before any commit, so hand edits to generated files get clobbered before they reach `git add`). The only remaining risk is someone disabling the hook and force-committing — which at that point is a process problem, not an architecture problem.

### 3.6 File tree impact

New files:

```
src/shared/domain/fields/
  schema/
    fields-schema.ts              # the hand-authored source
    define-field.ts               # DSL: defineField() + its types
    schema-types.ts               # Field, FieldSection, FieldTrait types
    fields-schema.test.ts         # validates the schema itself (unique keys, valid sections)
  breakdown-sources/
    coin-sources.ts               # thin re-export shim (see §3.7 consumer pattern)
    coin-sources.generated.ts     # NEW: the actual data
    damage-sources.ts             # thin re-export shim
    damage-sources.generated.ts   # NEW
    index.ts                      # unchanged

src/features/game-runs/card-view/run-details/
  section-config.ts               # thin re-export shim
  section-config.generated.ts     # NEW

src/shared/domain/migrations/
  v2-to-v3-field-map.ts           # unchanged (hand-curated authoritative map)
  v2-to-v3-field-map.generated.ts # already exists, expanded in scope
  v3-field-renames.generated.ts   # NEW: for V28→V29-style renames

sampleData/
  supportedFields.json            # now generated (header comment added)

scripts/
  generate-field-artifacts.mjs    # NEW: the generator
  generate-field-artifacts.test.mjs # generator tests (run via node --test)
```

Net: the `breakdown-sources/` and `run-details/` directories each gain one generated sibling. The schema dir is new. One script file under `scripts/`. This is a modest expansion — the file tree remains feature-organized, with generated content clearly marked by naming.

### 3.7 Concrete code samples

#### 3.7.1 The schema DSL

The DSL is intentionally boring. It's a function that returns a typed object literal. No decorators, no classes, no proxies. IDE autocomplete does all the heavy lifting because the section and trait unions are string-literal types.

```ts
// src/shared/domain/fields/schema/schema-types.ts

export type FieldSection =
  | 'battleReport'
  | 'coins'
  | 'cash'
  | 'currencies'
  | 'damage'
  | 'damageBlocked'
  | 'damageTaken'
  | 'bonusHealthGained'
  | 'counts'
  | 'records'
  | 'enemiesHitBy'
  | 'enemiesDestroyedBy'
  | 'killedWithEffectActive'
  | 'totalEnemies'
  | 'utility'
  | 'healthRegenerated'
  | 'ultimateWeapons'
  | 'perks'
  | 'labComponents'
  | 'modules'
  | '_internal'; // synthetic: _date, _time, _notes, _runType, _rank

export type FieldTrait =
  | 'coinSource'
  | 'damageSource'
  | 'killSource'
  | 'summary'
  | 'duration'
  | 'date'
  | 'percentage'
  | 'notGameField';

export type GameVersion = 'v1' | 'v2' | 'v27' | 'v28' | 'v29';

export interface FieldDefinition {
  readonly key: string;                 // e.g., 'coins_goldenTower'
  readonly section: FieldSection;
  readonly display: string;             // 'Golden Tower'
  readonly color?: string;              // '#fbbf24' — only required for chart sources
  readonly contributesTo?: string;      // 'battleReport_coinsEarned'
  readonly perHourFor?: string;         // fields that are the "/hour" form of another
  readonly renamedFrom?: string;        // V28 → V29 rename support
  readonly v2Alias?: string;            // flat V2 key this maps back to
  readonly introducedIn?: GameVersion;
  readonly removedIn?: GameVersion;
  readonly traits?: readonly FieldTrait[];
}

// src/shared/domain/fields/schema/define-field.ts

import type { FieldDefinition } from './schema-types';

export function defineField(
  key: string,
  spec: Omit<FieldDefinition, 'key'>
): FieldDefinition {
  return { key, ...spec };
}
```

The actual schema file is long but visually uniform — every field is one literal with identical shape:

```ts
// src/shared/domain/fields/schema/fields-schema.ts

import { defineField } from './define-field';
import type { FieldDefinition } from './schema-types';

export const FIELDS: readonly FieldDefinition[] = [
  // -------------------------------------------------------------------
  // Battle Report
  // -------------------------------------------------------------------
  defineField('battleReport_tier', {
    section: 'battleReport',
    display: 'Tier',
    traits: ['summary'],
  }),
  defineField('battleReport_wave', {
    section: 'battleReport',
    display: 'Wave',
    traits: ['summary'],
  }),
  defineField('battleReport_coinsEarned', {
    section: 'battleReport',
    display: 'Coins Earned',
    color: '#f59e0b',
    traits: ['summary'],
  }),
  defineField('battleReport_coinsPerHour', {
    section: 'battleReport',
    display: 'Coins / Hour',
    perHourFor: 'battleReport_coinsEarned',
  }),
  defineField('battleReport_realTime', {
    section: 'battleReport',
    display: 'Real Time',
    traits: ['duration', 'summary'],
  }),

  // -------------------------------------------------------------------
  // Coins (sources of battleReport_coinsEarned)
  // -------------------------------------------------------------------
  defineField('coins_deathWave', {
    section: 'coins',
    display: 'Death Wave',
    color: '#ef4444',
    contributesTo: 'battleReport_coinsEarned',
    traits: ['coinSource'],
  }),
  defineField('coins_goldenTower', {
    section: 'coins',
    display: 'Golden Tower',
    color: '#fbbf24',
    contributesTo: 'battleReport_coinsEarned',
    traits: ['coinSource'],
    v2Alias: 'goldenTower',
  }),
  defineField('coins_spotlight', {
    section: 'coins',
    display: 'Spotlight',
    color: '#e2e8f0',
    contributesTo: 'battleReport_coinsEarned',
    traits: ['coinSource'],
  }),
  // ... the full ~150 entries

  // -------------------------------------------------------------------
  // Internal (synthetic app fields)
  // -------------------------------------------------------------------
  defineField('_date', {
    section: '_internal',
    display: 'Date',
    traits: ['date', 'notGameField'],
  }),
  defineField('_runType', {
    section: '_internal',
    display: 'Run Type',
    traits: ['notGameField'],
  }),
];
```

Reading this file top-to-bottom is how you learn the domain. Nothing else is required.

#### 3.7.2 The generator script

```mjs
// scripts/generate-field-artifacts.mjs
#!/usr/bin/env node
// Generates field-registry artifacts from fields-schema.ts.
//
// Read: src/shared/domain/fields/schema/fields-schema.ts (via tsx/jiti)
// Emit:
//   sampleData/supportedFields.json
//   src/shared/domain/fields/breakdown-sources/coin-sources.generated.ts
//   src/shared/domain/fields/breakdown-sources/damage-sources.generated.ts
//   src/features/game-runs/card-view/run-details/section-config.generated.ts
//   src/shared/domain/migrations/v3-field-renames.generated.ts
//
// Deterministic: same schema -> byte-identical output.

import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createJiti } from 'jiti';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SCHEMA_PATH = join(
  REPO_ROOT, 'src', 'shared', 'domain', 'fields', 'schema', 'fields-schema.ts'
);

// Use jiti (already a devDependency) to require the TS schema from a .mjs script.
const jiti = createJiti(import.meta.url, { interopDefault: true });
const { FIELDS } = jiti(pathToFileURL(SCHEMA_PATH).href);

// ------------------------------------------------------------------
// Validation — fail loud before emitting anything
// ------------------------------------------------------------------
function validate(fields) {
  const errors = [];
  const keys = new Set();

  for (const f of fields) {
    if (keys.has(f.key)) errors.push(`Duplicate key: ${f.key}`);
    keys.add(f.key);

    if (!f.key.startsWith('_') && !f.key.includes('_')) {
      errors.push(`Key "${f.key}" is missing section prefix`);
    }
    if (f.traits?.includes('coinSource') && !f.color) {
      errors.push(`"${f.key}" is a coinSource but has no color`);
    }
    if (f.traits?.includes('coinSource') && f.contributesTo !== 'battleReport_coinsEarned') {
      errors.push(`"${f.key}" is a coinSource but does not contributeTo battleReport_coinsEarned`);
    }
  }

  // All contributesTo targets must exist
  for (const f of fields) {
    if (f.contributesTo && !keys.has(f.contributesTo)) {
      errors.push(`"${f.key}" contributesTo unknown field "${f.contributesTo}"`);
    }
  }

  if (errors.length > 0) {
    console.error('Schema validation failed:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

validate(FIELDS);

// ------------------------------------------------------------------
// Hash (for provenance in every emitted file)
// ------------------------------------------------------------------
const schemaSource = readFileSync(SCHEMA_PATH, 'utf8');
const SCHEMA_HASH = createHash('sha256').update(schemaSource).digest('hex').slice(0, 12);

function header(purpose) {
  return [
    `// AUTO-GENERATED by scripts/generate-field-artifacts.mjs`,
    `// Source: src/shared/domain/fields/schema/fields-schema.ts`,
    `// Schema hash: ${SCHEMA_HASH}`,
    `// Purpose: ${purpose}`,
    `//`,
    `// Do not hand-edit. Run \`npm run generate:fields\` to regenerate.`,
    ``,
  ].join('\n');
}

// ------------------------------------------------------------------
// Emitters
// ------------------------------------------------------------------
function emitSupportedFieldsJson() {
  const keys = FIELDS.map((f) => f.key).sort();
  // JSON cannot carry a comment header, so we emit a parallel
  // supportedFields.meta.json with provenance. The JSON file itself is a
  // plain array (contract with old parsers that read it as JSON).
  writeFileSync(
    join(REPO_ROOT, 'sampleData', 'supportedFields.json'),
    JSON.stringify(keys, null, 2) + '\n'
  );
  writeFileSync(
    join(REPO_ROOT, 'sampleData', 'supportedFields.meta.json'),
    JSON.stringify(
      { generatedBy: 'generate-field-artifacts.mjs', schemaHash: SCHEMA_HASH, count: keys.length },
      null,
      2
    ) + '\n'
  );
}

function emitCoinSources() {
  const coinFields = FIELDS
    .filter((f) => f.traits?.includes('coinSource'))
    .sort((a, b) => a.key.localeCompare(b.key));

  const body = coinFields.map((f) =>
    `  { fieldName: '${f.key}', displayName: '${f.display}', color: '${f.color}' },`
  ).join('\n');

  const out = [
    header('COIN_FIELDS — all fields with trait "coinSource".'),
    `import type { FieldConfig } from './types';`,
    ``,
    `export const COIN_FIELDS_GENERATED: FieldConfig[] = [`,
    body,
    `];`,
    ``,
    `export const __COIN_FIELDS_SCHEMA_HASH = '${SCHEMA_HASH}';`,
    ``,
  ].join('\n');

  writeFileSync(
    join(REPO_ROOT, 'src', 'shared', 'domain', 'fields', 'breakdown-sources', 'coin-sources.generated.ts'),
    out
  );
}

function emitSectionConfig() {
  // Group fields by their section-config assignment.
  // The schema declares this indirectly: BATTLE_REPORT_ESSENTIAL is
  // every field with section === 'battleReport' AND trait 'summary'.
  const essential = FIELDS.filter(
    (f) => f.section === 'battleReport' && f.traits?.includes('summary')
  );
  const misc = FIELDS.filter(
    (f) => f.section === 'battleReport' && !f.traits?.includes('summary')
  );

  const renderPlain = (name, label, fields) => {
    const entries = fields
      .map((f) => `    { fieldName: '${f.key}', displayName: '${f.display}' },`)
      .join('\n');
    return [
      `export const ${name}_GENERATED: PlainFieldsConfig = {`,
      label ? `  label: '${label}',` : '',
      `  fields: [`,
      entries,
      `  ],`,
      `};`,
    ].filter(Boolean).join('\n');
  };

  const out = [
    header('Section configs for run-details card view.'),
    `import type { PlainFieldsConfig } from './types';`,
    ``,
    renderPlain('BATTLE_REPORT_ESSENTIAL', null, essential),
    ``,
    renderPlain('BATTLE_REPORT_MISCELLANEOUS', 'MISCELLANEOUS', misc),
    // ... COINS_EARNED_CONFIG, DAMAGE_DEALT_CONFIG, etc.
    ``,
    `export const __SECTION_CONFIG_SCHEMA_HASH = '${SCHEMA_HASH}';`,
    ``,
  ].join('\n');

  writeFileSync(
    join(REPO_ROOT, 'src', 'features', 'game-runs', 'card-view', 'run-details', 'section-config.generated.ts'),
    out
  );
}

function emitV3Renames() {
  const renames = FIELDS
    .filter((f) => f.renamedFrom)
    .sort((a, b) => a.key.localeCompare(b.key));

  const body = renames
    .map((f) => `  '${f.renamedFrom}': '${f.key}',`)
    .join('\n');

  const out = [
    header('V3→V3 field renames across versions (e.g., V28→V29).'),
    `export const V3_FIELD_RENAMES_GENERATED: Record<string, string> = {`,
    body,
    `};`,
    ``,
  ].join('\n');

  writeFileSync(
    join(REPO_ROOT, 'src', 'shared', 'domain', 'migrations', 'v3-field-renames.generated.ts'),
    out
  );
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
emitSupportedFieldsJson();
emitCoinSources();
// emitDamageSources();  // symmetric to coins
emitSectionConfig();
emitV3Renames();

console.log(`Generated artifacts from ${FIELDS.length} field definitions.`);
console.log(`Schema hash: ${SCHEMA_HASH}`);
```

This is ~200 lines including validation and would be under ~300 for the full emitter set. It follows the same patterns as `scaffold-v2-to-v3-map.mjs`: plain Node, file-by-file emission, validation before writes, deterministic output.

#### 3.7.3 npm script + husky hook

```json
// package.json (additions)
{
  "scripts": {
    "generate:fields": "node scripts/generate-field-artifacts.mjs",
    "generate:fields:check": "node scripts/generate-field-artifacts.mjs && git diff --exit-code --name-only -- sampleData/supportedFields.json 'src/**/*.generated.ts'",
    "integration-precheck": "npm run generate:fields:check && npm run lint && npm run type-check && npm run test && npm run e2e"
  }
}
```

```sh
# .husky/pre-commit (additions, existing content preserved)
npm run generate:fields
git add sampleData/supportedFields.json sampleData/supportedFields.meta.json
git add src/shared/domain/fields/breakdown-sources/*.generated.ts
git add src/features/game-runs/card-view/run-details/*.generated.ts
git add src/shared/domain/migrations/*.generated.ts

npm run knip
npm run integration-precheck
git add eslint-suppressions.json
```

The `:check` variant is what CI invokes. It re-runs the generator and then asserts the working tree is clean. Any drift between schema and artifacts produces a non-empty diff and a non-zero exit code.

#### 3.7.4 Consumer refactor

The hand-authored consumer file becomes a one-line re-export. This keeps the public API stable (nothing outside this file imports `COIN_FIELDS_GENERATED`) and preserves the human-readable doc comments that make the codebase legible:

```ts
// src/shared/domain/fields/breakdown-sources/coin-sources.ts
//
// Coin Source Field Definitions
//
// All coin source fields — display name, color, contribution target.
// DATA comes from the generated artifact (driven by fields-schema.ts).
// This file stays hand-authored so consumers get stable import paths
// and rich documentation.

import { COIN_FIELDS_GENERATED } from './coin-sources.generated';
import type { FieldConfig } from './types';

export const COIN_FIELDS: FieldConfig[] = COIN_FIELDS_GENERATED;

// If a hand-override is ever needed for a specific field (e.g., branded
// color that doesn't come from the schema), intercept here:
//   export const COIN_FIELDS: FieldConfig[] = COIN_FIELDS_GENERATED.map((f) =>
//     f.fieldName === 'coins_specialBrand' ? { ...f, color: '#ff00ff' } : f
//   );
```

Every existing consumer of `COIN_FIELDS` keeps working without change. The generated file is an implementation detail.

#### 3.7.5 CI check

```yaml
# .github/workflows/generated-files.yml
name: Generated files up-to-date
on: [pull_request, push]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Regenerate field artifacts
        run: npm run generate:fields
      - name: Verify no drift
        run: |
          if ! git diff --exit-code -- sampleData/supportedFields.json sampleData/supportedFields.meta.json 'src/**/*.generated.ts'; then
            echo "::error::Generated field artifacts are stale."
            echo "::error::Run 'npm run generate:fields' locally and commit the result."
            exit 1
          fi
```

The error message is load-bearing. A failing CI that says "run `npm run generate:fields`" is self-healing. A failing CI that just says "files differ" is mystery-meat.

### 3.8 Pros, cons, honest critique

**Pros**

- **One source of truth, mechanically enforced.** The seven files still exist, but they can't drift because they are rebuilt from one file on every commit.
- **Adding a field is one edit.** The cognitive load of onboarding a new V29 field drops from "read 7 files and guess what to change" to "append one entry."
- **Validation at emit time.** The generator can fail with useful errors (`"coins_goldenTower" is a coinSource but has no color`) before the app ever compiles. Type-level constraints + emit-time validation together catch more than either alone.
- **Reuses an established in-repo pattern.** The migration scaffold script already does this. TanStack Router's route tree already does this. Developers already know what a `.generated.ts` file means.
- **Incremental adoption path.** Start by generating the one file that hurts most today (`supportedFields.json`), prove the pattern, grow.

**Cons**

- **Generated-file IDE ergonomics are genuinely annoying.** "Find all references" on `COIN_FIELDS_GENERATED` lands in the generated file — useful for seeing call sites, but tracing *back* to the schema definition requires a second jump. Stack traces from runtime errors point at `.generated.ts` with line numbers that shift on every regen. Sourcemaps don't help because there's no TypeScript→TypeScript sourcemap standard.
- **Git noise.** Every schema edit produces a diff in N artifact files. PR review gets cluttered. Mitigation: a GitHub `.gitattributes` rule marking `*.generated.ts` with `linguist-generated=true` collapses them in PR views. The diff is still there; it's just hidden by default.
- **The "forgot to run codegen" trap is real.** The three-layer defense in §3.5 mitigates it, but at the cost of pre-commit hook complexity. Developers who routinely `git commit --no-verify` (for speed during spikes) will produce broken commits locally; only CI catches it, and only after they push.
- **Debugging pain.** When a chart renders the wrong color, you trace through `COIN_FIELDS` → `coin-sources.ts` → `coin-sources.generated.ts` → schema entry. Four hops instead of two. The generated step is usually a pass-through, but the cognitive overhead is real.
- **Tooling integration cost.** The generator needs to execute TypeScript from a Node script (jiti works but is a dependency). It needs to match the project's Prettier/ESLint config so emitted code doesn't cause lint failures. Getting deterministic output (stable sorting, consistent quoting, no trailing whitespace) takes iteration.
- **The schema becomes a churn magnet and a merge-conflict magnet.** Every feature touching fields edits the same ~1000-line file. Two parallel PRs adding fields both edit the FIELDS array, often at adjacent lines, producing conflicts that look like "both modified the alphabetical coins section." Mitigation: split the schema into `fields-schema/coins.ts`, `fields-schema/damage.ts`, etc., and have the generator glob them. That shifts the conflict surface from single-file line-contention to whole-file ownership per category.
- **Type safety across the generated boundary is weaker than it looks.** Consumers get the inferred type from the generated file, which was itself emitted from a runtime-typed schema. If the schema's type definition changes, every generated file's emitted types change in lockstep, but this only surfaces at compile time on the next `npm run type-check`.

**Honest assessment of the IDE trap**

This is the single biggest ongoing cost. In a feature-based codebase where discoverability matters, having half the exports live in `.generated.ts` files means developers have to mentally translate "where is this defined" to "where is the schema entry that generated this." It's not a showstopper — TanStack Router has the same issue with `routeTree.gen.ts` and people live with it — but it's a constant low-grade friction that partially offsets the discoverability win from §3.4.

### 3.9 When this wins / when it loses

**Wins when:**
- The number of consumer artifacts is moderate (3–10) and growing. Enough duplication to hurt, not so much that you need a full query layer (approaches 7–8).
- Field shapes are uniform and well-understood. Every field has a section, display, optional color, etc. Not a lot of capability-by-capability variance.
- The team already has codegen mental models from existing tools (TanStack Router, migration scaffolder).
- Build-time validation catches most errors the runtime would otherwise catch.
- The cost of a new field is currently painful.

**Loses when:**
- Fields have highly variable shapes (some have 3 properties, some have 15). The schema type becomes a discriminated union with many branches, and the generator gains a switch per branch. The file-per-field approaches (04, 05) handle shape variance better.
- Consumers need to *attach behavior*, not just read metadata. Codegen produces data; if the damage-sources feature wants to register a custom damage-calculation function against a field, that belongs in a composable-field approach (05), not codegen.
- The team dislikes the IDE ergonomics more than they dislike the drift. This is a cultural question as much as a technical one.
- Very small field counts (~20). The overhead of the generator outweighs the savings.

---

## 4. Scope variations

Codegen is a spectrum, not a binary. From least to most ambitious:

**Variation A — Generate only `supportedFields.json`.** The most painful file today is the one under `sampleData/`. It's used for parser-completeness tests and for validating imports. A drift between it and what the parser actually accepts is a shipped-bug pattern. Generating only this file from a single TS source (`supported-fields.ts`) is a one-day project with immediate payoff. Everything else stays hand-authored. This is the recommended starting point.

**Variation B — Add `COIN_FIELDS_GENERATED` and `DAMAGE_FIELDS_GENERATED`.** The breakdown-sources files carry the most color-drift risk because each UI view has its own color literal. Generating the master lists (while leaving UI-specific selections hand-authored) gives single-source-of-truth for colors without generating the whole section config.

**Variation C — Add `section-config.generated.ts`.** The run-details section config is the biggest file and the one that most often lags when fields are added. Generating it means a new field auto-appears in run details. This is the highest-value but highest-risk artifact because section assignments are more subjective than trait assignments.

**Variation D — Add V2→V3 and V3-rename maps.** Already partially generated (V2→V3 scaffolder exists). Extending to cover V28→V29 renames makes schema-driven rename handling free.

**Variation E — Full codegen (everything above).** Maximum payoff, maximum IDE/git ergonomics cost. Only worth it if variations A–D have been proven in practice and the field count has grown to the point where the schema file is easier to reason about than the seven consumer files.

A team can walk down this list one step per sprint, measuring each step's value before committing to the next.

---

## 5. Migration plan

A concrete, low-risk adoption path:

**Step 1 (1 day) — Generate `supportedFields.json` only.**
- Write `fields-schema.ts` with just the `key` for every known field (no section, no color, no trait — just the string).
- Write a 60-line generator that emits the JSON.
- Wire the pre-commit hook.
- Wire CI check.
- Validate: the generated JSON is byte-identical to the current hand-authored file. Commit.

**Step 2 (1 day) — Enrich the schema.**
- Add `section`, `display`, `traits` to every entry in `fields-schema.ts`. No emission changes yet.
- Add schema validation: every key must have a section; display names must be non-empty.
- The schema file now contains every fact, but only the simplest artifact consumes it.

**Step 3 (2 days) — Generate `coin-sources.generated.ts` and `damage-sources.generated.ts`.**
- Add `color` and `coinSource`/`damageSource` traits to schema entries.
- Refactor the hand-authored `coin-sources.ts` and `damage-sources.ts` into re-export shims per §3.7.4.
- Verify that every feature using `COIN_FIELDS` still renders identically (visual regression pass).

**Step 4 (2–3 days) — Generate `section-config.generated.ts`.**
- Add remaining traits (`summary`, any new grouping traits needed).
- Emit section configs in layers: start with `BATTLE_REPORT_ESSENTIAL` and `COINS_EARNED_CONFIG`, add one config per commit, verify.
- This is the most error-prone step because section-config has subtle labels and ordering. Take it slow.

**Step 5 (1 day) — Add V3 renames support.**
- Add `renamedFrom` field to schema.
- Generate `v3-field-renames.generated.ts`.
- Wire into the storage migration runner.
- Next time V29 renames a field, the migration is a one-line schema edit.

**Step 6 (ongoing) — Extend as new artifacts become valuable.**
- Maybe a `chart-defaults.generated.ts` if chart configs start duplicating.
- Maybe a `duplicate-detection-keys.generated.ts` if run-duplicate logic is hand-synced.
- Each extension follows the same pattern: add traits/properties to schema, write emitter, verify no visual drift, commit.

At the end of Step 5 the codebase has:
- One source file (~1000 lines, boring and uniform).
- Five generated artifacts (~1200 lines, auto-emitted).
- A pre-commit hook and CI check that make drift mechanically impossible.
- Developers whose new-field workflow is "edit one line, run one command, commit."

**`.gitignore` question.** Do generated files belong in git?

Arguments for *committing* them (recommended for this repo):
- PR reviewers can see the emitted effect of a schema change, which surfaces bugs the generator didn't catch.
- First-time contributors can read generated files without running the generator.
- Build pipelines don't need to regenerate on every deploy.
- Matches the precedent of `v2-to-v3-field-map.generated.ts` and `routeTree.gen.ts`, both committed.

Arguments for *ignoring* them:
- No git noise; PRs only show schema diffs.
- No merge conflicts on generated output (the schema conflict is the "real" conflict).
- Smaller repo.

For Tower of Tracking, **commit generated files**. The PR-review-visibility argument is the deciding factor: a schema change whose effects are hidden in an ignored artifact is a schema change no one reviews. The git noise is annoying but collapsible via `.gitattributes linguist-generated`.

---

## 6. Relationship to other approaches

Codegen is composable with every other approach in the exploration:

- **01 Invariant tests + 03 Codegen**: tests verify the generator emits what consumers expect. A regression test says "the emitted COIN_FIELDS_GENERATED contains exactly these 14 keys." This is belt-and-braces.
- **02 Central manifest + 03 Codegen**: codegen *is* a central manifest with a compilation step. If you wrote approach 2, adding codegen on top is incremental.
- **06 Algorithmic derivation + 03 Codegen**: the schema can omit `display` for fields where it's derivable (`coins_goldenTower` → "Golden Tower"). The generator calls the derivation function. The schema file shrinks; the override ability is preserved.
- **07 Relationship graph + 03 Codegen**: the schema's `contributesTo` and `renamedFrom` fields are edges. The generator can emit a graph structure instead of (or in addition to) flat lists. This is the natural evolution path if the field count grows past 300 and relationships get complex.
- **08 Trait system + 03 Codegen**: the `traits: ['coinSource']` field in the DSL *is* a trait system. The generator materializes trait-based queries (`coin-sources.generated.ts` = "all fields with trait `coinSource`"). This is possibly the cleanest combination — codegen gives build-time trait resolution with runtime cost zero.

The most interesting hybrid is probably **03 + 06 + 08**: a schema with traits, algorithmic defaults for display/color, and codegen emitting materialized trait queries. That's a whole separate exploration (maybe a 9th approach) but worth calling out because it combines the strengths of three approaches with manageable additional complexity.
