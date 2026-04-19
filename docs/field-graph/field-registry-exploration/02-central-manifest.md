# Approach 2: Central Field Manifest

**Status:** Exploration · **Parent:** [EXPLORATION-field-registry-architecture.md](../EXPLORATION-field-registry-architecture.md)
**Effort:** M · **Payoff:** M · **Novelty:** Low

---

## 1. Abstract

Every field the Tower of Tracking app knows about is declared **once**, in **one TypeScript file**, as a plain object: `{ key, section, displayName, color, isCoinSource?, isDamageSource?, totalFor?, legacyKeys?, dataType, ... }`. Every feature file that currently hand-maintains a parallel list (`COIN_FIELDS`, `DAMAGE_FIELDS`, `BATTLE_REPORT_ESSENTIAL`, `CATEGORIZED_FIELDS`, `V2_TO_V3_FIELD_MAP`, `sampleData/supportedFields.json`) stops hand-maintaining that list and instead *derives* it from the manifest via a predicate: `FIELDS.filter(f => f.isCoinSource)`, `FIELDS.filter(f => f.section === 'battleReport')`, etc.

The shape is unambitious. It is a flat array of flat objects. The win is not expressiveness — it is *locality*. Today a `coins_goldenTower` field's story is smeared across seven files; with a manifest, the story is one row, and every consumer pulls the same row. That alone eliminates the entire class of "I added the field but forgot to update `supportedFields.json`" bugs that the V28 migration kept hitting.

## 2. How it works

### Mental model

```
                        ┌─────────────────────────────────────────┐
                        │      src/shared/domain/fields/          │
                        │             manifest.ts                 │
                        │                                         │
                        │   export const FIELDS: FieldDef[] = [   │
                        │     { key: 'coins_goldenTower', ... },  │
                        │     { key: 'damage_deathWave',  ... },  │
                        │     { key: 'battleReport_tier', ... },  │
                        │     ... ~150 rows ...                   │
                        │   ]                                     │
                        └───────────────────┬─────────────────────┘
                                            │
         ┌──────────────────┬────────────────┼───────────────────┬──────────────────┐
         │                  │                │                   │                  │
         ▼                  ▼                ▼                   ▼                  ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐ ┌──────────────┐
│ coin-sources.ts  │ │damage-sources │ │section-config│ │ v2-to-v3-       │ │supportedFie- │
│                  │ │     .ts       │ │     .ts      │ │ field-map.ts    │ │lds.json      │
│                  │ │               │ │              │ │                 │ │ (generated)  │
│ FIELDS.filter(   │ │FIELDS.filter( │ │group by      │ │flatMap legacy-  │ │FIELDS.map    │
│  f=>f.isCoin-    │ │f=>f.isDamage- │ │f.section     │ │Keys -> f.key    │ │(f => f.key)  │
│  Source)         │ │Source)        │ │              │ │                 │ │              │
└──────────────────┘ └───────────────┘ └──────────────┘ └─────────────────┘ └──────────────┘
         │                  │                │                   │                  │
         ▼                  ▼                ▼                   ▼                  ▼
   Source Analysis    Source Analysis   Run Details       Import pipeline     Invariant tests
   UI, run-details    UI, run-details   card + field      (migrate V2 runs    (enforce parser
   coin breakdown     damage breakdown  analytics view    on load)            output vs known)
```

The manifest is authored. Everything else is computed. `section-config.ts` still exists — but instead of hand-coding 16 arrays, it `groupBy`s the manifest. `coin-sources.ts` still exists — but it's a one-liner filter. The old constants retain their names so consumers don't need to change imports.

### Type signature for `FieldDef`

The interface is deliberately flat (discriminated unions are used only where they carry real information — the `dataType` field needs one, membership booleans do not):

