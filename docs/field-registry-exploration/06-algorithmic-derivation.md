# 06 — Algorithmic Derivation + Override File

**Status:** Discovery · **Part of:** [EXPLORATION-field-registry-architecture.md](../EXPLORATION-field-registry-architecture.md)
**Effort:** S–M · **Payoff:** M · **Novelty:** Med
**Pairs well with:** [01 Invariant Tests](./01-invariant-tests.md), [08 Trait/Tag System](./08-trait-tag-system.md)

---

## 1. Abstract

The V3 field key already encodes most of what the UI needs to know. `coins_goldenTower` is not an opaque identifier — it is two words glued together. The first half tells us the section (`coins`). The second half, de-camelCased and title-cased, tells us the display name (`Golden Tower`). A stable hash of the whole key gives us a consistent color across every view that renders it. The tail of the label tells us the data type (`*Time` is a duration, `*Date` is a date, `killedBy` is a string, everything else is a number).

Today all of this is hand-authored in `COIN_FIELDS`, `DAMAGE_FIELDS`, `section-config.ts`, `EXACT_FIELD_CONFIGS`, `PATTERN_FIELD_CONFIGS`, and chart-level color literals. That's ~150 fields × ~4 properties = ~600 hand-maintained facts, many of which are trivially derivable. The proposal in this doc is to **derive everything that can be derived from the key itself, and hand-author only the exceptions**. The derivation is a pure function; the overrides are a small, greppable TypeScript file. When V29 adds `coins_retroCannon`, it renders correctly with zero code changes.

---

## 2. How it works

```
                ┌─────────────────────────────┐
                │   V3 key: "coins_goldenTower"│
                └──────────────┬───────────────┘
                               │
              ┌────────────────┼─────────────────┐
              ▼                ▼                 ▼
       deriveSection     deriveDisplayName   deriveColor     deriveDataType
         "coins"          "Golden Tower"     hsl(47, 80%, 55%)  "number"
              │                │                 │                │
              └────────────────┴────────┬────────┴────────────────┘
                                        ▼
                            ┌───────────────────────┐
                            │  deriveFieldMeta(key) │
                            │   (pure function)     │
                            └───────────┬───────────┘
                                        │
                                        ▼
                         ┌──────────────────────────────┐
                         │  field-overrides.ts          │
                         │  { coins_goldenTower: {      │
                         │      color: '#fbbf24'        │
                         │    },                        │
                         │    coins_coinsFromCoinBonuses│
                         │      : { displayName:        │
                         │          'Coin Bonuses' } }  │
                         └──────────────┬───────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │  getFieldMeta(key)    │
                            │  { ...derived, ...override } │
                            └───────────┬───────────┘
                                        │
             ┌──────────────────────────┼─────────────────────────┐
             ▼                          ▼                         ▼
     Coin Sources chart       Run Details section           Time series chart
     (queries by section)     (queries by section)          (queries by key)
```

**Three layers, small surface:**

1. **`src/shared/domain/fields/derive/`** — pure functions that inspect a key and return metadata. No imports of React, no side effects, no access to run data.
2. **`src/shared/domain/fields/field-overrides.ts`** — one object literal where keys are V3 field names and values are partial metadata that wins over derivation.
3. **`src/shared/domain/fields/get-field-meta.ts`** — the composition point. Feature files call `getFieldMeta('coins_goldenTower')` and never think about derivation vs. override.

Feature files no longer carry metadata — they carry **predicates**. `COIN_FIELDS` becomes "every key where `deriveSection(k) === 'coins'`, resolved through `getFieldMeta`." `DAMAGE_FIELDS` becomes the same with `'damage'`. A new UI that wants "every field that's a duration" asks `deriveDataType(k, label) === 'duration'`. The registry is the algorithm.

---

## 3. Evaluation

### a. Adding a new V29 field

This is the headline case. Game patches add fields like `coins_retroCannon`. Today this requires:

1. Adding `"coins_retroCannon"` to `sampleData/supportedFields.json`.
2. Adding an entry to `COIN_FIELDS` in `coin-sources.ts` with a hand-picked color.
3. Possibly adding it to `section-config.ts` if it should appear in run details.
4. Hoping the chart picks it up via the right predicate.

With algorithmic derivation:

1. It appears in a parsed V28 import. `deriveSection` returns `'coins'`. Every coin-section query (chart, run details, source analysis) picks it up automatically.
2. `deriveDisplayName` returns `'Retro Cannon'`. `deriveColor` returns a stable HSL derived from the key hash. `deriveDataType` returns `'number'`.
3. If the color hash lands on something unpleasant or duplicates an adjacent field, add an override entry. If the auto-generated display name is wrong (say the game uses "RetroCannon" but wants "Retro-Cannon MKII"), add an override.

**Zero-code-change is the common case.** Overrides are the rare case.

### b. Renaming a field

V28 renamed `coinsFromGoldenTower` → `coins_goldenTower`. With derivation:

- The V2→V3 migration map still handles the persistence-layer rename (that's not what this layer does).
- `deriveDisplayName` produces `'Golden Tower'` from the new key. The old key, if it ever shows up, produces `'Coins From Golden Tower'` — different display, which is actually a useful tell.
- If a rename changes the *section* (e.g., moving a field from `counts_` to `records_`), derivation follows the rename automatically. No follow-up edits in `section-config.ts`.

### c. Adding a new UI view

A new view (say: "Time-type Fields Comparison") asks: *which fields are durations?* Instead of curating a `DURATION_FIELDS` constant, the view iterates all known keys and keeps those where `deriveDataType(k, label) === 'duration'`. The view picks up new time-type fields automatically as the game evolves.

This is where derivation starts to feel like a system rather than a helper. **The queries become declarative.**

### d. Discoverability

Honest take: this is derivation's **weak spot**. Today a developer asking "what color is `coins_goldenTower`?" can open `coin-sources.ts` and read the hex. With derivation they either run the function mentally (impossible for a hash), call it in the REPL, or look up the override file. In practice:

- For overridden fields: the override file is the single source of truth. Grep wins.
- For derived fields: add a developer tool (`/dev/field-inspector` route, or a Vitest snapshot) that dumps `{ key, display, color, section, dataType }` for every known V3 key. Run it in CI. The snapshot becomes the browsable index.

The inspector tool is a 30-line page; it makes derivation's opacity tractable.

### e. Silent-break modes

The risk: derivation is wrong and nobody notices. Two failure modes:

1. **Wrong display name** — `records_largestSmartMissileStack` derives to `'Largest Smart Missile Stack'`. Fine. `utility_bh` derives to `'Bh'`. Bad. Acronyms and abbreviations break the title-case rule.
2. **Wrong color** — the hash could land on the same hue as an adjacent field in the same chart. Visually confusing, not functionally broken.

Mitigation is invariant tests (approach 1):

- "Every V3 key produces a non-empty display name."
- "No derived display name contains an underscore or a lowercase first word."
- "Every key in `supportedFields.json` produces a display name ≥ 2 characters and ≠ the raw key."
- "For every section, no two fields in that section have HSL hues within 15°." (catches the color-collision case)
- "Every override entry targets a V3 key that currently exists in `supportedFields.json`." (catches stale overrides when fields are removed.)

Invariant tests turn a silent class of bug into a loud CI failure.

### f. File tree impact

Status quo in `src/shared/domain/fields/`:

```
fields/
  breakdown-sources/
    coin-sources.ts       (32 lines, 14 field entries)
    damage-sources.ts     (29 lines, 16 field entries)
    types.ts
    index.ts
  ...
```

After:

```
fields/
  derive/
    derive-section.ts
    derive-section.test.ts
    derive-display-name.ts
    derive-display-name.test.ts
    derive-color.ts
    derive-color.test.ts
    derive-data-type.ts
    derive-data-type.test.ts
    derive-field-meta.ts          (composes the four above)
    index.ts
  field-overrides.ts              (~20 entries today, vs. ~150 hand-authored rows now)
  get-field-meta.ts               (derive + override merge)
  breakdown-sources/
    coin-sources.ts               (now: a predicate, ~5 lines)
    damage-sources.ts             (now: a predicate, ~5 lines)
    index.ts
```

Net: **more files, less content per file.** Each derive function is ~30 lines of pure logic with thorough tests. The overall domain-field LoC drops noticeably.

### g. Concrete code samples

#### g.1 `deriveDisplayName(v3Key)`

```ts
// src/shared/domain/fields/derive/derive-display-name.ts

/**
 * Derive a human-readable display name from a V3 canonical field key.
 *
 * V3 keys are `<sectionCamel>_<labelCamel>`. The section is stripped;
 * the label half is de-camelCased and title-cased.
 *
 * Special transform: the sequence `PerHour` at the end of a label is
 * rendered as ` / Hour` (e.g. `coinsPerHour` → `Coins / Hour`) to match
 * the existing UI convention in section-config.ts.
 *
 * Examples:
 *   battleReport_coinsPerHour → "Coins / Hour"
 *   coins_goldenTower         → "Golden Tower"
 *   damage_deathWave          → "Death Wave"
 *   counts_wavesSkipped       → "Waves Skipped"
 *   records_largestGoldenCombo → "Largest Golden Combo"
 *
 * Known limitations: acronyms (bh, hp, ap) render capitalized but not
 * uppercased. Add them to field-overrides.ts if needed.
 */
export function deriveDisplayName(v3Key: string): string {
  const [, labelCamel = ''] = splitSectionAndLabel(v3Key);

  // Handle the `...PerHour` → `... / Hour` convention.
  const perHourNormalized = labelCamel.replace(/PerHour$/, 'Per Hour');

  // Split camelCase into space-separated words.
  const spaced = perHourNormalized.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

  // Title-case each word.
  const titled = spaced
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

  // Render "Per Hour" as "/ Hour" for consistency with existing UI.
  return titled.replace(/\bPer Hour\b/, '/ Hour');
}

/** Split `coins_goldenTower` into `['coins', 'goldenTower']`. */
export function splitSectionAndLabel(v3Key: string): [string, string] {
  const underscoreIdx = v3Key.indexOf('_');
  if (underscoreIdx === -1) return ['', v3Key];
  return [v3Key.slice(0, underscoreIdx), v3Key.slice(underscoreIdx + 1)];
}
```

```ts
// derive-display-name.test.ts

import { describe, it, expect } from 'vitest';
import { deriveDisplayName } from './derive-display-name';

describe('deriveDisplayName', () => {
  it('strips section and title-cases a simple label', () => {
    expect(deriveDisplayName('coins_goldenTower')).toBe('Golden Tower');
  });

  it('handles damage section fields', () => {
    expect(deriveDisplayName('damage_deathWave')).toBe('Death Wave');
  });

  it('handles multi-word camelCase labels', () => {
    expect(deriveDisplayName('counts_wavesSkipped')).toBe('Waves Skipped');
  });

  it('handles four-word labels', () => {
    expect(deriveDisplayName('records_largestGoldenCombo')).toBe('Largest Golden Combo');
  });

  it('handles the PerHour → / Hour convention', () => {
    expect(deriveDisplayName('battleReport_coinsPerHour')).toBe('Coins / Hour');
  });

  it('handles cellsPerHour the same way', () => {
    expect(deriveDisplayName('battleReport_cellsPerHour')).toBe('Cells / Hour');
  });

  it('handles fields with numbers in the label', () => {
    expect(deriveDisplayName('records_largestSmartMissileStack')).toBe(
      'Largest Smart Missile Stack',
    );
  });

  it('handles `killedBy`-style labels', () => {
    expect(deriveDisplayName('battleReport_killedBy')).toBe('Killed By');
  });

  it('handles killedWithEffectActive section', () => {
    expect(deriveDisplayName('killedWithEffectActive_spotlight')).toBe('Spotlight');
  });

  it('falls back to title-casing the whole string if no section underscore', () => {
    expect(deriveDisplayName('runType')).toBe('Run Type');
  });
});
```

#### g.2 `deriveColor(v3Key)`

```ts
// src/shared/domain/fields/derive/derive-color.ts

/**
 * Derive a stable color for a V3 field key.
 *
 * Requirements:
 *  - Deterministic: same key → same color across every render, every view,
 *    every browser session.
 *  - Distributed: adjacent fields in the same section should (usually) land
 *    on different hues. Collisions are acceptable but should be rare.
 *  - Readable on the dark theme background (#0f0f0f-ish).
 *
 * Approach: FNV-1a hash of the full key → index into a curated palette.
 * The palette is hand-picked for the dark tower-defense theme; it is
 * intentionally NOT a full rainbow because some hues read poorly on dark.
 *
 * Edge cases:
 *  - Empty key returns the palette default (first entry).
 *  - Keys with identical hashes land on the same color — accepted as a
 *    collision event; overrides exist for visual emergencies.
 */
const PALETTE: readonly string[] = [
  '#ef4444', // red
  '#f97316', // orange
  '#fbbf24', // amber
  '#facc15', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#22d3ee', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#a855f7', // violet
  '#d946ef', // fuchsia
  '#f43f5e', // rose
  '#94a3b8', // slate
  '#f59e0b', // amber-dark
  '#06b6d4', // cyan-dark
  '#9333ea', // purple-dark
] as const;

export function deriveColor(v3Key: string): string {
  if (!v3Key) return PALETTE[0];
  const hash = fnv1a(v3Key);
  return PALETTE[hash % PALETTE.length];
}

/** 32-bit FNV-1a hash. Pure, deterministic, cheap. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    // 32-bit FNV prime multiplication with overflow guard.
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash;
}
```

**Palette design note.** The palette above is 16 hex values hand-picked from the existing codebase (they already appear in `coin-sources.ts`, `damage-sources.ts`, and `section-config.ts`, so they are theme-consistent). 16 is chosen because:

- It matches human color-discrimination roughly on a dark background.
- With 16 hues and ~150 fields, expected collisions per section are low (most sections have ≤ 20 fields).
- The adjacent-hue test in invariant checks (hue within 15°) catches the rare bad outcome.

If a future section grows beyond 20 fields and repeatedly collides, bump the palette to 24 and re-run invariant tests; fields without overrides will get new colors, which is a minor visual churn event acceptable at section-growth milestones.

```ts
// derive-color.test.ts

import { describe, it, expect } from 'vitest';
import { deriveColor } from './derive-color';

describe('deriveColor', () => {
  it('is deterministic for the same key', () => {
    expect(deriveColor('coins_goldenTower')).toBe(deriveColor('coins_goldenTower'));
  });

  it('returns a valid 6-digit hex color', () => {
    expect(deriveColor('damage_deathWave')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('returns the default palette entry for an empty key', () => {
    expect(deriveColor('')).toBe('#ef4444');
  });

  it('returns different colors for most adjacent keys', () => {
    const a = deriveColor('coins_goldenTower');
    const b = deriveColor('coins_goldenBot');
    // Not strictly guaranteed, but the design goal: neighbors differ.
    // This test documents the expectation; if it ever fails, the palette
    // needs to grow or the specific pair needs an override.
    expect(a).not.toBe(b);
  });
});
```

#### g.3 `deriveSection(v3Key)`

```ts
// src/shared/domain/fields/derive/derive-section.ts

import { splitSectionAndLabel } from './derive-display-name';

/**
 * Derive the section identifier from a V3 field key.
 *
 *   coins_goldenTower       → "coins"
 *   battleReport_coinsEarned → "battleReport"
 *   damage_deathWave        → "damage"
 *   _date                   → ""           (internal fields have no section)
 *
 * Legacy V2 keys (no underscore, single-word camelCase) are treated as
 * un-sectioned and returned as "". Callers should run V2→V3 migration
 * before calling this function.
 */
export function deriveSection(v3Key: string): string {
  if (v3Key.startsWith('_')) return '';
  const [section] = splitSectionAndLabel(v3Key);
  return section;
}
```

#### g.4 `deriveDataType(v3Key, displayLabel)`

```ts
// src/shared/domain/fields/derive/derive-data-type.ts

import { splitSectionAndLabel } from './derive-display-name';

export type DataType = 'number' | 'duration' | 'date' | 'string';

/**
 * Derive the data type of a field from its key and display label.
 *
 * Rules, in order of precedence:
 *  1. Label ending in "Time" → duration    (realTime, gameTime)
 *  2. Label ending in "Date" → date        (battleDate)
 *  3. Label is exactly "killedBy" or "runType" → string
 *  4. Internal keys `_date`, `_time`       → date
 *  5. Internal key `_notes`, `_runType`    → string
 *  6. Everything else                       → number
 *
 * The DISPLAY LABEL is used (not the raw key) because label-tail patterns
 * are how the game export labels time/date columns. Keys merely prefix
 * the section — they don't carry type information.
 */
export function deriveDataType(v3Key: string, displayLabel: string): DataType {
  if (v3Key === '_date' || v3Key === '_time') return 'date';
  if (v3Key === '_notes' || v3Key === '_runType') return 'string';

  const [, labelCamel] = splitSectionAndLabel(v3Key);

  if (/Time$/.test(labelCamel)) return 'duration';
  if (/Date$/.test(labelCamel)) return 'date';
  if (labelCamel === 'killedBy') return 'string';

  // Label-based fallback (handles cases where the display label differs
  // from the derived camel label, e.g., after an override).
  if (/\bTime$/.test(displayLabel)) return 'duration';
  if (/\bDate$/.test(displayLabel)) return 'date';

  return 'number';
}
```

```ts
// derive-data-type.test.ts

import { describe, it, expect } from 'vitest';
import { deriveDataType } from './derive-data-type';

describe('deriveDataType', () => {
  it('detects duration fields by Time suffix', () => {
    expect(deriveDataType('battleReport_realTime', 'Real Time')).toBe('duration');
    expect(deriveDataType('battleReport_gameTime', 'Game Time')).toBe('duration');
  });

  it('detects date fields by Date suffix', () => {
    expect(deriveDataType('battleReport_battleDate', 'Battle Date')).toBe('date');
  });

  it('treats killedBy as a string', () => {
    expect(deriveDataType('battleReport_killedBy', 'Killed By')).toBe('string');
  });

  it('treats internal _date and _time as date', () => {
    expect(deriveDataType('_date', '')).toBe('date');
    expect(deriveDataType('_time', '')).toBe('date');
  });

  it('defaults to number for money/count labels', () => {
    expect(deriveDataType('coins_goldenTower', 'Golden Tower')).toBe('number');
    expect(deriveDataType('damage_deathWave', 'Death Wave')).toBe('number');
    expect(deriveDataType('counts_wavesSkipped', 'Waves Skipped')).toBe('number');
  });
});
```

#### g.5 `field-overrides.ts`

```ts
// src/shared/domain/fields/field-overrides.ts

import type { FieldMeta } from './types';

/**
 * Hand-authored exceptions to algorithmic derivation.
 *
 * Each entry is a PARTIAL FieldMeta — only the properties that differ from
 * the derived values. When getFieldMeta resolves a key, derivation runs
 * first, then the override is shallow-merged on top.
 *
 * Keep this file SHORT. If it grows past ~30 entries, that's a signal
 * that derivation rules need tuning (not more overrides).
 */
export const FIELD_OVERRIDES: Record<string, Partial<FieldMeta>> = {
  // Display-name override: "Coins From Coin Bonuses" is verbose; the UI
  // has used "Coin Bonuses" since v1. Keep it that way.
  coins_coinsFromCoinBonuses: { displayName: 'Coin Bonuses' },

  // Brand-color override: Golden Tower is the signature feature of the
  // game. Every UI uses the same amber/gold — don't let the hash pick
  // whatever it wants.
  coins_goldenTower: { color: '#fbbf24' },
  cash_goldenTower: { color: '#fbbf24', displayName: 'Golden Tower (Cash)' },

  // Disambiguation: `coins_coinsFetched` renders as "Coins Fetched" by
  // default, but the UI calls this "Guardian Fetched" because Guardians
  // are the mechanic that fetches them.
  coins_coinsFetched: { displayName: 'Guardian Fetched' },

  // Acronym case the title-case rule can't handle.
  bonusHealthGained_fromDeathWave: { displayName: 'HP From Death Wave' },

  // Currency labels that the game export leaves as terse camel — the UI
  // has historically expanded them.
  currencies_medals: { displayName: 'Guardian Medals' },
  currencies_gems: { displayName: 'Guardian Gems' },

  // Brand-color override: Death Wave is always the signature red.
  coins_deathWave: { color: '#ef4444' },
  damage_deathWave: { color: '#ef4444' },
};
```

#### g.6 `getFieldMeta(key)` — the composition point

```ts
// src/shared/domain/fields/get-field-meta.ts

import { deriveSection } from './derive/derive-section';
import { deriveDisplayName } from './derive/derive-display-name';
import { deriveColor } from './derive/derive-color';
import { deriveDataType } from './derive/derive-data-type';
import { FIELD_OVERRIDES } from './field-overrides';
import type { FieldMeta } from './types';

/**
 * Return the fully-resolved metadata for a V3 field key.
 *
 * Derivation runs first (cheap, pure), then the override (if any) is
 * shallow-merged on top. Consumers should never call the derive
 * functions directly — always go through this.
 */
export function getFieldMeta(v3Key: string): FieldMeta {
  const section = deriveSection(v3Key);
  const displayName = deriveDisplayName(v3Key);
  const color = deriveColor(v3Key);
  const dataType = deriveDataType(v3Key, displayName);

  const override = FIELD_OVERRIDES[v3Key] ?? {};

  return {
    key: v3Key,
    section,
    displayName,
    color,
    dataType,
    ...override,
  };
}
```

```ts
// types.ts (shared)

export interface FieldMeta {
  key: string;
  section: string;
  displayName: string;
  color: string;
  dataType: 'number' | 'duration' | 'date' | 'string';
}
```

#### g.7 Before/after: `COIN_FIELDS`

**Before (status quo, 32 lines, 14 hand-authored rows):**

```ts
// src/shared/domain/fields/breakdown-sources/coin-sources.ts (today)

export const COIN_FIELDS: FieldConfig[] = [
  { fieldName: 'coins_deathWave', displayName: 'Death Wave', color: '#ef4444' },
  { fieldName: 'coins_goldenTower', displayName: 'Golden Tower', color: '#fbbf24' },
  { fieldName: 'coins_spotlight', displayName: 'Spotlight', color: '#e2e8f0' },
  { fieldName: 'coins_goldenBot', displayName: 'Golden Bot', color: '#fbbf24' },
  { fieldName: 'coins_coinsFetched', displayName: 'Guardian Fetched', color: '#7c3aed' },
  { fieldName: 'coins_blackHole', displayName: 'Black Hole', color: '#475569' },
  { fieldName: 'coins_coinBonusUpgrade', displayName: 'Coin Bonus Upgrade', color: '#f59e0b' },
  { fieldName: 'coins_coinsFromCoinBonuses', displayName: 'Coin Bonuses', color: '#fb923c' },
  { fieldName: 'coins_orbs', displayName: 'Orbs', color: '#fda4af' },
  { fieldName: 'coins_goldenCombo', displayName: 'Golden Combo', color: '#eab308' },
  { fieldName: 'coins_bountyCoins', displayName: 'Bounty Coins', color: '#facc15' },
  { fieldName: 'coins_criticalCoin', displayName: 'Critical Coin', color: '#f97316' },
  { fieldName: 'coins_waveSkip', displayName: 'Wave Skip', color: '#84cc16' },
  { fieldName: 'coins_coinsWave', displayName: 'Coins / Wave', color: '#a3e635' },
];
```

**After (derivation-powered, 7 lines, auto-extending):**

```ts
// src/shared/domain/fields/breakdown-sources/coin-sources.ts (after)

import { listKnownKeys } from '../known-keys';
import { getFieldMeta } from '../get-field-meta';

export const COIN_FIELDS = listKnownKeys()
  .filter((key) => getFieldMeta(key).section === 'coins')
  .filter((key) => key !== 'coins_coinsEarned') // total, not a source
  .map(getFieldMeta);
```

`listKnownKeys()` reads `sampleData/supportedFields.json` (the known list of V3 keys that's already maintained). No hand-authored metadata — names, colors, and types come from derivation plus the small overrides file. When V29 adds `coins_retroCannon`, `COIN_FIELDS` grows by one entry automatically, rendered with a hash-derived color and `'Retro Cannon'` as the display.

Damage sources shrink identically:

```ts
export const DAMAGE_FIELDS = listKnownKeys()
  .filter((key) => getFieldMeta(key).section === 'damage')
  .filter((key) => key !== 'damage_damageDealt') // total, not a source
  .map(getFieldMeta);
```

Two exclusions across the whole file — the "total" fields. Everything else falls out of the algorithm.

#### g.8 Invariant tests

```ts
// src/shared/domain/fields/field-registry-invariants.test.ts

import { describe, it, expect } from 'vitest';
import supportedFields from '../../../../sampleData/supportedFields.json';
import { getFieldMeta } from './get-field-meta';
import { FIELD_OVERRIDES } from './field-overrides';

describe('field registry invariants', () => {
  it('every known V3 key produces a non-empty display name', () => {
    for (const key of supportedFields as string[]) {
      const meta = getFieldMeta(key);
      expect(meta.displayName.length, `empty display for ${key}`).toBeGreaterThan(0);
    }
  });

  it('no derived display name contains an underscore', () => {
    for (const key of supportedFields as string[]) {
      const meta = getFieldMeta(key);
      expect(meta.displayName, `bad display for ${key}`).not.toMatch(/_/);
    }
  });

  it('every display name starts with an uppercase letter', () => {
    for (const key of supportedFields as string[]) {
      if (key.startsWith('_')) continue; // internal fields are exempt
      const meta = getFieldMeta(key);
      expect(meta.displayName[0], `lowercase start for ${key}`).toMatch(/[A-Z]/);
    }
  });

  it('every known key maps to a non-empty section (except internals)', () => {
    for (const key of supportedFields as string[]) {
      if (key.startsWith('_')) continue;
      const meta = getFieldMeta(key);
      expect(meta.section, `no section for ${key}`).not.toBe('');
    }
  });

  it('every color is a valid hex', () => {
    for (const key of supportedFields as string[]) {
      const meta = getFieldMeta(key);
      expect(meta.color, `bad color for ${key}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('every override targets a currently-known V3 key', () => {
    const knownSet = new Set(supportedFields as string[]);
    for (const overrideKey of Object.keys(FIELD_OVERRIDES)) {
      expect(knownSet.has(overrideKey), `stale override: ${overrideKey}`).toBe(true);
    }
  });
});
```

These six tests together turn the "silent drift" failure mode into a loud CI failure. If V29 renames a field and an override targets the old name, the last test catches it. If a new label breaks the title-case rule, the first two catch it.

### h. Pros, cons, honest critique

**Pros:**

- Eliminates the largest mechanical chunk of hand-authored metadata. `COIN_FIELDS` and `DAMAGE_FIELDS` become derived arrays. `section-config.ts`'s field entries become `getFieldMeta(key)` calls.
- **New V29 fields just work** if they follow the `section_camelLabel` convention. The game's own export format already enforces this structure — the codebase just needs to take advantage.
- Colors are automatically consistent across views because they come from the same function.
- Per-field logic is ~30 LoC of pure functions with ~100% test coverage. Far cheaper to maintain than ~600 scattered metadata rows.
- Composes cleanly with approach 1 (tests) and approach 8 (trait/tag) — those systems can *query* derived metadata instead of duplicating it.

**Cons:**

- **Derivation can be wrong**, and when it's wrong it's wrong silently. Mitigation: invariant tests + an inspector page, but these are extra cost.
- **Overrides can grow.** If everybody adds overrides instead of tuning derivation rules, the override file becomes the new `COIN_FIELDS` — just with an extra indirection. Discipline required: when an override pattern repeats 3+ times, promote the pattern into the derivation rule.
- **Convention is a contributor tax.** A new dev adding `coins_RetroCannon` (capital R in the wrong place) breaks derivation silently. Invariant tests catch it, but the feedback loop is "run the tests" rather than "look at the file."
- **Hashed colors are not always nice-looking.** The palette is curated, so bad *colors* don't happen, but bad *collisions* do. Adjacent fields in the same chart can share a hue. Overrides fix these, but it's reactive.
- **Acronyms lose.** `hp`, `ap`, `bh` render as `Hp`, `Ap`, `Bh`. Either the override file grows a lot or we extend the derivation rule (the latter is better; add a short dictionary of known acronyms to the title-case function).
- **Intentionally terse labels lose.** If the game export uses `currencies_adGems` and we want `"Ad Gems"`, fine. If it uses `currencies_bpXp` and we want `"Battle Pass XP"`, that's an override.

**What this doesn't do:**

- It does **not** express relationships. There's no way to say "`coins_goldenTower` contributes to `battleReport_coinsEarned` as a source." That's approach 7 (relationship graph) or approach 8 (trait system with `#coin-source` tag).
- It does **not** handle the "hide this field entirely" case — that's still a hand-authored `SKIP_FIELDS` set, though it could be expressed as an override tag.
- It does **not** solve the migration history problem — `coinsFromGoldenTower` → `coins_goldenTower` is still handled by the V2→V3 map layer.