```typescript
// src/shared/domain/fields/manifest.types.ts

/** Game-export section in V3 canonical form — matches camelCase section prefixes. */
export type FieldSection =
  | 'battleReport'
  | 'cash'
  | 'coins'
  | 'counts'
  | 'currencies'
  | 'damage'
  | 'damageBlocked'
  | 'damageTaken'
  | 'bonusHealthGained'
  | 'healthRegenerated'
  | 'enemiesHitBy'
  | 'enemiesDestroyedBy'
  | 'killedWithEffectActive'
  | 'totalEnemies'
  | 'records'
  | 'utility'
  | '_app'; // synthetic fields injected by the app: _date, _runType, _notes...

/**
 * dataType is a discriminated union — each branch declares what formatting
 * and parsing behavior the field needs. This is the one place a union pulls
 * its weight: a `duration` field really behaves differently from a `bigNumber`.
 */
export type FieldDataType =
  | { kind: 'bigNumber' }                          // coins, damage: shorthand parsing, K/M/B/T render
  | { kind: 'integer' }                            // counts, tier, wave
  | { kind: 'decimal'; fractionDigits?: number }   // percentages, ratios
  | { kind: 'duration' }                           // 7H 45M 35S strings
  | { kind: 'date' }                               // battleReport_battleDate
  | { kind: 'string' }                             // killedBy, notes
  | { kind: 'enum'; values: readonly string[] };   // _runType: farm | tournament

export interface FieldDef {
  // -----------------------------------------------------------------------
  // Identity
  // -----------------------------------------------------------------------
  /** V3 canonical key: `<sectionCamel>_<labelCamel>`. Unique across the manifest. */
  key: string;

  /** Section prefix (parsed from `key`, but explicit for predicate queries). */
  section: FieldSection;

  /** Human-readable label used in every UI ("Death Wave", not "Death Wave Damage"). */
  displayName: string;

  /** Hex color for charts and icons. One color per field, across every view. */
  color: string;

  /** Discriminated union describing parse/format behavior. */
  dataType: FieldDataType;

  // -----------------------------------------------------------------------
  // Membership flags — predicates consume these
  // -----------------------------------------------------------------------
  /** Participates in the Coins Earned breakdown on Source Analysis + Run Details. */
  isCoinSource?: boolean;

  /** Participates in the Damage Dealt breakdown. */
  isDamageSource?: boolean;

  /** Top-of-card summary field in Run Details (Tier, Wave, Killed By...). */
  isSummary?: boolean;

  /** Hidden from UI entirely (internal: _date, _time, _rank, battleReport_battleDate). */
  isInternal?: boolean;

  // -----------------------------------------------------------------------
  // Aggregation relationships
  // -----------------------------------------------------------------------
  /**
   * If set, this field is the total for another breakdown.
   *   e.g. damage_damageDealt   -> { isTotalFor: 'damageDealt' }
   *        battleReport_coinsEarned -> { isTotalFor: 'coinsEarned' }
   *        totalEnemies_totalEnemies -> { isTotalFor: 'enemiesDestroyed' }
   */
  isTotalFor?: BreakdownId;

  /**
   * If set, this field is a PER-HOUR rate for another total.
   *   e.g. battleReport_coinsPerHour -> { isPerHourFor: 'coinsEarned' }
   */
  isPerHourFor?: BreakdownId;

  // -----------------------------------------------------------------------
  // Migration history
  // -----------------------------------------------------------------------
  /**
   * Old V2 flat keys that should be remapped to this `key` at import time.
   * The V2->V3 migration map is DERIVED from these (no separate hand list).
   */
  legacyKeys?: readonly string[];

  /** Field existed in V27 but was removed in V28 (feature cut). Keep for reads of old runs. */
  v27Dropped?: boolean;

  /** First game version that exported this field. Used for coverage/diagnostics. */
  introducedIn?: 'v2' | 'v27' | 'v28' | 'v29';
}

/**
 * Canonical set of breakdown IDs. Referenced by `isTotalFor` and `isPerHourFor`.
 * Kept as a union type so a typo in a manifest row is a TypeScript error.
 */
export type BreakdownId =
  | 'coinsEarned'
  | 'damageDealt'
  | 'enemiesDestroyed'
  | 'upgradeShards'
  | 'rerollShards'
  | 'modules';
```

Note the `BreakdownId` union. It's the small-but-important upgrade over today's stringly-typed `FieldCategory.id`: referencing a breakdown that doesn't exist becomes a compile error, not a silent runtime mismatch.

### Query API

One small helper module replaces the ad-hoc `.filter()` calls so the manifest stays the only file importing `FIELDS`:

```typescript
// src/shared/domain/fields/manifest-queries.ts
import { FIELDS } from './manifest';
import type { BreakdownId, FieldDef, FieldSection } from './manifest.types';

const BY_KEY: ReadonlyMap<string, FieldDef> = new Map(
  FIELDS.map((f) => [f.key, f] as const),
);

export function getField(key: string): FieldDef | undefined {
  return BY_KEY.get(key);
}

export function requireField(key: string): FieldDef {
  const def = BY_KEY.get(key);
  if (!def) throw new Error(`Unknown field: ${key}`);
  return def;
}

export interface FieldQuery {
  section?: FieldSection;
  isCoinSource?: boolean;
  isDamageSource?: boolean;
  isSummary?: boolean;
  isInternal?: boolean;
  isTotalFor?: BreakdownId;
  isPerHourFor?: BreakdownId;
  introducedIn?: FieldDef['introducedIn'];
}

/** Generic selector. Any key set on the query object is AND-ed. */
export function getFields(query: FieldQuery = {}): FieldDef[] {
  return FIELDS.filter((f) => {
    for (const [k, v] of Object.entries(query)) {
      if ((f as Record<string, unknown>)[k] !== v) return false;
    }
    return true;
  });
}

// Common named queries — give the call sites clarity, hide the predicate shape.
export const getCoinSources   = (): FieldDef[] => getFields({ isCoinSource: true });
export const getDamageSources = (): FieldDef[] => getFields({ isDamageSource: true });
export const getSummaryFields = (): FieldDef[] => getFields({ isSummary: true });

export function getSectionFields(section: FieldSection): FieldDef[] {
  return getFields({ section });
}

export function getTotalField(id: BreakdownId): FieldDef | undefined {
  return FIELDS.find((f) => f.isTotalFor === id);
}

export function getPerHourField(id: BreakdownId): FieldDef | undefined {
  return FIELDS.find((f) => f.isPerHourFor === id);
}

/** Full set of known keys — replaces `sampleData/supportedFields.json`. */
export function getAllFieldKeys(): string[] {
  return FIELDS.map((f) => f.key);
}

/** Derive V2 -> V3 remap from `legacyKeys`. Replaces V2_TO_V3_FIELD_MAP. */
export function getLegacyKeyMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of FIELDS) {
    for (const legacy of f.legacyKeys ?? []) out[legacy] = f.key;
  }
  return out;
}
```

## 3. Evaluation

### a. Adding a new V29 field

A V29 update adds `coins_momentumChain` (hypothetical). With the manifest:

1. Open `src/shared/domain/fields/manifest.ts`.
2. Add one row:
   ```typescript
   {
     key: 'coins_momentumChain',
     section: 'coins',
     displayName: 'Momentum Chain',
     color: '#84cc16',
     dataType: { kind: 'bigNumber' },
     isCoinSource: true,
     introducedIn: 'v29',
   },
   ```
3. Done. `COIN_FIELDS`, `CATEGORIZED_FIELDS`, `supportedFields.json` (now derived), `COINS_EARNED_CONFIG`, run-details rendering, source analysis breakdown — all automatically include the new field because they all go through `getFields(...)`.

Compare to today: you'd edit `coin-sources.ts`, `supportedFields.json`, maybe `section-config.ts`, and the field might silently drop out if one of those edits was missed. That's the V28 migration bug class, solved by construction for this operation.

### b. Renaming a field

V28 renamed `coinsFromGoldenTower` (V2 flat key) to `coins_goldenTower`. Today's approach: edit `v2-to-v3-field-map.ts`, edit the supportedFields JSON, edit `COIN_FIELDS`, edit chart configs, pray. With the manifest, the rename is a single row:

```typescript
{
  key: 'coins_goldenTower',             // new canonical
  section: 'coins',
  displayName: 'Golden Tower',
  color: '#fbbf24',
  dataType: { kind: 'bigNumber' },
  isCoinSource: true,
  legacyKeys: ['coinsFromGoldenTower'], // was: the old name, now: migration source
  introducedIn: 'v28',
},
```

The migration map `getLegacyKeyMap()` now returns `{ 'coinsFromGoldenTower': 'coins_goldenTower', ... }` with zero additional code. Display name, color, breakdown membership — none of it needs a second edit.

Honest note: renaming the *canonical* key itself (e.g., changing `coins_goldenTower` to `coins_gtCoins`) still ripples. `section-config.ts` currently references the literal string `'battleReport_tier'`. Those literals become stale. See part (h) for how much this still hurts.

### c. Adding a new UI view

A new "Per-hour Records" view wants every field that has an `isPerHourFor` total plus the Records section. Today: hand-author a list. With the manifest:

```typescript
// src/features/analysis/per-hour-records/fields.ts
import { getFields } from '@/shared/domain/fields/manifest-queries';

export const PER_HOUR_FIELDS = [
  ...getFields({ section: 'records' }),
  ...FIELDS.filter((f) => f.isPerHourFor !== undefined),
];
```

Two lines. The view is automatically complete, and any future V29 field tagged `isPerHourFor: 'cellsEarned'` shows up without the view knowing it existed.

### d. Discoverability

"Where is `coins_goldenTower` used?" — still a grep. But the grep gets dramatically cleaner:

- Today, `coins_goldenTower` appears in `coin-sources.ts`, `supportedFields.json`, `v2-to-v3-field-map.ts`, scattered chart configs — results blur signal and noise.
- With the manifest, the string `'coins_goldenTower'` appears **once**, in `manifest.ts`. Every other hit is either a hard-coded literal reference (e.g., a total field string in `section-config.ts`) or a test. Hard-coded literals become rare because `requireField('coins_goldenTower')` is the usual way to reach a field's metadata.

"What fields does Source Analysis show?" — `getCoinSources()` in a REPL or a test, and you see the complete list with no indirection.

### e. Silent-break modes

**Protects against:**

- *Adding a coin source to the breakdown sources file but forgetting `supportedFields.json`.* Gone — supportedFields is derived.
- *Mismatched colors between Run Details and Source Analysis.* Gone — one color field, both views read it.
- *V2 legacy key exists in the map but its V3 target isn't in the known list.* Gone — inverse check becomes impossible to fail because the map is derived from the list.
- *Parser output includes a key nothing knows about.* Catchable by one invariant test comparing parser output to `getAllFieldKeys()`.

**Still drifts:**

- *Parser doesn't emit a key that the manifest declares.* The manifest says "we know about `coins_momentumChain`" but the parser doesn't produce it. Nothing in the manifest alone catches that. Needs an invariant test that rounds-trips a sample V28 export through the parser and compares to `getAllFieldKeys()`.
- *Color accessibility / contrast issues.* Still hand-authored. If someone picks `#fff` for a summary field on a light badge, only human review catches it.
- *`displayName` that disagrees with the in-game label.* Manifest centralizes it but doesn't validate it against reality. You'd need to compare against a canonical labels list (see [03-codegen.md](03-codegen.md)).
- *Dead rows.* A V27 field that V28 removed and nobody cleaned up still shows in `getAllFieldKeys()`. Mitigated by `v27Dropped: true` + filtering, but it's a manual flag.

### f. File tree impact

Before:

```
src/shared/domain/fields/
  breakdown-sources/
    coin-sources.ts          (30 lines, hand-authored array)
    damage-sources.ts        (29 lines, hand-authored array)
    field-aliases.ts
    discrepancy-config.ts
    discrepancy-calculation.ts
    index.ts                 (re-exports + category configs)
    types.ts                 (FieldConfig, FieldCategory)
src/shared/domain/migrations/
  v2-to-v3-field-map.ts      (~400 hand-authored entries)
sampleData/
  supportedFields.json       (alphabetized list of ~150 keys)
src/features/game-runs/card-view/run-details/
  section-config.ts          (~330 lines, hand-authored config)
```

After:

```
src/shared/domain/fields/
  manifest.ts                   (~400 lines — the big churn file)
  manifest.types.ts             (FieldDef, FieldDataType, BreakdownId)
  manifest-queries.ts           (getFields, getField, etc.)
  manifest.test.ts              (invariants: unique keys, color validity, ...)
  breakdown-sources/
    coin-sources.ts             (3 lines: COIN_FIELDS = toFieldConfigs(getCoinSources()))
    damage-sources.ts           (3 lines)
    index.ts                    (derived categories)
src/shared/domain/migrations/
  v2-to-v3-field-map.ts         (3 lines: export const V2_TO_V3_FIELD_MAP = getLegacyKeyMap())
src/features/game-runs/card-view/run-details/
  section-config.ts             (~120 lines — grouping logic, not data)

sampleData/supportedFields.json   // DELETED — derived via getAllFieldKeys()
```

Six feature files shrink dramatically. One new file (`manifest.ts`) becomes large. The total hand-authored LOC drops by roughly 50-60% for field metadata.

### g. Concrete code samples

#### Full `FieldDef` type

Already shown in section 2. Note the two small but load-bearing choices:

- `dataType` is a discriminated union so `duration` vs `bigNumber` parsing can branch on `kind` exhaustively.
- `isTotalFor` / `isPerHourFor` use a `BreakdownId` union type — typo becomes a compile error.

#### Manifest slice (~30 real-field rows)