### i. When this wins / when it loses

**Wins when** the bulk of the per-field metadata is mechanically derivable from the key — which is exactly the case in Tower of Tracking, where the V3 convention `section_camelLabel` already encodes ~80% of what the UI needs. Wins hardest when the game export format is stable and changes add fields that follow convention (the V28→V29 case we're designing for).

**Loses when** fields carry metadata that isn't in the key:

- Cross-field relationships (source/total pairs, derived-from chains). Need graph or trait system.
- Per-field formatting beyond type (this coin source should show trailing zeros; this one shouldn't). Need a richer metadata layer.
- Semantic groupings that cut across sections (e.g., "all golden-themed fields across coins/cash/damage/etc."). Need tags.

In those cases derivation is the *floor* — use it for display/color/type, then layer a trait or graph system on top for the relational content.

---

## 4. Combinations

**With Approach 1 (invariant tests):**
This is the killer combo. Derivation is only safe if the invariants are enforced. The invariant tests in g.8 above are the minimum. Approach 1's broader tests (every key in `supportedFields.json` must be handled by something, every override targets a real key, every derived color differs from its neighbors) close the remaining holes.

**With Approach 8 (trait/tag system):**
Derivation handles the mechanical metadata (display, color, section, type). Traits handle the relational and semantic metadata (`#coin-source`, `#v28-added`, `#per-hour-field`, `#deprecated`). `getFieldMeta(key)` merges derived + override; `getFieldTraits(key)` returns the trait list. UIs query by either. No overlap, no duplication.

**With Approach 2 (central manifest):**
Manifest becomes the override file. Instead of one giant manifest with every field listed, the manifest carries only overrides and traits; everything else is derived. The result is Approach 6 + 8 expressed as a single file.

**Not a fit with Approach 3 (codegen):**
Derivation makes codegen moot for the display/color/type layer. If you go derivation, you don't need generated `COIN_FIELDS` — you derive it at runtime or module-init time.

**Not a fit with Approach 4/5 (file-per-field):**
File-per-field is the opposite bet: every field's story, hand-authored, one file. Derivation is the bet that most stories are the same. Pick one.

---

## 5. Migration plan

The migration can be staged tightly — one property at a time, one consumer at a time — because `getFieldMeta` can coexist with the existing hand-authored configs indefinitely.

**Step 1 — Land derivation + tests, no consumers change.**
Create `src/shared/domain/fields/derive/` with the four pure functions and their unit tests. Create `field-overrides.ts` (empty, with type). Create `get-field-meta.ts`. Add the invariant test file and make sure it passes against the current `supportedFields.json`. Ship as a PR that adds code but changes no behavior.

**Step 2 — Switch one property for one feature.**
Pick the safest property: display names in `COIN_FIELDS`. Change `coin-sources.ts` to compute display names via `getFieldMeta(key).displayName` while keeping hand-authored colors. Compare output against the old file in a snapshot test. When any field needs an override to match, add it to `field-overrides.ts` — that's real signal about where derivation is insufficient.

**Step 3 — Expand to color.**
Repeat for colors. This is riskier because colors are more visible. Do it behind a feature flag or a branch, visually review the coin sources breakdown chart and the run details cards. Tune the palette or add overrides until the result is at least as good as today. Roll forward.

**Step 4 — Expand to the second feature.**
Do `DAMAGE_FIELDS`. By now the derivation has been battle-tested on coins; damage should go smoothly.

**Step 5 — Replace section-config.ts field arrays.**
`BATTLE_REPORT_ESSENTIAL`, `BATTLE_REPORT_MISCELLANEOUS`, `RECORDS_CONFIG`, etc. all carry hand-authored display names. Replace them with `getFieldMeta(key)` lookups. The section configs shrink to lists of keys; the `displayName` comes from derivation.

**Step 6 — Retire `EXACT_FIELD_CONFIGS` and `PATTERN_FIELD_CONFIGS` in `field-utils.ts`.**
The data-type detection in the parser becomes a single call to `deriveDataType`. Delete the duplicated rules.

**Step 7 — Add the inspector page.**
A `/dev/field-inspector` route that renders a table of every V3 key, its derived metadata, and its override (if any). Ship alongside a Vitest snapshot of the same table so diffs show up in PRs.

At no point in this plan does the app break. Each step is a small PR with a test. If step N reveals that derivation is wrong for some field, either tune the rule (preferred) or add an override (accepted). The override file is the escape hatch — its size is the signal for whether the algorithm needs more work.

---

## 6. One-line takeaway

**The V3 key is already 80% of the registry. Derive the 80%, override the 20%, and let invariant tests catch the rest.**