```typescript
// src/shared/domain/fields/manifest.ts
import type { FieldDef } from './manifest.types';

export const FIELDS: FieldDef[] = [
  // -------------------------------------------------------------------------
  // App-synthetic (injected by import pipeline, never from game export)
  // -------------------------------------------------------------------------
  { key: '_date',    section: '_app', displayName: 'Date',     color: '#94a3b8',
    dataType: { kind: 'date' },    isInternal: true, introducedIn: 'v2' },
  { key: '_runType', section: '_app', displayName: 'Run Type', color: '#94a3b8',
    dataType: { kind: 'enum', values: ['farm', 'tournament'] as const },
    isInternal: true, introducedIn: 'v2' },
  { key: '_notes',   section: '_app', displayName: 'Notes',    color: '#94a3b8',
    dataType: { kind: 'string' },  isInternal: true, introducedIn: 'v2' },

  // -------------------------------------------------------------------------
  // Battle Report — summary section, top of every run card
  // -------------------------------------------------------------------------
  { key: 'battleReport_tier',          section: 'battleReport', displayName: 'Tier',
    color: '#f97316', dataType: { kind: 'integer' },
    isSummary: true, legacyKeys: ['tier'], introducedIn: 'v2' },
  { key: 'battleReport_wave',          section: 'battleReport', displayName: 'Wave',
    color: '#fb923c', dataType: { kind: 'integer' },
    isSummary: true, legacyKeys: ['wave'], introducedIn: 'v2' },
  { key: 'battleReport_killedBy',      section: 'battleReport', displayName: 'Killed By',
    color: '#ef4444', dataType: { kind: 'string' },
    isSummary: true, legacyKeys: ['killedBy'], introducedIn: 'v2' },
  { key: 'battleReport_gameTime',      section: 'battleReport', displayName: 'Game Time',
    color: '#a3e635', dataType: { kind: 'duration' },
    isSummary: true, legacyKeys: ['gameTime'], introducedIn: 'v2' },
  { key: 'battleReport_realTime',      section: 'battleReport', displayName: 'Real Time',
    color: '#84cc16', dataType: { kind: 'duration' },
    isSummary: true, legacyKeys: ['realTime'], introducedIn: 'v2' },
  { key: 'battleReport_coinsEarned',   section: 'battleReport', displayName: 'Coins Earned',
    color: '#facc15', dataType: { kind: 'bigNumber' },
    isTotalFor: 'coinsEarned', legacyKeys: ['coinsEarned'], introducedIn: 'v2' },
  { key: 'battleReport_coinsPerHour',  section: 'battleReport', displayName: 'Coins / Hour',
    color: '#eab308', dataType: { kind: 'bigNumber' },
    isPerHourFor: 'coinsEarned', legacyKeys: ['coinsPerHour'], introducedIn: 'v2' },
  { key: 'battleReport_cellsEarned',   section: 'battleReport', displayName: 'Cells',
    color: '#22d3ee', dataType: { kind: 'bigNumber' },
    legacyKeys: ['cellsEarned'], introducedIn: 'v2' },
  { key: 'battleReport_battleDate',    section: 'battleReport', displayName: 'Battle Date',
    color: '#94a3b8', dataType: { kind: 'date' },
    isInternal: true, legacyKeys: ['battleDate'], introducedIn: 'v2' },

  // -------------------------------------------------------------------------
  // Coins — breakdown sources for Coins Earned
  // -------------------------------------------------------------------------
  { key: 'coins_deathWave',     section: 'coins', displayName: 'Death Wave',
    color: '#ef4444', dataType: { kind: 'bigNumber' }, isCoinSource: true,
    legacyKeys: ['coinsFromDeathWave'], introducedIn: 'v2' },
  { key: 'coins_goldenTower',   section: 'coins', displayName: 'Golden Tower',
    color: '#fbbf24', dataType: { kind: 'bigNumber' }, isCoinSource: true,
    legacyKeys: ['coinsFromGoldenTower'], introducedIn: 'v2' },
  { key: 'coins_spotlight',     section: 'coins', displayName: 'Spotlight',
    color: '#e2e8f0', dataType: { kind: 'bigNumber' }, isCoinSource: true,
    legacyKeys: ['coinsFromSpotlight'], introducedIn: 'v2' },
  { key: 'coins_goldenBot',     section: 'coins', displayName: 'Golden Bot',
    color: '#fbbf24', dataType: { kind: 'bigNumber' }, isCoinSource: true,
    legacyKeys: ['goldenBotCoinsEarned'], introducedIn: 'v2' },
  { key: 'coins_blackHole',     section: 'coins', displayName: 'Black Hole',
    color: '#475569', dataType: { kind: 'bigNumber' }, isCoinSource: true,
    legacyKeys: ['coinsFromBlackHole', 'coinsFromBlackhole'], introducedIn: 'v2' },
  { key: 'coins_orbs',          section: 'coins', displayName: 'Orbs',
    color: '#fda4af', dataType: { kind: 'bigNumber' }, isCoinSource: true,
    legacyKeys: ['coinsFromOrb', 'coinsFromOrbs'], introducedIn: 'v2' },
  { key: 'coins_goldenCombo',   section: 'coins', displayName: 'Golden Combo',
    color: '#eab308', dataType: { kind: 'bigNumber' }, isCoinSource: true,
    legacyKeys: ['goldenCombo'], introducedIn: 'v2' },
  { key: 'coins_waveSkip',      section: 'coins', displayName: 'Wave Skip',
    color: '#84cc16', dataType: { kind: 'bigNumber' }, isCoinSource: true,
    legacyKeys: ['waveSkip'], introducedIn: 'v2' },
  { key: 'coins_bountyCoins',   section: 'coins', displayName: 'Bounty Coins',
    color: '#facc15', dataType: { kind: 'bigNumber' }, isCoinSource: true,
    legacyKeys: ['bountyCoins'], introducedIn: 'v27' },

  // -------------------------------------------------------------------------
  // Damage — breakdown sources for Damage Dealt
  // -------------------------------------------------------------------------
  { key: 'damage_damageDealt',    section: 'damage', displayName: 'Damage Dealt',
    color: '#f97316', dataType: { kind: 'bigNumber' },
    isTotalFor: 'damageDealt', legacyKeys: ['damage', 'damageDealt'], introducedIn: 'v2' },
  { key: 'damage_deathWave',      section: 'damage', displayName: 'Death Wave',
    color: '#ef4444', dataType: { kind: 'bigNumber' }, isDamageSource: true,
    legacyKeys: ['deathWaveDamage'], introducedIn: 'v2' },
  { key: 'damage_chainLightning', section: 'damage', displayName: 'Chain Lightning',
    color: '#3b82f6', dataType: { kind: 'bigNumber' }, isDamageSource: true,
    legacyKeys: ['chainLightningDamage'], introducedIn: 'v2' },
  { key: 'damage_thorns',         section: 'damage', displayName: 'Thorns',
    color: '#22d3ee', dataType: { kind: 'bigNumber' }, isDamageSource: true,
    legacyKeys: ['thornDamage'], introducedIn: 'v2' },
  { key: 'damage_blackHole',      section: 'damage', displayName: 'Black Hole',
    color: '#475569', dataType: { kind: 'bigNumber' }, isDamageSource: true,
    legacyKeys: ['blackHoleDamage'], introducedIn: 'v2' },
  { key: 'damage_rendArmor',      section: 'damage', displayName: 'Rend Armor',
    color: '#dc2626', dataType: { kind: 'bigNumber' }, isDamageSource: true,
    legacyKeys: ['rendArmorDamage', 'rendArmor'], introducedIn: 'v2' },
  { key: 'damage_electrons',      section: 'damage', displayName: 'Electrons',
    color: '#06b6d4', dataType: { kind: 'bigNumber' }, isDamageSource: true,
    legacyKeys: ['electrons'], introducedIn: 'v27' },

  // -------------------------------------------------------------------------
  // Damage Blocked
  // -------------------------------------------------------------------------
  { key: 'damageBlocked_defense',           section: 'damageBlocked', displayName: 'Defense %',
    color: '#38bdf8', dataType: { kind: 'decimal', fractionDigits: 2 }, introducedIn: 'v27' },
  { key: 'damageBlocked_defenseAbsolute',   section: 'damageBlocked', displayName: 'Defense Absolute',
    color: '#0ea5e9', dataType: { kind: 'bigNumber' }, introducedIn: 'v27' },
  { key: 'damageBlocked_chronoField',       section: 'damageBlocked', displayName: 'Chrono Field',
    color: '#7dd3fc', dataType: { kind: 'bigNumber' }, introducedIn: 'v27' },
  { key: 'damageBlocked_primordialCollapse', section: 'damageBlocked', displayName: 'Primordial Collapse',
    color: '#a855f7', dataType: { kind: 'bigNumber' }, introducedIn: 'v28' },

  // -------------------------------------------------------------------------
  // Utility, Counts, Records
  // -------------------------------------------------------------------------
  { key: 'utility_freeAttackUpgrade',  section: 'utility', displayName: 'Free Attack Upgrade',
    color: '#a3e635', dataType: { kind: 'integer' }, introducedIn: 'v27' },
  { key: 'utility_recoveryPackages',   section: 'utility', displayName: 'Recovery Packages',
    color: '#22c55e', dataType: { kind: 'integer' }, introducedIn: 'v27' },
  { key: 'counts_wavesSkipped',        section: 'counts',  displayName: 'Waves Skipped',
    color: '#84cc16', dataType: { kind: 'integer' }, introducedIn: 'v2' },
  { key: 'counts_deathDefy',           section: 'counts',  displayName: 'Death Defy',
    color: '#f43f5e', dataType: { kind: 'integer' }, introducedIn: 'v27' },
  { key: 'records_highestCoinsMinute', section: 'records', displayName: 'Highest Coins / Minute',
    color: '#fde047', dataType: { kind: 'bigNumber' }, introducedIn: 'v28' },
  { key: 'records_largestWaveSkip',    section: 'records', displayName: 'Largest Wave Skip',
    color: '#84cc16', dataType: { kind: 'integer' }, introducedIn: 'v28' },
];
```

That's 35 rows in the style that would continue for ~150 total. Every row carries the complete story: identity, display, color, type, membership, legacy names, provenance.

#### Before / after diff of `coin-sources.ts`

**Before** (current, hand-authored):

```typescript
// src/shared/domain/fields/breakdown-sources/coin-sources.ts
import type { FieldConfig } from './types';

export const COIN_FIELDS: FieldConfig[] = [
  { fieldName: 'coins_deathWave',    displayName: 'Death Wave',    color: '#ef4444' },
  { fieldName: 'coins_goldenTower',  displayName: 'Golden Tower',  color: '#fbbf24' },
  { fieldName: 'coins_spotlight',    displayName: 'Spotlight',     color: '#e2e8f0' },
  { fieldName: 'coins_goldenBot',    displayName: 'Golden Bot',    color: '#fbbf24' },
  // ... 10 more hand-authored rows ...
];
```

**After** (derived):

```typescript
// src/shared/domain/fields/breakdown-sources/coin-sources.ts
import type { FieldConfig } from './types';
import { getCoinSources } from '../manifest-queries';

/** Kept as a named export so every existing consumer keeps its import path. */
export const COIN_FIELDS: FieldConfig[] = getCoinSources().map((f) => ({
  fieldName: f.key,
  displayName: f.displayName,
  color: f.color,
}));
```

The public API is identical. `DAMAGE_FIELDS` does the same dance. Nothing else in the feature changes.

#### Rewriting `section-config.ts`

The current `section-config.ts` (330 lines) mixes two responsibilities: (a) which fields belong in which section-panel, and (b) the grouping shape Run Details consumes. The manifest absorbs (a); the file keeps (b) as a thin assembler:

```typescript
// src/features/game-runs/card-view/run-details/section-config.ts
import type { BreakdownConfig, PlainFieldsConfig } from './types';
import {
  getFields,
  getCoinSources,
  getDamageSources,
  getTotalField,
  getPerHourField,
} from '@/shared/domain/fields/manifest-queries';

const toFieldConfig = (f: { key: string; displayName: string; color: string }) =>
  ({ fieldName: f.key, displayName: f.displayName, color: f.color });

// ---- Battle Report ----------------------------------------------------------

export const BATTLE_REPORT_ESSENTIAL: PlainFieldsConfig = {
  fields: getFields({ isSummary: true }).map(toFieldConfig),
};

export const BATTLE_REPORT_MISCELLANEOUS: PlainFieldsConfig = {
  label: 'MISCELLANEOUS',
  fields: [
    ...getFields({ section: 'utility' }),
    ...getFields({ section: 'counts' }),
  ].map(toFieldConfig),
};

// ---- Coins Earned breakdown -------------------------------------------------

export const COINS_EARNED_CONFIG: BreakdownConfig = {
  totalField: getTotalField('coinsEarned')!.key,
  perHourField: getPerHourField('coinsEarned')?.key,
  label: 'COINS EARNED',
  sources: getCoinSources().map(toFieldConfig),
};

// ---- Damage Dealt breakdown -------------------------------------------------

export const DAMAGE_DEALT_CONFIG: BreakdownConfig = {
  totalField: getTotalField('damageDealt')!.key,
  label: 'DAMAGE DEALT',
  sources: getDamageSources().map(toFieldConfig),
};

// ---- Records ----------------------------------------------------------------

export const RECORDS_CONFIG: PlainFieldsConfig = {
  label: 'RECORDS',
  fields: getFields({ section: 'records' }).map(toFieldConfig),
};

// ... DAMAGE_BLOCKED, DAMAGE_TAKEN, etc. follow the same pattern:
// a filter against the manifest, mapped to the display shape.

export const SKIP_FIELDS = new Set(
  getFields({ isInternal: true }).map((f) => f.key),
);

export const CATEGORIZED_FIELDS = new Set(
  // Anything with a section prefix we know about — NOT misc.
  getFields().filter((f) => !f.isInternal).map((f) => f.key),
);
```

The file's *shape* is preserved (same exported names, same consumers), but its data disappears. The 330-line hand-authored config becomes a ~100-line assembler. Adding a `damageBlocked_` field to the manifest makes `DAMAGE_BLOCKED_CONFIG` automatically include it.

#### Deriving the V2→V3 map

```typescript
// src/shared/domain/migrations/v2-to-v3-field-map.ts
import { getLegacyKeyMap } from '@/shared/domain/fields/manifest-queries';

/**
 * V2 flat keys -> V3 canonical keys.
 * Derived from FieldDef.legacyKeys in the manifest. Do not edit by hand;
 * add or change `legacyKeys` on the owning manifest row instead.
 */
export const V2_TO_V3_FIELD_MAP: Readonly<Record<string, string>> =
  Object.freeze(getLegacyKeyMap());
```

The current file is ~400 lines of hand-authored mapping — guessed entries, disambiguation notes, legacy spellings — and every entry has to exist in `supportedFields.json` (enforced by an inverse-check test that breaks when anything drifts). With the manifest, both sides of that invariant live in the same row; the invariant becomes impossible to break.

### h. Pros, cons, honest critique

**Pros**

- **Locality.** A field's entire story is on one row. Onboarding new engineers: "open `manifest.ts`, ctrl-F your field, read the row." The 30-second discoverability target is achievable for the first time.
- **Single edit for the expected case.** V29 fields, new coin sources, color tweaks, display-name fixes — all one-row changes.
- **No new runtime dependencies.** It's a TS array and a few pure helper functions. No codegen step, no YAML, no decorators, no metadata framework.
- **Incremental adoption.** The existing feature files keep their exports and their call sites. Consumers don't migrate; consumers' *data source* migrates silently.
- **Type-level safety for cross-references.** `isTotalFor: 'coinsEarned'` is a union-typed `BreakdownId`; a typo doesn't compile.
- **Auto-derivation of `supportedFields.json` and `V2_TO_V3_FIELD_MAP`** eliminates the two worst silent-drift bug sources the V28 migration surfaced.

**Cons — and honest critique**

- **Churn magnet.** Every schema change, every color tweak, every V29 field, every rename — they all land in the same file. Git history for `manifest.ts` will look like a battlefield. Merge conflicts between concurrent PRs are likely. The old world spread the churn over seven files; the new world concentrates it.
- **Flat metadata doesn't express relationships elegantly.** `isTotalFor: 'coinsEarned'` is a string label pointing to a virtual breakdown ID. `legacyKeys: ['coinsFromGoldenTower']` is one field declaring history that logically belongs to the *old* key. This is a flat-array simulation of a small graph. It works for the simple cases (one-total-many-sources, one-current-many-legacy) but rots as soon as a relationship has a shape the schema didn't anticipate. If V30 adds "sub-breakdowns" (a source is itself broken down by sub-source), the flat booleans don't compose — you'd need `isSubSourceOf`, `subSourceTotal`, etc.
- **`totalField` as string reference is a fragile convention.** If someone deletes or renames the total's row, no compile error catches the dangling `isTotalFor: 'coinsEarned'`. An invariant test can catch it (e.g., "every `isTotalFor: X` has a corresponding field, exactly one"), but that's test-time safety, not type-time. See combinations below.
- **Fields in multiple sections don't fit cleanly.** `damage_deathWave` vs `coins_deathWave` vs `enemiesHitBy_deathWave` vs `killedWithEffectActive_deathWave` — today these are four separate fields sharing a label, and the manifest happily models them as four rows with the same `displayName: 'Death Wave'` and the same color. Fine. But if a future feature legitimately wants "*one* field that appears in two places" (e.g., a summary field that's also a breakdown source), the single `section: FieldSection` property forces a choice. You'd need `sections: FieldSection[]` and all the section predicates to update.
- **No protection against parser/manifest drift.** The manifest says "we know these fields." The parser says "I produced these fields." Nothing cross-checks them. An invariant test still has to exist.
- **`displayName` is still hand-authored.** The approach centralizes hand-authoring; it doesn't eliminate it. If "Death Wave" is the label the game uses, a typo is still possible. See approach [06-algorithmic-derivation.md](06-algorithmic-derivation.md) for the follow-up.
- **The manifest file gets long.** 150 rows × ~8 properties × formatted as objects ≈ 400-500 lines. Still readable, but navigation is by section-comment-heading, not by file.

### i. When this approach wins / loses

**Wins when:**

- The pain is "I added a field and forgot to update five other files." That's exactly the V28 migration's pain class.
- The team is small (1-3 contributors) — merge conflicts are manageable.
- Field metadata is mostly flat (name, color, section, handful of flags). The current TowerOfTracking model fits.
- Discoverability matters more than extensibility.

**Loses when:**

- Fields start needing *behavior*, not just metadata. "Here's the custom aggregator for this field," "here's the chart render override" — the flat manifest row gets ugly fast. Approach [05-file-per-field-composable.md](05-file-per-field-composable.md) handles this better.
- Relationships between fields become rich (graph-shaped, with multiple edge types). Approach [07-relationship-graph.md](07-relationship-graph.md) wins.
- Many concurrent contributors edit fields. The single-file churn breaks down; approach [04-file-per-field.md](04-file-per-field.md) distributes it.
- Display names and colors are derivable from the key. Approach [06-algorithmic-derivation.md](06-algorithmic-derivation.md) wins because it eliminates the hand-authored rows entirely.

## 4. Combinations

The manifest composes well with other approaches; it's a weak *foundation*, not a complete solution.

### Manifest + invariant tests (approach 1)

The natural pair. The manifest centralizes; the tests enforce that the centralization stays coherent. Tests to add:

- Every field's `isTotalFor`/`isPerHourFor` points at a valid `BreakdownId` and has exactly one corresponding row.
- Every `legacyKeys` value is unique across the manifest (no two fields claim the same legacy key).
- The parser, run on a known V28 fixture, produces exactly the set `getAllFieldKeys()` — neither more nor fewer.
- Every color in the manifest is a valid 6-digit hex.
- `section` equals the camelCase prefix of `key` (parse consistency).

With these, the "silent drift" bug class the V28 migration triggered becomes test-failure at CI.

### Manifest + trait system (approach 8)

Replace the fixed boolean flags (`isCoinSource`, `isDamageSource`, `isSummary`) with a freeform `tags: Tag[]` array. Adding a new breakdown doesn't require extending `FieldDef`; it's just a new tag and a new predicate. Loses a little compile-time safety, gains a lot of extensibility. Good if the set of "kinds of membership" is still evolving.

### Manifest + algorithmic derivation (approach 6)

Most manifest rows become shorter: `color` and `displayName` are *derived* from `key` by pure functions, and the row only specifies the ones that need an override. The manifest shrinks from ~500 lines of data to ~150 lines of identity + overrides. This is the combo I'd actually ship — it keeps the locality win while eliminating the most boilerplate-heavy fields of each row.

## 5. Migration plan — incrementally, without a big-bang

The manifest can be introduced **alongside** the existing files. Cut one consumer over at a time. Delete old files last. Seven steps:

**Step 1.** Add `src/shared/domain/fields/manifest.ts` and `manifest-queries.ts`, empty and with the type definitions only. No consumers yet. Unit tests for the helpers (`getField`, `getFields`, `getLegacyKeyMap`) using a tiny hand-written fixture.

**Step 2.** Populate the manifest with every field *currently* listed across the seven files. This is boilerplate, ideally scripted from `scripts/migration-data-prep/out/v28-field-matrix.csv` + `supportedFields.json` + `COIN_FIELDS` + `DAMAGE_FIELDS` + `v2-to-v3-field-map.ts`. Run a one-off node script that emits the manifest file as a draft; hand-review the output. **At this stage the manifest exists but no production code uses it.**

**Step 3.** Switch `coin-sources.ts` and `damage-sources.ts` to derive from the manifest (the `export const COIN_FIELDS = getCoinSources().map(...)` one-liner). Run the full test suite. Nothing visible should change; Source Analysis and Run Details should render identically. **First consumer migrated.**

**Step 4.** Add invariants. At this point you have two sources of truth (the manifest and `supportedFields.json`, the manifest and `v2-to-v3-field-map.ts`). Add tests asserting they agree. Any disagreement is a manifest bug; fix it before step 5.

**Step 5.** Derive `V2_TO_V3_FIELD_MAP` from `getLegacyKeyMap()`. The file becomes a 3-liner. Delete the `v2-to-v3-field-map.generated.ts` draft (no longer needed — the manifest is the canonical source). Run migration integration tests against pre-v28 fixtures to confirm byte-identical output.

**Step 6.** Derive `supportedFields.json` from `getAllFieldKeys()`. Two options:
  - (a) Delete the JSON file. Consumers import `getAllFieldKeys()`. Search for every reader of the JSON and rewrite (small number).
  - (b) Keep the JSON file but emit it from a pre-commit hook / build step. Readers don't change. More magical; less principled.
  I'd pick (a).

**Step 7.** Rewrite `section-config.ts` to assemble from manifest queries (shown above). Verify run-details snapshots are unchanged. **The manifest is now the sole source of truth.**

At any step you can pause; the codebase remains consistent because the old files are still the authoritative source for anything not yet migrated. The only rule: once a consumer flips to manifest-derived, its old data file (if any) gets deleted in the same PR — no zombie files.

---

**See also:**

- [01-invariant-tests.md](01-invariant-tests.md) — the cheapest complement; catches what the manifest can't.
- [06-algorithmic-derivation.md](06-algorithmic-derivation.md) — shrinks the manifest by deriving `displayName` and `color` from `key`.
- [08-trait-tag-system.md](08-trait-tag-system.md) — swaps fixed booleans for freeform tags; natural upgrade when membership types multiply.
