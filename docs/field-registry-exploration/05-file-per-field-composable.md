# 05 — File-per-field with Behavior Composition

**Status:** Discovery · **Parent:** [EXPLORATION-field-registry-architecture.md](../EXPLORATION-field-registry-architecture.md) · **Sibling:** [04-file-per-field.md](./04-file-per-field.md)

This is the composable variant of file-per-field. The pure variant (04) puts one field's data in one file. This variant puts one field's **behavior** in one file — parse rules, migration aliases, display, section membership, breakdown role, aggregation strategy — and lets features consume those behaviors through a registry query API.

---

## 1. Abstract

Put the field at the center. Make each field a small domain object. Let features attach capabilities to it.

The ~150 field concepts in Tower of Tracking don't just have *data* — they have *behavior*. `coins_goldenTower` has a parse rule (extract from the "Coins" section, label "Golden Tower", V28 number). It has a legacy alias (`coinsFromGoldenTower` from V2). It has a display name and a color. It's a source that contributes to `battleReport_coinsEarned`. It shows up in the Economic section of the run-details card. It's aggregatable by sum across runs. It shouldn't be duplicate-key fodder.

Today those seven behaviors are declared in seven different files. Each file maintains its own list of what's in it. Drift is the default state. The fields don't own their story; the feature files do, and the field key is just the thread tying them together.

This approach inverts that relationship: **the field file is the author of its own story, and features are readers.**

### The metaphor

Think of each field as a small actor. It knows what it is and what it can do. When the run-details card wants to render the Economic section, it doesn't consult a hand-maintained list of "what goes in Economic." It asks the registry:

> "Give me every field that has registered an `appearsInSection('economic')` capability, ordered by its registered sort position."

When the Coin Sources chart wants to render, it asks:

> "Give me every field that has registered a `coin-source` capability, with its registered color."

When the V2→V3 migration runs, for every V2 key it asks:

> "Which field claims this legacy key as a `legacyAlias` capability?"

The fields **opt in** to features. Features **discover** fields. There is no central list to keep in sync because there's no central list at all — the list is a query.

This is the most creative approach in the set. It's also the one with the largest surface area if you let it grow unchecked. The rest of this document is about making that trade honestly.

---

## 2. How it works

### The four actors

```
+------------------------+     +------------------------+
|   Field definition     |     |    Capability module   |
|   (one file per field) |---->|   (one per capability) |
|   golden-tower.field.ts|     |   is-coin-source.ts    |
+------------------------+     +------------------------+
            |                              ^
            | registers                    | defines shape
            v                              |
+------------------------------------------+
|         Field Registry (in-memory)       |
|  Map<fieldKey, Field>                    |
|  Map<capabilityName, Set<fieldKey>>      |
+------------------------------------------+
            ^
            | queries
            |
+------------------------+
|   Feature consumers    |
|   run-details card     |
|   coin-sources chart   |
|   v2 migration         |
|   parser type detector |
|   aggregation engine   |
+------------------------+
```

### Flow of control, by feature

**Run import (V28 parser, type detection):**

1. Parser produces `(section, label, value)` triples.
2. For each triple, derive the V3 key (`<sectionCamel>_<labelCamel>`).
3. Registry lookup: `registry.getField(key)`.
4. If found, the field tells the parser how to coerce the value: `field.detectType(rawValue)` returns `'number' | 'duration' | 'string' | 'date'`.
5. If not found, fall back to the current pattern-based heuristic *and* report the unknown key to an "unregistered fields" telemetry sink (more on this below).

**V2 → V3 migration:**

1. Pre-flight: walk all fields, collect `field.legacyKeys` into a lookup map `legacyKey -> canonicalKey`. Cache on first run.
2. For each V2 key, consult the lookup. Missing = stays un-migrated (current behavior).
3. No separate `V2_TO_V3_FIELD_MAP`. The mapping lives on the field that owns the canonical identity.

**Run-details card, Economic section:**

```ts
const fields = registry.query({
  appearsInSection: 'economic',
})
```

The feature does not declare a list. It queries.

**Coin Sources chart:**

```ts
const sources = registry.query({
  hasCapability: 'coin-source',
  where: (c) => c.totalField === 'battleReport_coinsEarned',
})
```

The feature asks for the capability by name and receives the fields that opted in.

**Aggregation across runs (daily/weekly rollups):**

```ts
const strategy = field.capability('aggregation')?.strategy ?? 'sum'
```

The field carries its own aggregation strategy. The time-series engine reads it; it does not own a separate table.

### Reverse capabilities

The subtle move: **the capability module defines the shape**, the field **provides the data**.

A feature doesn't just read capabilities — it *publishes* the capability contract. The coin-sources module declares "a `coin-source` capability must have `{ totalField: string; color: string; aliases?: string[] }`." The field file then asserts one of those with its own values.

This makes the capability a typed contract between the field and the feature. Type errors surface at the field file, not at the feature. Tools (IDE jump-to-definition, grep, AI) can find:

- "who defines the `coin-source` capability contract?" → one file.
- "who registers `coin-source`?" → N field files, trivially greppable.
- "who consumes `coin-source`?" → grep for `hasCapability: 'coin-source'`.

---

## 3. Evaluation

### 3a. Adding a new V29 field

Imagine V29 introduces `Storm Gem Cascade` in a new `Coins` sub-section.

**One file**, roughly 30 lines:

```ts
// src/shared/domain/fields/coins/storm-gem-cascade.field.ts
import { defineField } from '../field-registry'

export const stormGemCascade = defineField('coins_stormGemCascade')
  .parseFrom({ section: 'Coins', label: 'Storm Gem Cascade', type: 'number' })
  .display({ name: 'Storm Gem Cascade', color: '#60a5fa' })
  .appearsInSection('economic', { order: 15 })
  .withCapability('coin-source', {
    totalField: 'battleReport_coinsEarned',
  })
  .aggregates({ strategy: 'sum' })
  .build()
```

That is the entire change. No other file is edited. The registry auto-loads this file (see file-tree below), so every feature that queries `coin-source` immediately includes it. The chart gets the color. The run-details Economic section gets the row. The parser knows the type. Future V2→V3 migration would only get a line if a legacy equivalent surfaced; V29-native fields have no legacy keys.

**Compare to today's ~7-file change.** This is the single strongest selling point of the approach.

### 3b. Renaming a field

Fields have one true key. Renames happen.

If `coins_goldenTower` ever needs to become `coins_goldenTowerTotal`:

1. Rename the file: `golden-tower.field.ts` → still fine, filename is flavor; the key is what matters.
2. Change the key in the `defineField('coins_goldenTowerTotal')` line.
3. Add the old key to `.legacyKeys('coins_goldenTower')`.

Crucially, **no feature file changes.** The run-details section, the coin-sources chart, the color choice all still point at "whatever field is registered for this capability." The key change is absorbed by the field file itself, with the old key preserved as a migration alias.

The one caveat: persisted run data on disk still has `coins_goldenTower`. The registry's alias map resolves it at load time, same path the V2→V3 migration uses. There is a single canonical alias mechanism.

### 3c. Adding a new UI view

The most boring case, which is the point. Say a new view wants "all fields that are coin-related but are *not* part of the main total (i.e. `cash_*` but also any field tagged `coin-adjacent`)."

```ts
// in the new view's hook
const fields = registry.query({
  anyCapability: ['cash-source', 'coin-adjacent'],
})
```

No upstream edits. The view's hook declares what it wants. Any existing field that was tagged `cash-source` shows up. Future fields tagged the same way show up for free. The view does not maintain a list.

This is the inversion that matters: **views do not own field lists; they own field queries.**

### 3d. Discoverability — "where is `coins_goldenTower` used?"

This is the approach's *best* case.

Open `src/shared/domain/fields/coins/golden-tower.field.ts`. Read it top to bottom. Every capability registered is a use site:

```ts
export const goldenTower = defineField('coins_goldenTower')
  .parseFrom({ section: 'Coins', label: 'Golden Tower', type: 'number' })
  .legacyKeys('coinsFromGoldenTower')                    // V2 migration
  .display({ name: 'Golden Tower', color: '#fbbf24' })   // UI
  .appearsInSection('economic', { order: 4 })            // run-details card
  .withCapability('coin-source', {                       // coin-sources chart
    totalField: 'battleReport_coinsEarned',
  })
  .aggregates({ strategy: 'sum' })                        // time-series
  .build()
```

To answer "where is this used?" you read this file. Every line is a one-sentence answer.

Compared to today's grep-across-seven-files: this is the single largest ergonomic win after "adding a new field."

### 3e. Silent-break modes — what enforces registrations?

This is where the approach earns its reputation for "magic." Left untended, the failure modes are:

1. **Forget to register a capability.** The field exists but is invisible to the feature. E.g. a new coin source is added but `.withCapability('coin-source', …)` is omitted. The field loads fine; the coin-sources chart silently excludes it. No compiler error.

2. **Typo in capability name.** `.withCapability('coin-source', …)` vs `.withCapability('coinSource', …)`. TypeScript sees both as strings unless the capability registry is typed.

3. **Capability contract drift.** The `coin-source` contract says `totalField: string`. A field registers with `totalField: null` because the author didn't know. Runtime surprise.

4. **Two fields claim a conflicting capability.** Two fields register as `totalField` for the same category. The chart picks one arbitrarily.

5. **A feature queries a capability that no field has registered.** The chart renders empty. No warning.

**Enforcement toolkit:**

- **Type the capability name as a discriminated union.** (See §3g, Capability Types.) `withCapability` becomes a generic over the capability name, which narrows the payload type. Typo-protection is at tsc time.

- **Invariant tests (same pattern as approach 01).** One invariant: "every capability name referenced in feature `query()` calls must have at least one registering field." Lint for it with a test that introspects the registry after load.

- **Invariant: single-producer capabilities are single-producer.** E.g. "the `coin-source` capability is many-producer but the `is-total-for:coinsEarned` capability is single-producer."

- **Dev-mode warnings for unknown fields seen at parse time.** If the parser sees `storm_gemCascade` and no field is registered for that key, log a warning. Optional: a feature-flagged "strict mode" that throws in CI.

- **Integration test per feature**: "the Coin Sources chart renders N rows, where N is the count of fields with `coin-source` capability." Asserts the feature is hooked to the registry.

The point: this approach *requires* an enforcement layer. Without it, silent drift is worse than the status quo because there's no explicit list to grep. **The registry must be paired with invariants or it's a trap.**

### 3f. File tree impact

A proposed layout:

```
src/shared/domain/fields/
  field-registry.ts                 # the Map + query API
  define-field.ts                   # the builder (DSL)
  capabilities/                     # capability contracts (one per capability)
    is-coin-source.ts
    is-damage-source.ts
    appears-in-section.ts
    aggregation.ts
    parse-from.ts
    display.ts
    legacy-keys.ts
  fields/                           # one file per field, grouped by domain prefix
    battle-report/
      tier.field.ts
      wave.field.ts
      coins-earned.field.ts         # total (declares is-total-for:coinsEarned)
      cells-earned.field.ts
      game-time.field.ts            # duration type
      ...
    coins/
      death-wave.field.ts
      golden-tower.field.ts
      spotlight.field.ts
      ...
    damage/
      death-wave.field.ts
      chain-lightning.field.ts
      ...
    damage-blocked/
    damage-taken/
    enemies-hit-by/
    enemies-destroyed-by/
    killed-with-effect-active/
    records/
    currencies/
    counts/
    utility/
    cash/
    health-regenerated/
    bonus-health-gained/
  index.ts                          # imports all *.field.ts for side-effect registration
  __invariants__/
    every-capability-has-producer.test.ts
    every-field-has-parse-and-display.test.ts
    no-duplicate-keys.test.ts
    every-legacy-key-unique.test.ts
```

Notable:

- **One file per field, grouped by section prefix.** ~150 files, ~12 directories, each directory 5–25 files. Each directory is browsable.
- **Capabilities as first-class modules.** Shape + docs + types in one place per capability.
- **An index.ts for eager load.** Because registration is a side effect (`.build()` calls `registry.register(this)`), every field file must be loaded for the registry to be complete. The index imports all of them. This is the one ceremonial file.
- **Invariant tests live next to the registry.** If someone adds a capability consumer but not a test asserting producers exist, it's their responsibility — but PR reviews catch it and the pattern is close at hand.

On file count: yes, 150+ field files is a lot. Two counter-arguments:

1. The file *count* is high; the *churn* is low. Once a field is defined, its file barely changes. The existing `coin-sources.ts` churns every time any coin source is added or tweaked. A per-field file churns only for that field.

2. IDEs handle this fine. Grep handles this fine. What humans struggle with is a 300-line config file that encodes implicit relationships. 150 30-line field files that each tell a complete story are ergonomically easier, not harder.

### 3g. Concrete code samples

This is the section that has to pull its weight. I'll pick one style and justify it, then show three real fields, then show a feature-side refactor.

#### Style choice: typed fluent builder

Three candidate styles:

1. **Plain object literal.** `{ key, parse, display, capabilities: { coinSource: { ... } } }`. Wins on clarity. Loses on ergonomics for optional capabilities and on enforcement of capability shapes (you'd need an enormous union type on the single object).

2. **Decorator-style class.** `@Field('coins_goldenTower') @CoinSource(...) @AppearsInSection(...) class GoldenTower {}`. Wins on locality. Loses because we're in a plain Vite/TS app without experimental decorator support enabled, and enabling it just for this is a tax.

3. **Fluent builder.** `defineField(key).withCapability(...).build()`. Wins on capability discoverability (autocomplete shows what you can register), typability (each chained method returns a narrower type), and extensibility (new capabilities = new builder methods without rewriting existing fields). Loses on slight verbosity and on the risk of "magic" if the builder does too much.

**Pick the fluent builder.** It maps best onto "features register capabilities" because capabilities *are* the builder methods.

#### Capability contracts

```ts
// src/shared/domain/fields/capabilities/index.ts

export interface CapabilityMap {
  'coin-source': {
    totalField: 'battleReport_coinsEarned'
    color: string
  }
  'damage-source': {
    totalField: 'damage_damageDealt'
    color: string
  }
  'is-total-for': {
    category: 'coinsEarned' | 'damageDealt' | 'totalEnemies'
    perHourField?: string
  }
  'aggregation': {
    strategy: 'sum' | 'avg' | 'max' | 'min' | 'last'
  }
  'enemies-hit-by': {
    totalField: 'totalEnemies_totalEnemies'
    color: string
  }
  'killed-with-effect': {
    totalField: 'totalEnemies_totalEnemies'
    color: string
  }
  'upgrade-shard': {
    color: string
  }
}

export type CapabilityName = keyof CapabilityMap
export type CapabilityValue<N extends CapabilityName> = CapabilityMap[N]
```

The map is the single authoritative list of capability contracts. New capability = one new entry. TypeScript narrows everything downstream from here.

#### The builder

```ts
// src/shared/domain/fields/define-field.ts
import type { CapabilityMap, CapabilityName, CapabilityValue } from './capabilities'
import { fieldRegistry } from './field-registry'

export type ParseSpec =
  | { section: string; label: string; type: 'number' | 'duration' | 'string' | 'date' }
  | { derived: true; computeFrom: string[] } // for derived fields like coinsPerHour

export type DisplaySpec = {
  name: string
  color?: string
  formatHint?: 'largeNumber' | 'duration' | 'percentage' | 'raw'
}

export type SectionMembership = {
  section: 'battleReport' | 'economic' | 'combat' | 'records' | 'modules' | 'miscellaneous'
  order?: number
  label?: string
}

export interface Field {
  readonly key: string
  readonly parse: ParseSpec
  readonly display: DisplaySpec
  readonly legacyKeys: readonly string[]
  readonly sections: readonly SectionMembership[]
  readonly capabilities: Readonly<Partial<CapabilityMap>>
  hasCapability<N extends CapabilityName>(name: N): boolean
  capability<N extends CapabilityName>(name: N): CapabilityValue<N> | undefined
  detectType(rawValue: string): 'number' | 'duration' | 'string' | 'date'
}

class FieldBuilder {
  private _parse?: ParseSpec
  private _display?: DisplaySpec
  private _legacy: string[] = []
  private _sections: SectionMembership[] = []
  private _caps: Partial<CapabilityMap> = {}

  constructor(private readonly key: string) {}

  parseFrom(spec: ParseSpec): this {
    this._parse = spec
    return this
  }

  legacyKeys(...keys: string[]): this {
    this._legacy.push(...keys)
    return this
  }

  display(spec: DisplaySpec): this {
    this._display = spec
    return this
  }

  appearsInSection(section: SectionMembership['section'], opts?: { order?: number; label?: string }): this {
    this._sections.push({ section, ...opts })
    return this
  }

  withCapability<N extends CapabilityName>(name: N, value: CapabilityValue<N>): this {
    this._caps[name] = value
    return this
  }

  aggregates(value: CapabilityValue<'aggregation'>): this {
    return this.withCapability('aggregation', value)
  }

  build(): Field {
    if (!this._parse) throw new Error(`Field ${this.key} missing parseFrom()`)
    if (!this._display) throw new Error(`Field ${this.key} missing display()`)
    const field: Field = {
      key: this.key,
      parse: this._parse,
      display: this._display,
      legacyKeys: [...this._legacy],
      sections: [...this._sections],
      capabilities: { ...this._caps },
      hasCapability: (n) => n in this._caps,
      capability: (n) => this._caps[n] as never,
      detectType: (raw) => detectTypeFor(this._parse!, this.key, raw),
    }
    fieldRegistry.register(field)
    return field
  }
}

export function defineField(key: string): FieldBuilder {
  return new FieldBuilder(key)
}

// Owned by the field — extracted from today's scattered field-utils logic
function detectTypeFor(parse: ParseSpec, key: string, raw: string): 'number' | 'duration' | 'string' | 'date' {
  if ('type' in parse) {
    // tier override: "10+" stays a string
    if (key === 'battleReport_tier' && raw.includes('+')) return 'string'
    return parse.type
  }
  return 'number'
}
```

The two moves that make this approach work at the type system level:

1. **`withCapability<N>` is generic over the capability name.** TypeScript requires the second argument to match `CapabilityMap[N]`. Typos become compile errors. Autocomplete lists all capability names.

2. **`capability<N>(name)` returns the precisely-typed payload.** Consumers don't cast.

#### Three real field files

**`fields/coins/golden-tower.field.ts`** — rich capability mix:

```ts
import { defineField } from '../../define-field'

export const goldenTower = defineField('coins_goldenTower')
  .parseFrom({ section: 'Coins', label: 'Golden Tower', type: 'number' })
  .legacyKeys('coinsFromGoldenTower')
  .display({ name: 'Golden Tower', color: '#fbbf24', formatHint: 'largeNumber' })
  .appearsInSection('economic', { order: 4 })
  .withCapability('coin-source', {
    totalField: 'battleReport_coinsEarned',
    color: '#fbbf24',
  })
  .aggregates({ strategy: 'sum' })
  .build()
```

Everything you'd need to know about this field is on this page. The color is declared once. The fact that it's a coin source is declared where it matters. The V2 alias lives with the field, not in a global map. The run-details section membership is on the field, not buried in `section-config.ts`.

**`fields/battle-report/tier.field.ts`** — special parsing, no capability mix, minimal:

```ts
import { defineField } from '../../define-field'

export const tier = defineField('battleReport_tier')
  .parseFrom({ section: 'Battle Report', label: 'Tier', type: 'number' })
  .legacyKeys('tier')
  .display({ name: 'Tier', formatHint: 'raw' })
  .appearsInSection('battleReport', { order: 1 })
  .aggregates({ strategy: 'last' }) // tier is a categorical tag, not a sum
  .build()
```

No color (it's never charted). No breakdown capability (it's not a source of anything). The `detectType` override for `"10+"` lives in `define-field.ts`, keyed off the field key — the field opts into the default `'number'` type and the builder handles the tier special case internally. (Alternatively, a dedicated `tierType()` capability; I prefer the centralized override because tier is a singleton and a whole capability feels heavy.)

**`fields/damage/death-wave.field.ts`** — breakdown role on a damage source:

```ts
import { defineField } from '../../define-field'

export const deathWaveDamage = defineField('damage_deathWave')
  .parseFrom({ section: 'Damage', label: 'Death Wave Damage', type: 'number' })
  .legacyKeys('deathWaveDamage')
  .display({ name: 'Death Wave', color: '#ef4444', formatHint: 'largeNumber' })
  .appearsInSection('combat', { order: 1 })
  .withCapability('damage-source', {
    totalField: 'damage_damageDealt',
    color: '#ef4444',
  })
  .aggregates({ strategy: 'sum' })
  .build()
```

And the corresponding total field:

**`fields/damage/damage-dealt.field.ts`** — a total field is just another field:

```ts
import { defineField } from '../../define-field'

export const damageDealt = defineField('damage_damageDealt')
  .parseFrom({ section: 'Damage', label: 'Damage Dealt', type: 'number' })
  .legacyKeys('damage', 'damageDealt')
  .display({ name: 'Damage Dealt', color: '#dc2626', formatHint: 'largeNumber' })
  .withCapability('is-total-for', { category: 'damageDealt' })
  .aggregates({ strategy: 'sum' })
  .build()
```

Note the `is-total-for` capability is the inverse of `damage-source`. The breakdown UI can ask the registry: "find the field with `is-total-for: damageDealt` and get all fields with `damage-source.totalField` pointing at its key." The cross-link is computable; it isn't duplicated.

#### The registry

```ts
// src/shared/domain/fields/field-registry.ts
import type { Field } from './define-field'
import type { CapabilityName } from './capabilities'

export interface FieldQuery {
  hasCapability?: CapabilityName
  anyCapability?: CapabilityName[]
  appearsInSection?: string
  where?: (f: Field) => boolean
}

class FieldRegistry {
  private fields = new Map<string, Field>()
  private byCapability = new Map<CapabilityName, Set<string>>()
  private legacyIndex = new Map<string, string>()

  register(field: Field): void {
    if (this.fields.has(field.key)) {
      throw new Error(`Duplicate field registration: ${field.key}`)
    }
    this.fields.set(field.key, field)
    for (const capName of Object.keys(field.capabilities) as CapabilityName[]) {
      if (!this.byCapability.has(capName)) this.byCapability.set(capName, new Set())
      this.byCapability.get(capName)!.add(field.key)
    }
    for (const legacy of field.legacyKeys) {
      const existing = this.legacyIndex.get(legacy)
      if (existing && existing !== field.key) {
        throw new Error(`Legacy key "${legacy}" claimed by both ${existing} and ${field.key}`)
      }
      this.legacyIndex.set(legacy, field.key)
    }
  }

  getField(key: string): Field | undefined {
    return this.fields.get(key)
  }

  resolveLegacyKey(legacy: string): string | undefined {
    return this.legacyIndex.get(legacy)
  }

  query(q: FieldQuery): Field[] {
    let candidates: Iterable<string>
    if (q.hasCapability) {
      candidates = this.byCapability.get(q.hasCapability) ?? new Set()
    } else if (q.anyCapability) {
      const set = new Set<string>()
      for (const cap of q.anyCapability) {
        for (const k of this.byCapability.get(cap) ?? []) set.add(k)
      }
      candidates = set
    } else {
      candidates = this.fields.keys()
    }

    const out: Field[] = []
    for (const key of candidates) {
      const f = this.fields.get(key)!
      if (q.appearsInSection && !f.sections.some((s) => s.section === q.appearsInSection)) continue
      if (q.where && !q.where(f)) continue
      out.push(f)
    }
    return out
  }

  all(): readonly Field[] {
    return [...this.fields.values()]
  }
}

export const fieldRegistry = new FieldRegistry()
```

Three indices: by key, by capability, by legacy key. All built at registration time. Queries are cheap lookups plus a linear filter on a small set.

Duplicate-key guard. Duplicate-legacy-key guard. These turn the two most embarrassing "silent override" bugs into loud startup errors.

#### A consumer-side refactor: Run Details Economic section

**Before** (approximated from current code):

```tsx
// uses COINS_EARNED_CONFIG, which is derived from COINS_EARNED_CATEGORY,
// which reads from COIN_FIELDS — each with its own hand-maintained list.
import { COINS_EARNED_CONFIG, OTHER_EARNINGS_CONFIG } from './section-config'

export function EconomicSection({ run }: { run: ParsedGameRun }) {
  return (
    <>
      <BreakdownCard config={COINS_EARNED_CONFIG} run={run} />
      <PlainFieldsCard config={OTHER_EARNINGS_CONFIG} run={run} />
    </>
  )
}
```

**After:**

```tsx
import { useEconomicSection } from './use-economic-section'

export function EconomicSection({ run }: { run: ParsedGameRun }) {
  const { coinBreakdown, otherEarnings } = useEconomicSection(run)
  return (
    <>
      <BreakdownCard config={coinBreakdown} run={run} />
      <PlainFieldsCard config={otherEarnings} run={run} />
    </>
  )
}
```

```ts
// use-economic-section.ts — React separation: orchestration lives here
import { buildEconomicSectionConfigs } from './build-economic-section-configs'
import { fieldRegistry } from '@/shared/domain/fields/field-registry'

export function useEconomicSection(run: ParsedGameRun) {
  return useMemo(() => buildEconomicSectionConfigs(fieldRegistry), [])
}
```

```ts
// build-economic-section-configs.ts — pure function, fully testable
export function buildEconomicSectionConfigs(registry: FieldRegistry) {
  const coinSources = registry.query({ hasCapability: 'coin-source' })
  const coinTotal = registry.query({
    hasCapability: 'is-total-for',
    where: (f) => f.capability('is-total-for')?.category === 'coinsEarned',
  })[0]

  const coinBreakdown = {
    totalField: coinTotal?.key,
    label: 'COINS EARNED',
    sources: coinSources.map((f) => ({
      fieldName: f.key,
      displayName: f.display.name,
      color: f.capability('coin-source')!.color,
    })),
  }

  const otherEarnings = {
    label: 'OTHER EARNINGS',
    fields: registry
      .query({ appearsInSection: 'economic' })
      .filter((f) => !f.hasCapability('coin-source') && !f.hasCapability('is-total-for'))
      .map((f) => ({ fieldName: f.key, displayName: f.display.name })),
  }

  return { coinBreakdown, otherEarnings }
}
```

Two things to notice:

1. The hook does not know which *specific* fields are in Economic. It queries. When `storm_gemCascade` ships, it appears here without a code change to this file.

2. The pure function `buildEconomicSectionConfigs` is testable without React. The invariant test "the economic section always produces a coin breakdown with at least one source" lives next to it.

#### V2 → V3 migration, per-field

The current `V2_TO_V3_FIELD_MAP` is ~180 lines of `legacyKey: canonicalKey`. In this approach, every row is moved onto the field that claims it. The migration itself becomes trivial:

```ts
// src/shared/domain/migrations/v2-to-v3.ts (the runtime migration)
import { fieldRegistry } from '@/shared/domain/fields/field-registry'

export function migrateV2Fields(v2Fields: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [legacyKey, rawValue] of Object.entries(v2Fields)) {
    const canonical = fieldRegistry.resolveLegacyKey(legacyKey) ?? legacyKey
    // last-write-wins is preserved: if two legacy keys map to one canonical, the
    // later iteration overwrites. Matches current V2 semantics.
    if (rawValue) out[canonical] = rawValue
  }
  return out
}
```

The migration "map" is computed. Adding a new legacy alias = adding `.legacyKeys('newLegacyName')` to the field's own file. No hand-authoring a global map whose drift vs. `supportedFields.json` is the entire cause of the v28 bug.

The duplicate-legacy-key guard in the registry (see `register()`) catches the silent-collision class: "two fields both claim `blackHole` as a legacy key" becomes a startup error instead of a silent last-write-wins.

#### The parser type-detector

Today's `getFieldConfig(key, rawValue)` in `field-utils.ts` is a mix of hardcoded exact-match and pattern heuristics. In this approach, it consults the registry first and falls back to the heuristic only for truly unknown fields.

```ts
// revised getFieldConfig
export function getFieldType(key: string, rawValue?: string): 'number' | 'duration' | 'string' | 'date' {
  const field = fieldRegistry.getField(key)
  if (field) return field.detectType(rawValue ?? '')
  return getFieldTypeByHeuristic(key, rawValue)
}
```

The heuristic stays (it's the safety net for V29-unknown fields until we register them), but registered fields own their own truth. The "tier with +" special case moves to `tier.field.ts` as logic attached to that field; no more cross-cutting `if (lowerKey === 'tier' && rawValue?.includes('+'))` branch.

### 3h. Pros, cons, honest critique

#### Pros

**Per-field locality is ideal.** The single strongest property. Every question you can ask about a field is answered by one file. No grepping.

**Behavior is where the data is.** The parse rule, the migration alias, the color, the section membership are all on the actor that has the identity they describe. This is the OOP-locality argument, and it's actually good here because fields *are* small domain objects with stable identities.

**Features don't maintain parallel lists.** The most churn-prone files today — `COIN_FIELDS`, `section-config.ts`, `V2_TO_V3_FIELD_MAP` — disappear as hand-maintained lists. They become derived queries.

**Adding a field is one-file, ~30 lines.** The common case is dramatically simpler.

**Capability contracts catch typos at tsc.** With the discriminated-union capability map, you cannot register a misnamed capability or a mistyped payload.

**Inverse relationships are computable.** "Which fields are coin sources?" and "what is the total for coinsEarned?" are two queries against the same capabilities. No duplicated cross-referencing.

**Extensible without rewrites.** A new UI view is new query calls. A new capability (say, `export-as-csv-column`) is new builder methods. Existing fields opt in field-by-field; existing fields that don't opt in are unaffected.

#### Cons

**The capability surface becomes a framework.** With 5 capabilities, this is delightful. With 25, it's a system-within-a-system that new contributors must learn. You've traded "7 files per field" for "1 file per field + 1 framework."

**Order-of-import sensitivity.** Side-effect registration means the `index.ts` that imports all field files must run before the first registry query. In SSR code paths or dev HMR weirdness, this can produce "empty registry" bugs that are hard to trace. Mitigation: a `registry.ensureLoaded()` call in the app bootstrap and a dev-only assert that the registry is non-empty before the first render.

**"Magic" registration can be hard to debug.** When the Coin Sources chart is missing a source, the bug isn't in the chart — it's that the field file didn't register the capability. The error manifests far from the cause. Mitigation: invariant tests, plus a dev-mode registry-inspector route (`/dev/field-registry`) that lists every field and its capabilities.

**Capability conflicts.** Two fields claiming `is-total-for: coinsEarned` is nonsense; the registry should reject it. Add enforcement.

**The registry is runtime, not compile-time.** Unlike a central manifest (approach 02), a missing field here doesn't fail `tsc`. It fails an invariant test or a runtime query. You must treat the invariant tests as the "tsc for field registrations." In practice this means: no PR merges without the invariant suite green.

**Refactoring a capability contract is a full-file sweep.** Changing `coin-source` to require a new `rarity` field touches every field that registered `coin-source`. In a central manifest, you'd touch one file. Here, you touch N. Mitigation: the TypeScript error points you at every file; it's a mechanical sweep but it is a sweep.

**Discoverability of capability *producers* is good; discoverability of capability *consumers* is just grep.** "Who queries `coin-source`?" requires grepping `hasCapability: 'coin-source'` across the codebase. Not a regression from today, but not better either. Mitigation: a naming convention where feature hooks that query a capability are named `use<Capability>Fields` and grep-discoverable.

**Bootstrapping cost.** Migrating ~150 existing fields into this structure is a large, mostly-mechanical change. The PR is big. The review burden is real. Mitigations in §6.

#### Honest critique

This approach is the right answer when **per-field behavior is genuinely varied.** For Tower of Tracking, it is: fields differ in parse type (number/duration/string/date), in migration history (some have 3 legacy aliases, some have 0), in capability mix (some are total-for, some are source-of, some are neither), in aggregation strategy (sum vs. last vs. max).

It is the wrong answer when **fields are fundamentally uniform and the only variation is a flag or two.** For a domain where 95% of fields are "number, display as K/M/B, sum aggregation" with a couple of categorical labels, a central manifest (02) or trait system (08) is half the ceremony and has the same effect.

The honest tell: look at the V2→V3 migration map (220 lines of aliases, plus comments explaining ambiguity) and at the combat-section breakdown configs (200+ lines with per-field colors and display names). That complexity isn't accidental. These fields *have* differentiated behavior, and the current code pays the tax of scattering it across files. Pulling it back together onto field objects genuinely simplifies the system.

But — and this is the critique that matters — this approach only wins if you commit to the invariant tests. Without them, it degrades into a registry where "forgot to register" is the new "forgot to add to the list," except now there's no list to eyeball. The approach is non-negotiable about its enforcement layer.

### 3i. When this wins, when it loses

**Wins when:**
- Fields have rich, varied per-field behavior (parse quirks, format quirks, multiple legacy aliases, multiple capability memberships).
- Features are numerous and cross-cutting (run-details, source analysis, time-series, aggregation, coverage report, export, import). Five+ consumers of "the list of coin sources" is a strong signal.
- Adding fields is a frequent operation (every game version). V28 taught us this is our reality.
- Team (human + AI) needs high discoverability per-field.

**Loses when:**
- Fields are uniform and differ only in metadata. A central manifest covers it with less ceremony.
- Features are few. Two consumers don't justify the registry indirection.
- Capability surface explodes into 15+ capabilities with complex interactions. At that point the capability system itself needs design discipline and has become its own manifest.
- Team size doesn't support maintaining the enforcement layer (invariants + capability docs).

For *this* app right now, I think it wins on the behavior-varied and frequent-add-fields tests, and the capability surface is naturally small (~8 capabilities to cover everything I see). That's within the sweet spot.

---

## 4. Compare to Central Manifest (approach 02)

These approaches look similar in output but are inverted in authorship.

**Central Manifest (02):**
- One TS file declaring all fields.
- Features read the manifest and filter with predicates: `MANIFEST.filter(f => f.isCoinSource)`.
- Adding a field = editing one big file.
- Adding a capability = adding a field to the manifest shape *and* a filter in every consumer.

**Composable (05):**
- One TS file per field, declaring its own capabilities.
- Features query the registry by capability: `registry.query({ hasCapability: 'coin-source' })`.
- Adding a field = new file, no edits elsewhere.
- Adding a capability = new capability contract + opt-in on the fields that want it.

The inversion matters most when the axis of change is *per-field*. When you add a V29 field, the composable approach edits one file. The manifest approach edits one *section* of one big file — which in practice has merge conflicts with every other PR that also touches that manifest.

When the axis of change is *per-capability* (say, "coin sources now need a `rarity` field"), the manifest wins. It's one file; you edit 11 rows. The composable approach edits 11 files because each field registered `coin-source` individually.

**Rule of thumb:** per-field churn favors composable; per-capability churn favors manifest. In Tower of Tracking, per-field churn dominates (field additions, not capability additions, are the frequent operation). That's the tiebreaker.

A hybrid is possible: a central manifest that *generates* field files at scaffold time (like approach 03 codegen), but once generated, features query by capability. That compresses the "new field" friction at the cost of giving up some per-field locality. Interesting but probably over-engineered for our scale.

---

## 5. Compare to Trait/Tag system (approach 08)

Traits are the flat cousin of capabilities. A trait is a label: `#coin-source`, `#damage-source`, `#time-type`. A field has a set of traits. Features query by trait.

Capabilities are traits with payloads. `coin-source` isn't just "yes I am a coin source" — it's "yes, and my total field is `battleReport_coinsEarned`, and my color is `#fbbf24`." The payload is the critical difference.

The practical effect:

- **Trait system:** You still need somewhere to declare the per-field color, total-field link, etc. Usually that ends up being field metadata *plus* traits. You've added traits but not removed data.
- **Capability system:** The capability *is* the data. There is no separate "coin color" field outside the `coin-source` capability. Everything a feature needs to render a coin source is in the capability payload.

When to bridge: **traits for simple set membership; capabilities for parameterized membership.** In this design I've used capabilities throughout because nearly every "is this field in category X" question needs per-field data to answer the follow-up question "how do I render it in category X." A pure trait wouldn't carry its weight.

One place traits-over-capabilities would help: cross-cutting filters that don't need payload. "Is this a summary-level field?" "Is this field hidden in V28 but preserved for V27 data?" Those are set-membership questions. A lightweight trait system on top of capabilities (`.tag('summary-level')`) would cover them without inventing a capability contract. Maybe worth adding later; not needed for the first cut.

---

## 6. Migration plan

Big-bang is a non-starter. 150 fields × 7 cross-references = a PR no one can review. Incremental is mandatory.

### Phase 0: infrastructure (small PR)

- Create `src/shared/domain/fields/field-registry.ts`, `define-field.ts`, `capabilities/index.ts`.
- Empty registry, empty capability map.
- Add a dev-only inspector route `/dev/field-registry` that lists registered fields.
- No fields registered yet. Existing code unchanged.

### Phase 1: one capability, end-to-end (medium PR — the proof)

- Pick `coin-source`. It's self-contained, has a small field count (~14), and has two consumers (run-details Economic section, Coin Sources chart).
- Add the `coin-source` capability contract.
- Create 14 field files under `fields/coins/`, each calling `defineField(...).withCapability('coin-source', ...)`.
- Refactor `COIN_FIELDS` to be derived from the registry: `COIN_FIELDS = registry.query({ hasCapability: 'coin-source' }).map(...)`.
- Add the invariant test: "every field with `coin-source` has a registered color and a linked total field."
- Ship it. Observe: does the Economic section render correctly? Does the Coin Sources chart render correctly? Are the colors identical?
- **Gate:** if this phase doesn't obviously improve the developer experience, abort and reconsider. The rest of the migration is the same pattern at larger scale.

### Phase 2: migration aliases (small PR)

- Add `.legacyKeys(...)` to every field migrated so far.
- Refactor the runtime V2 migration to consult the registry via `resolveLegacyKey`.
- Keep the old `V2_TO_V3_FIELD_MAP` as a fallback; log a dev-mode warning when the registry doesn't have an alias that the old map does (indicates an un-migrated field).
- Remove rows from the old map once all their owning fields are migrated.
- This phase is the migration-safety win — once it lands, the v28-class bug gets harder to repeat because aliases live with fields.

### Phase 3: remaining capabilities, by section (several medium PRs)

- Damage sources (`damage-source`) + the Damage Dealt total.
- Enemies Hit By / Destroyed By / Killed With Effect Active.
- Records (plain `appearsInSection: 'records'` + aggregation strategy).
- Battle Report summary fields.
- Other earnings, upgrade shards, modules, counts, utility, cash.
- Each PR: migrate one section's fields, refactor the corresponding feature's config to derive from the registry, remove the hand-authored list, add an invariant test.

### Phase 4: parser type detection consolidation (small PR)

- Refactor `getFieldConfig` in `field-utils.ts` to consult the registry first.
- Move field-specific detection rules (tier `+` handling) onto the fields that own them.
- Keep the heuristic fallback for truly unknown fields, but instrument it: log a warning in dev when the heuristic fires.

### Phase 5: aggregation and time-series integration (medium PR)

- Add `aggregation` capability to every field.
- Refactor the time-series aggregation engine to consult `field.capability('aggregation')?.strategy`.
- Remove the scattered "default to sum" logic.

### Phase 6: delete the graveyard (small PR, but satisfying)

- Remove the now-empty `V2_TO_V3_FIELD_MAP`, the hand-maintained `COIN_FIELDS`, `DAMAGE_FIELDS`, `COINS_EARNED_CATEGORY`, `DAMAGE_DEALT_CATEGORY`, `section-config.ts` plain-config literals.
- Everything is derived from the registry.
- Run `supportedFields.json` is now generated by a script that walks the registry. Or kept as a snapshot test asserting the registry matches it.

### Rollback posture

Each phase above is independently reversible. The registry doesn't replace the existing config files until the last phase; until then, the config files are *also* computed from the registry, and flipping back to hand-authored is one commit. That's the right posture for a refactor of this scale.

### Estimated scope

Phase 0: ~200 lines net-new, no deletion.
Phase 1: ~14 field files + 1 capability + 1 query API + 1 test + refactor of 2 consumers. ~500 lines net.
Phase 2: ~30 lines net, mostly deletion from the V2 map as it shrinks.
Phase 3: ~100 field files × ~25 lines each = ~2500 lines net-new, minus ~1000 lines of deleted configs. ~1500 lines net over several PRs.
Phase 4–5: mostly moves, ~300 lines net.
Phase 6: ~500 lines deleted.

Total: roughly a net ~2000-line codebase growth for ~1500 lines of hand-authored config deleted and replaced with structured, queryable, invariant-enforced field definitions. The per-line density is higher (each line carries more meaning), and the cross-file coupling is gone.

---

## 7. Summary

**Pitch:** each field authors its own story. Features discover fields by capability. The registry is the pivot.

**Strongest property:** adding a V29 field is a single ~30-line file. Every feature that has opted into the relevant capability picks it up automatically.

**Best-case discoverability:** one file per field, every use site declared on that file.

**Required enforcement layer:** typed capability contracts (tsc catches typos) plus invariant tests (runtime catches missing registrations and capability/consumer mismatches). Non-negotiable.

**Biggest risk:** the capability surface grows into a framework. Capped at ~8 capabilities for Tower of Tracking's current scope; watch for creep.

**Recommended pilot:** Phase 1 (coin sources, end-to-end) before committing to a full migration. If the pilot doesn't feel obviously better, the full migration won't either.

**Combines well with:** approach 01 (invariant tests become the enforcement layer), approach 06 (derive defaults for `display.name` and `display.color` from the key, override on the field where needed — reduces ceremony on the 80% of fields that are boring).

**Does not combine well with:** approach 02 (central manifest) and approach 05 are two answers to the same question; pick one. Approach 03 (codegen) could generate field files from a schema but undermines the per-field-locality win that is 05's whole selling point.

This is the most novel approach. It's also the most ambitious. It earns its keep when fields have rich per-field behavior and features are numerous — which, for Tower of Tracking at V28 and looking forward to V29+, is the shape of the domain. The invariant-test discipline is the price of admission. Pay it, and the silent-drift class of bug goes away; don't pay it, and the registry becomes a more elegant way to produce the same bugs.

---

## 8. The fan-out problem

Everything in sections 1–7 assumed the axis of change is *per-field*. The honest reading of this codebase is that the axis of change is *mostly* per-field — but not entirely. Sometimes the unit of work is **a new capability**: a new chart, a new aggregation mode, a new export format, a new migration flag. When that happens, this approach asks you to edit N field files instead of one feature file. That is the composable model's weakest angle, and it deserves a section of its own.

### 8.1. Honest critique — a worked example

Suppose a new feature ships: the **Rate Chart**, which renders per-field instantaneous rates relative to `battleReport_realTime`. For most fields the rate is `value / realTime * 3600` (coins per hour), but some fields need a different formula — `battleReport_cellsEarned` divides by `gameTime` instead of `realTime`; `counts_wavesSkipped` is a flat count, not a rate; `records_*` fields aren't rates at all and should be excluded.

The feature needs each field to declare, in some form: "here is my rate formula" or "I am not a rate field."

Under the graph approach (07), this is one new edge type (`HAS_RATE_FORMULA`) and ~12 new edges in one file. Under the tag approach (08), it's a new namespaced tag (`rate-formula:per-real-time-hour` etc.) and maybe a small override map for field-specific denominators. Under this composable approach, it's an edit to **every field file that has the new capability**, because the capability lives on the field.

**Diff size for adding a `rateFormula` capability to all coin sources under 05:**

```ts
// Add to CapabilityMap (1 file, ~5 lines)
export interface CapabilityMap {
  // ... existing
  'rate-formula': {
    denominatorField: 'battleReport_realTime' | 'battleReport_gameTime'
    scale: number // 3600 for per-hour, 60 for per-minute
  }
}

// Add a builder method (1 file, ~5 lines)
withRateFormula(value: CapabilityValue<'rate-formula'>): this {
  return this.withCapability('rate-formula', value)
}

// Edit every coin-source field (~14 files, one line each)
export const goldenTower = defineField('coins_goldenTower')
  .parseFrom({ section: 'Coins', label: 'Golden Tower', type: 'number' })
  // ...
  .withRateFormula({ denominatorField: 'battleReport_realTime', scale: 3600 }) // <-- NEW
  .build()
```

For ~12 coin sources, ~12 damage sources, and ~8 "other numeric" fields that should declare the rate: **32 files touched**. For fields that should *exclude* themselves from the new capability (records, counts, categorical): another N files touched with `.withCapability('rate-formula', { excluded: true })` or similar. Worst case: ~50 field files in one PR.

The review burden is not 50× a one-line change, but it is 50× *something*. The reviewer has to verify that each field got the right denominator, the right scale, and that none were missed. The PR diff is physically large. The churn is concentrated in one slice of time (capability rollout) rather than spread thin over per-field PRs (the approach's usual sweet spot).

**This is the approach's structural weakness.** Any time the unit of work is "every numeric field," this approach asks for 50+ file edits where a central manifest asks for 1 and a graph asks for ~12 edges in one file.

### 8.2. Mitigations

Three mitigations, each trading a different property to reduce fan-out.

#### 8.2.1. Default capability adapters

The observation: for the Rate Chart, 80% of fields follow the same rule (`denominatorField: 'battleReport_realTime'`, `scale: 3600`). Only ~5 fields need an override, and ~10 need explicit opt-out. If the capability *has a default adapter*, only those fields touch their files.

```ts
// src/shared/domain/fields/capabilities/rate-formula.ts

import type { Field } from '../define-field'

export interface RateFormulaCapability {
  denominatorField: 'battleReport_realTime' | 'battleReport_gameTime'
  scale: number
  excluded?: boolean
}

/**
 * Default adapter: every numeric field gets per-real-time-hour rate
 * unless it declares otherwise. Records, counts, and categorical
 * fields auto-opt-out via capability metadata the field already has.
 */
export function resolveRateFormula(field: Field): RateFormulaCapability | undefined {
  // 1. Explicit opt-in from the field file wins.
  const explicit = field.capability('rate-formula')
  if (explicit) return explicit.excluded ? undefined : explicit

  // 2. Field-level signals that rule out rates:
  //    - non-numeric fields
  //    - "last" aggregation (tier is a tag, not summable)
  //    - fields already tagged as derived / per-hour
  if (field.parse.type !== 'number') return undefined
  if (field.capability('aggregation')?.strategy === 'last') return undefined
  if (field.hasCapability('is-total-for')) return undefined // totals aren't rates of themselves
  if (field.key.endsWith('PerHour') || field.key.endsWith('PerMinute')) return undefined

  // 3. Default: per-real-time-hour.
  return { denominatorField: 'battleReport_realTime', scale: 3600 }
}
```

Now the Rate Chart feature queries `registry.all().map(resolveRateFormula).filter(Boolean)` and gets a working set with **zero field-file edits**. Only fields that genuinely deviate from the default — `battleReport_cellsEarned` needing `gameTime`, or a specific oddity — write `.withCapability('rate-formula', ...)`.

The principle: **capability defaults live in the capability module, not in every field.** The field file is the place for *deviations from default*, not for restating the default. This is the same pattern as CSS — an element only declares what differs from the inherited style.

With a good default adapter, fan-out shrinks from "every matching field" to "every exception," which for most capabilities is a tiny set.

#### 8.2.2. Feature-side capability registration

For capabilities where no good default exists — e.g., a new `exportFormat` with per-field column headers that genuinely differ — the capability can be registered from the *feature* side rather than the field side. A small "rollout" file lives under the feature:

```ts
// src/features/rate-chart/rate-chart-field-overrides.ts
// Feature-side capability overrides. Keeps the capability rollout
// in one file instead of fanning out across 50 field files.

import { fieldRegistry } from '@/shared/domain/fields/field-registry'

export const RATE_CHART_OVERRIDES: Partial<Record<string, RateFormulaCapability>> = {
  battleReport_cellsEarned: { denominatorField: 'battleReport_gameTime', scale: 3600 },
  battleReport_coinsPerHour: { excluded: true }, // already a rate
  counts_wavesSkipped: { excluded: true },       // flat count, not a rate
  records_highestCoinsMinute: { excluded: true },
  // ... ~15 overrides total
}

export function rateFormulaFor(fieldKey: string): RateFormulaCapability | undefined {
  const override = RATE_CHART_OVERRIDES[fieldKey]
  if (override) return override.excluded ? undefined : override
  const field = fieldRegistry.getField(fieldKey)
  if (!field) return undefined
  return resolveRateFormula(field) // default adapter, §8.2.1
}
```

This is the escape hatch for capabilities that don't warrant their own per-field declaration. It explicitly sacrifices per-field locality (looking up `coins_goldenTower` won't show its rate-formula membership) for rollout velocity. Use sparingly — every feature-side override file is a new place drift can hide. But for *low-value, high-fan-out* capabilities, it's the right trade.

The rule of thumb: **a capability belongs on the field if it's part of the field's identity (color, section, source-of); a capability belongs on the feature if it's a per-feature rollout detail (export column, rate denominator).**

#### 8.2.3. Codegen / bulk editor for the unavoidable cases

Sometimes the fan-out is unavoidable and the capability genuinely needs to live on the field. For those cases, a small script makes the N-file edit mechanical rather than manual:

```ts
// scripts/field-capabilities/add-capability.ts
// Usage: npm run field:add-capability -- --capability rate-formula \
//        --match "section:coins" --value '{"denominatorField":"battleReport_realTime","scale":3600}'

import { Project } from 'ts-morph'
import { fieldRegistry } from '@/shared/domain/fields/field-registry'

const args = parseArgs(process.argv.slice(2))
const capability = args.capability
const matchPredicate = compileMatch(args.match) // e.g. 'section:coins', 'type:number'
const value = JSON.parse(args.value)
const dryRun = args['dry-run'] ?? false

const project = new Project({ tsConfigFilePath: './tsconfig.json' })
const targets = fieldRegistry.query({ where: matchPredicate })

for (const field of targets) {
  const sourceFile = project.getSourceFileOrThrow(fieldFilePath(field.key))
  const callExpr = findDefineFieldChain(sourceFile, field.key)
  if (!callExpr) {
    console.warn(`[skip] ${field.key}: could not locate defineField() chain`)
    continue
  }
  if (hasCapability(callExpr, capability)) {
    console.log(`[skip] ${field.key}: already has '${capability}'`)
    continue
  }
  insertCapabilityCall(callExpr, capability, value) // inserts `.withCapability(...)` before `.build()`
  console.log(`[edit] ${field.key}`)
}

if (!dryRun) project.saveSync()
console.log(`Updated ${targets.length} field files.`)
```

Paired with `npm run field:missing rate-formula` (§9.8), the workflow becomes:

1. `npm run field:missing rate-formula` — lists fields that don't have it.
2. Spot-check: do any of these genuinely need an override? Add them manually.
3. `npm run field:add-capability -- --capability rate-formula --match "type:number" --value '{...}'` — bulk-adds the default to the rest.
4. Review the generated diff. Approve / adjust / commit.

The codegen doesn't make the diff smaller, but it makes it mechanical, so review focuses on the *exceptions* (the ~5 fields that needed a manual override) rather than the *boilerplate* (the 45 fields that got the default). This reframes fan-out from "manual tedium" to "automated sweep." It doesn't eliminate the con; it blunts it.

### 8.3. Comparison when fan-out hurts most

Honest cross-comparison: for a "new capability on every numeric field" change, which approach absorbs it best?

| Axis | Composable (05) | Graph (07) | Tag (08) |
|---|---|---|---|
| Files touched (no default) | ~50 field files | 1 edges file + 1 types file | 1 tag-catalog file + ~50 field entries |
| Files touched (with default) | 1 capability module + ~5 exceptions | 1 edges file + ~5 exceptions | 1 tag catalog + ~5 exceptions |
| Review surface | Diff is spread thin, each file is local | Diff is concentrated, easy to scan | Diff is concentrated, each entry is one line |
| Risk of missing a field | High (each file is a separate opportunity) | Low (all edges in one file, easy to audit) | Medium (compact but still line-per-field) |
| Discoverability *after* rollout | Excellent — capability is on the field | Good — one query returns all edges | Good — one query returns all tagged fields |
| Reversibility (back out the capability) | Hard — 50 files | Easy — delete one edges file | Medium — delete tag from catalog + entries |

**Where each wins:**

- **Tag system absorbs capability rollouts best** when the capability is a flat boolean. One line per field in one file. No fan-out across the file tree.
- **Graph absorbs capability rollouts best** when the capability is relational. All edges in one edges file.
- **Composable (05) absorbs capability rollouts *worst* of the three** without defaults. With defaults (§8.2.1), it's competitive. Without defaults or feature-side overrides, it's the most file-churny of the three.

**Where composable (05) still earns its keep:**

- **Per-*field* changes are dramatically better** under 05. Adding a new V29 field = 1 file. Renaming a field = 1 file. Adjusting a field's color = 1 file. Under graph/tag, per-field changes touch the central edges/catalog file plus wherever the field's entry lives.
- **Per-field *discovery*** is dramatically better. Open one file, read the whole story.
- **Behavior-carrying capabilities** (e.g., field-specific parsers, formatters, validators) are awkward in tag systems and mostly impossible in graph systems. The composable model carries arbitrary behavior as capability payloads — a field that needs a custom parser declares it inline, next to everything else about that field.

The honest call: **pick 05 when per-field churn dominates and capability rollouts are rare; pick tag or graph when capability rollouts are common.** For Tower of Tracking, adding V29 fields will be far more frequent than adding new chart types, so per-field churn dominates. But when a new chart *does* ship, 05 will feel expensive — so invest in the default-adapter and codegen tooling up front.

---

## 9. Cross-cutting concerns

### 9.1. Aggregation impact

Tower of Tracking is an analytics app. Aggregation is not an afterthought — it's the hot path. "Sum `coins_goldenTower` across farm runs in the last 30 days, grouped by day" is the shape of every chart. This approach moves the *strategy* onto the field (`.aggregates({ strategy: 'sum' })`) and keeps the *execution* in the feature. The question is whether that split makes aggregation easier or harder.

Today's `prepareFieldPerDayData(runs, fieldKey)` (see `src/features/analysis/time-series/field-aggregation.ts`) hardcodes `sum` as the aggregation across the inner `reduce`. That's correct for 90% of fields and wrong for the other 10% — tier should be `last` (categorical), records should be `max` (it's a record), `battleReport_realTime` could be `sum` for "total play time" charts or `avg` for "avg run duration" charts.

The composable model hands each field its own strategy. The aggregation engine becomes strategy-aware:

```ts
// src/features/analysis/time-series/field-aggregation.ts (refactored)
import { fieldRegistry } from '@/shared/domain/fields/field-registry'
import { extractFieldValue } from './field-extraction'
import type { ParsedGameRun } from '@/shared/types/game-run.types'

type AggregationStrategy = 'sum' | 'avg' | 'max' | 'min' | 'last'

function applyStrategy(strategy: AggregationStrategy, values: number[]): number {
  if (values.length === 0) return 0
  switch (strategy) {
    case 'sum': return values.reduce((a, b) => a + b, 0)
    case 'avg': return values.reduce((a, b) => a + b, 0) / values.length
    case 'max': return Math.max(...values)
    case 'min': return Math.min(...values)
    case 'last': return values[values.length - 1]
  }
}

export function aggregateFieldOverRuns(
  runs: ParsedGameRun[],
  fieldKey: string,
): number {
  const values = runs
    .map((run) => extractFieldValue(run, fieldKey))
    .filter((v): v is number => v != null)

  const field = fieldRegistry.getField(fieldKey)
  const strategy = field?.capability('aggregation')?.strategy ?? 'sum'
  return applyStrategy(strategy, values)
}

// The per-day aggregation becomes a one-liner around the new primitive:
export function prepareFieldPerDayData(runs: ParsedGameRun[], fieldKey: string): ChartDataPoint[] {
  const dailyGroups = groupRunsByDateKey(runs, (ts) => format(startOfDay(ts), 'yyyy-MM-dd'))
  const out: ChartDataPoint[] = []
  dailyGroups.forEach((dayRuns) => {
    const value = aggregateFieldOverRuns(dayRuns, fieldKey)
    const timestamp = startOfDay(dayRuns[0].timestamp)
    out.push({ date: formatDisplayMonthDay(timestamp), value, timestamp })
  })
  return out.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}
```

Three gains:

1. **Correctness.** Tier charts stop summing. Record charts stop summing. The strategy follows the field across every aggregation site — per-hour, per-day, per-week, per-year all pick it up.
2. **No feature-side registry.** The existing code has to either hardcode `sum` or maintain a per-field override table at the feature. The field now carries its own truth.
3. **Extensibility.** A new strategy like `median` or `p95` is a new case in `applyStrategy` and a new option in the `'aggregation'` capability contract. No feature rewrites.

The cost: every field file declares `.aggregates({ strategy: 'sum' })` (or its correct variant). That's 150 lines added across 150 files, but with the §8.2.1 default adapter, `sum` can be inferred from `type: 'number'` and the explicit declaration only lives on the outliers (tier, records, averages). Net: ~20 explicit declarations, ~130 defaulted — good ratio.

### 9.2. Cross-version lifecycle

Five stages. Each one asks: what role do the field files play? How does the registry handle a transition?

```
          ┌─────────────────┐
   v0.11  │  V2 storage     │  reads V2 persisted state, writes V2
   app    │  heuristic      │  parses V27 exports with pattern matching
          │  parser         │  V28 export → silent drift (the bug we shipped)
          └────────┬────────┘
                   │ app updates to v0.12
                   ▼
          ┌─────────────────┐
   v0.12  │  V3 storage     │  reads V2 persisted state via legacy-key resolve
   app    │  registry-      │  parses V28 exports via field.detectType()
          │  aware parser   │  V29 export → heuristic fallback + telemetry
          └─────────────────┘
```

**Stage A: v0.11 + V27 game export.** Out of scope for this approach — v0.11 has no field registry. Documented for contrast.

**Stage B: v0.11 + V28 game export (before app update).** The bug we already shipped. The V28 parser emits keys the v0.11 code doesn't know about. No field registry to consult. This is the motivating failure this whole exploration addresses — the fix is to ship v0.12 with the registry.

**Stage C: v0.12 reads persisted v0.11/V2 state for the first time.**

Sequence:

```
  localStorage (V2 keys)          Field Registry                 ParsedGameRun (V3)
  ─────────────────────           ─────────────                  ──────────────────
  coinsFromGoldenTower   ──►  resolveLegacyKey                  coins_goldenTower
  coinsFromDeathWave     ──►  "coinsFromDeathWave"   ──►        coins_deathWave
  tier                   ──►  "tier"                 ──►        battleReport_tier
  someUnknownV2Key       ──►  (no match)             ──►        someUnknownV2Key (pass-through)
```

Each V2 key is run through `fieldRegistry.resolveLegacyKey(v2Key)`. If the registry finds a field that claims `.legacyKeys('coinsFromGoldenTower')`, the key is rewritten to the canonical V3 key; the raw value is preserved. If no field claims the legacy key, the key passes through unchanged — the current behavior.

Field files handle this transition by declaring every V2 alias they own:

```ts
export const goldenTower = defineField('coins_goldenTower')
  .legacyKeys('coinsFromGoldenTower', 'coins_goldenTower_v2')
  // ...
```

The registry's `legacyIndex` (see §3g) is populated at startup by walking every field's `.legacyKeys`. Duplicate claims fail loudly at startup, not silently at migration time.

**Stage D: v0.12 + V28 game export (happy path).**

```
  V28 parser output             Field Registry                  ParsedGameRun
  ─────────────────             ──────────────                  ─────────────
  coins_goldenTower   ──►  getField("coins_goldenTower")  ──►  correctly typed as number
  battleReport_tier   ──►  getField("battleReport_tier")  ──►  "+" suffix preserved as string
  (unknown new field) ──►  getField → undefined            ──►  heuristic fallback + telemetry
```

Every V28 key the app knows about gets a field-level `.detectType()` call, which makes the type contract explicit and per-field. The existing heuristic in `field-utils.ts` is the fallback, and it fires only for genuinely unknown fields. Those unknowns are logged to a telemetry sink (dev-mode warning, optional production sampling) so we see them and add field files in the next release.

**Stage E: v0.12 + V29 game export (unknown format).**

Same path as Stage D's unknown fields, but at scale. For every V29-new key:

1. Registry lookup returns undefined.
2. Heuristic fallback runs: `getFieldTypeByHeuristic(key, rawValue)`.
3. Telemetry logs the key, the section, and the raw value.
4. The value is parsed on best-effort, stored verbatim as an extra field. No data loss.
5. A dev-only route `/dev/unregistered-fields` lists observed unknowns with sample values, so the next release's field-file batch is authored from real data, not guesses.

Field files handle the V29 transition by **not existing yet**. The registry gracefully degrades. When the v0.13 release adds `coins_stormGemCascade.field.ts`, any persisted V29 data that was stored raw gets a proper type at the next read.

The key insight: **the registry's unknown-field behavior is a feature, not a failure mode.** V28 taught us that game devs ship fields ahead of our code. The registry is explicit about "I don't know this field" and degrades to the same heuristic the current code uses — with telemetry to close the loop.

### 9.3. Debuggability

Bug scenario: **"`coins_goldenTower` shows 0 on run-details for a specific run."**

Today's debug path: grep for `coins_goldenTower`. Find ~5 hits across parser, breakdown sources, section config, chart color config, and potentially a migration map. Each file is a candidate cause. The user has to hold the whole story in their head.

Under this approach, step 1 is: **open `fields/coins/golden-tower.field.ts`**. The complete story is there. From there, the causes narrow fast:

1. Is the field registered at all? If not, the import in `fields/index.ts` is missing — startup warning.
2. Is the `.parseFrom({ section: 'Coins', label: 'Golden Tower', type: 'number' })` matching what V28 emits? Check the sample data. If V28 renamed the label to "Golden Tower Coins", the parse won't match and the value is missing entirely.
3. Is the raw value being parsed correctly? `field.detectType(rawValue)` returns the declared type; if the raw is `"0"`, it parses to `0` and the bug is in the game, not the app.
4. Is the run-details card calling the correct field? Query: `registry.query({ appearsInSection: 'economic' })` — does `coins_goldenTower` appear in the result?
5. Is a capability-based filter excluding it? Check the chart's query. `registry.query({ hasCapability: 'coin-source' })` — is it there?

Each question is answered from the field file or from a one-line query. No grep-then-guess.

To make this even more concrete, ship a debug CLI:

```
$ npm run field:describe coins_goldenTower

coins_goldenTower
─────────────────
File:              src/shared/domain/fields/fields/coins/golden-tower.field.ts
Display:           "Golden Tower" (color #fbbf24, format: largeNumber)
Parse:             section="Coins" label="Golden Tower" type=number
Legacy keys:       coinsFromGoldenTower
Sections:          economic (order 4)
Capabilities:
  coin-source      → totalField: battleReport_coinsEarned, color: #fbbf24
  aggregation      → strategy: sum
Consumers (grep):
  registry.query({ hasCapability: 'coin-source' })    × 2 hits
  registry.query({ appearsInSection: 'economic' })    × 1 hit
  registry.resolveLegacyKey('coinsFromGoldenTower')   × 1 hit (v2 migration)
```

The "Consumers" section is produced by grepping the repo for `hasCapability: '<cap>'` and `resolveLegacyKey('<legacy>')` patterns. That's it — a small shell out of `rg` rolled up by capability. For an AI assistant or a human debugging a cold codebase, this single command collapses 30 minutes of grep-and-read into 5 seconds.

This is the composable model's debuggability superpower. Every per-field question is a one-file or one-command answer.

### 9.4. Adding a new capability

Covered in §8. Summary:

- **Ideal case:** write a default adapter in the capability module; only outliers edit their field files. Fan-out = O(exceptions).
- **Worst case (no default possible):** edit every field file that opts in. Fan-out = O(participating fields). Mitigate with codegen (§8.2.3).
- **Escape hatch:** feature-side override file (§8.2.2) for low-value, high-fan-out capabilities.
- **Rule of thumb:** capability belongs on the field if it's part of the field's identity; on the feature if it's a per-feature rollout detail.

This approach trades "per-capability churn" for "per-field locality." If the project's common-case change is per-field (new fields, renames, color tweaks), 05 wins. If the common-case change is per-capability (new charts, new exports, new aggregations), graph (07) or tag (08) wins.

### 9.5. Runtime type-mismatch

Scenario: game devs change `battleReport_cellsEarned` from a raw number (`177920`) to a qualifier string (`"177.92K (est)"`). The field file declares `type: 'number'`. What happens?

The field's `detectType(raw)` returns `'number'`. The parser then calls the number-scale parser on `"177.92K (est)"`. Current behavior (in `src/shared/formatting/number-scale.ts`) tolerates suffixes like `K`, `M`, `B`; an `(est)` suffix either parses the leading number (best case) or returns `NaN` (worst case).

The composable model gives the field a place to own this coercion explicitly:

```ts
// Extended field with a .coercesVia() capability
export const cellsEarned = defineField('battleReport_cellsEarned')
  .parseFrom({ section: 'Battle Report', label: 'Cells Earned', type: 'number' })
  .coercesVia((raw) => {
    // Tolerate estimation suffixes, game-dev addition in V29
    const cleaned = raw.replace(/\s*\(est\)\s*$/, '').trim()
    return parseNumberScale(cleaned)
  })
  .display({ name: 'Cells Earned', formatHint: 'largeNumber' })
  .aggregates({ strategy: 'sum' })
  .build()
```

The coercion function is a pure function that sits with the rest of the field's story. When V29 adds an oddity, the fix is one function on one file. Without this, the coercion lives in the global parser and gets a special case for every field's quirks — the exact kind of scattered logic this approach is trying to eliminate.

The registry can also enforce a safety net: if `detectType` returns `'number'` but `coercesVia` returns `NaN` or `undefined`, the field emits a **parse-failure telemetry event** tagged with the key, the raw value, and the expected type. The run is still imported (we preserve data), but the dev-mode inspector lists every field that failed to coerce since the last load. A regression in coercion never silently produces `0`; it produces a visible, addressable failure.

This pairs with §9.2's "unregistered fields telemetry": both are about **making failure loud** without making the app crash. The registry's job is to turn silent drift into a signal.

### 9.6. Specific-field references

Not every field reference is "every field with capability X." Some are genuinely about a specific field:

- **Battle date required in single-entry import.** The form validates that `battleReport_battleDate` is present and parses to a valid date. The validator hardcodes the key.
- **Composite key for duplicate detection** (`src/shared/domain/duplicate-detection/duplicate-detection.ts`). Uses `battleReport_battleDate`, `tier`, `wave`, `realTime` — specific fields, specific roles.
- **Per-hour derived fields.** `coinsPerHour` derives from `coinsEarned` and `realTime`. Specific pair.

The question: does this approach expose those in a capability form, or is it fine to hardcode the key at the call site?

**Capability form** — add a `.isRequiredIn(flow)` capability:

```ts
export const battleDate = defineField('battleReport_battleDate')
  .parseFrom({ section: 'Battle Report', label: 'Battle Date', type: 'date' })
  .legacyKeys('battleDate', 'battle_date')
  .display({ name: 'Battle Date' })
  .withCapability('required-in', { flows: ['single-entry-import'] })
  .withCapability('composite-key-component', { part: 'datetime', precision: 'minute' })
  .derivesInternalFields(['_date', '_time']) // see §10 for the real example
  .build()
```

And the consumer queries:

```ts
// single-entry import validator
const required = registry.query({
  hasCapability: 'required-in',
  where: (f) => f.capability('required-in')!.flows.includes('single-entry-import'),
})
```

This works, and it's tidy. But it's also overkill when the consumer only cares about one specific field. The composite-key generator wants `battleReport_battleDate` *by name* because the key is a structural piece of the duplicate-detection algorithm; iterating over "all fields that are datetime-component of the composite key" is indirection without payoff.

**The pragmatic rule: hardcode the key at the call site when the logic is genuinely about *that* field.** Extract to a capability when three or more consumers would benefit.

For `battleReport_battleDate`:

- `required-in: single-entry-import` is a capability worth having — 3+ consumers (the import form, the import preview, the bulk importer, and a future Paste-From-Mobile flow).
- `composite-key-component` is *not* worth a capability. Only the duplicate-detection module uses it, the algorithm is specific to tier/wave/date, and abstracting it would hide the algorithm's logic behind a query. Hardcode `run.fields.battleReport_battleDate` there and move on.

The field registry does not eliminate hardcoded keys. It **concentrates them to places where the hardcoding is load-bearing** and removes them from places where the pattern is "every field of type X." That split is the ongoing discipline.

For hardcoded sites, the safety net is the **capability system + invariant tests**. The duplicate-detection test asserts `fieldRegistry.getField('battleReport_battleDate')` exists at startup. If the field is renamed or removed, the test fails before runtime. That's the migration-safety contract: hardcoded references are allowed, but they are tested.

### 9.7. Branch-fresh vs in-place

Honest call: this is a rewrite of significant surface area. 150 new files, a new registry, a new builder DSL, a new invariant test suite, refactors of every consumer feature. The question is: does it ship better on a fresh branch from v0.11, or incrementally grown into v0.12?

**Argument for branch-fresh:**

- A clean start lets you design the capability set without fighting legacy.
- No need to keep the old `COIN_FIELDS` / `V2_TO_V3_FIELD_MAP` parallel during the transition.
- PRs are additive (create new files) rather than churning existing ones.

**Argument for in-place incremental:**

- Each phase ships value on its own (§6).
- Every phase is revertible independently.
- No long-lived branch to rebase against `main`.
- User sees continuous improvement, not a big-bang cutover.

**The incremental plan (§6) is the right posture for a real codebase.** A long-lived rewrite branch dies on the vine every time. The incremental plan's step 1 (coin sources, ~14 fields) is a self-contained, reversible proof that ships in one PR and one sprint. If it feels bad, stop. If it feels good, keep going.

**PR sequence + LOC estimates:**

| PR | Scope | Net LOC | Risk |
|---|---|---|---|
| 1 | Infrastructure: registry, builder, capability types, empty `/dev/field-registry` route, `npm run field:*` scripts | +400 / −0 | Low — no existing code touched |
| 2 | Coin sources pilot: 14 field files, `coin-source` capability contract, refactor `COIN_FIELDS` / `COINS_EARNED_CONFIG` to derive | +500 / −150 | Medium — changes Economic section behavior |
| 3 | V2 migration: add `.legacyKeys()` to migrated fields, refactor migration runtime to consult registry, keep old map as fallback + log drift | +100 / −0 | Low — registry is additive over the map |
| 4 | Damage sources: same pattern as PR 2 | +400 / −120 | Medium |
| 5 | Enemies-hit-by / enemies-destroyed-by / killed-with-effect-active | +600 / −200 | Medium |
| 6 | Records + Battle Report summary fields | +400 / −100 | Low — these are leaf fields |
| 7 | Counts + utility + cash + currencies + upgrade-shards | +500 / −150 | Low |
| 8 | Parser type-detection consolidation: registry-first, heuristic fallback | +150 / −80 | Medium — touches the hot parse path |
| 9 | Aggregation strategies: add `.aggregates()` everywhere, refactor time-series to consult registry | +200 / −50 | Medium — affects every chart |
| 10 | Delete the graveyard: remove old `COIN_FIELDS` / `V2_TO_V3_FIELD_MAP` / hand-maintained section configs | +50 / −800 | Low — purely deletion |

Total: roughly +3300 / −1650 over 10 PRs. Net ~1650 lines added, but with far denser meaning per line. Each PR is 1–3 days of work for a single engineer plus review.

**Recommended: incremental, in-place, in the order above.** PR 1 + PR 2 together form the go/no-go decision point. If PR 2 doesn't obviously improve the developer experience when adding a hypothetical new coin source, abort and explore another approach. If it does, the rest is the same pattern at scale.

### 9.8. Runtime discoverability (CLI / UI)

The approach's best property is per-field locality. A small CLI suite amplifies it: every field question becomes a shell command, and the registry becomes self-describing without opening any files.

Four scripts under `scripts/field-registry/`, wired to `package.json`:

**`npm run field:describe <key>`** — dump every registered capability for a field.

```
$ npm run field:describe coins_goldenTower

coins_goldenTower
─────────────────
File:              src/shared/domain/fields/fields/coins/golden-tower.field.ts
Display:           "Golden Tower" (color #fbbf24, format: largeNumber)
Parse:             section="Coins" label="Golden Tower" type=number
Legacy keys:       coinsFromGoldenTower
Sections:          economic (order 4)
Capabilities:
  coin-source      → totalField: battleReport_coinsEarned, color: #fbbf24
  aggregation      → strategy: sum
```

**`npm run field:list [--has-capability=<name>] [--section=<name>] [--missing=<capability>]`** — filter by criteria.

```
$ npm run field:list --has-capability=coin-source
coins_deathWave             "Death Wave"          #ef4444
coins_goldenTower           "Golden Tower"        #fbbf24
coins_spotlight             "Spotlight"           #e2e8f0
coins_goldenBot             "Golden Bot"          #fbbf24
coins_blackHole             "Black Hole"          #475569
...
14 fields.
```

**`npm run field:missing <capability>`** — fields that do NOT have a given capability. The workhorse for capability rollouts (§8.2.3).

```
$ npm run field:missing rate-formula
battleReport_tier           (would need: excluded — categorical)
battleReport_killedBy       (would need: excluded — string type)
records_highestCoinsMinute  (would need: excluded — record)
counts_wavesSkipped         (would need: excluded — flat count)
counts_deathDefy            (would need: excluded — flat count)
...
18 fields missing `rate-formula` out of 150.
```

Paired with `--match=<predicate>`, this answers "which *numeric* fields are missing the new capability?" — the subset that matters for a rollout.

**`npm run capability:list`** — every declared capability + the fields that register it.

```
$ npm run capability:list
coin-source            × 14 fields     (defined in capabilities/is-coin-source.ts)
damage-source          × 12 fields     (defined in capabilities/is-damage-source.ts)
is-total-for           × 5  fields     (defined in capabilities/is-total-for.ts)
aggregation            × 150 fields    (defined in capabilities/aggregation.ts)
rate-formula           × 0   fields    (defined in capabilities/rate-formula.ts) [!] no producers
```

The `[!] no producers` annotation is the signal that PR 2 defined a capability contract but no field has opted in yet — either the rollout is incomplete, or the capability is dead code. Invariant test backing.

**Why this matters for AI-driven development.** An AI assistant (or a cold human reviewer) can introspect the field registry with four commands instead of reading 150 files. `describe`, `list`, `missing`, `capability:list` cover almost every per-field question that would otherwise require grep-and-read. This is what makes the composable model "AI-readable" — the registry becomes a command-line interface to the codebase's domain model.

A future extension: `npm run field:trace <key>` that walks from a field through every capability it registers and every consumer that queries those capabilities, printing a dependency tree. Not in v1, but the data is all there.

---

## 10. When this approach's locality wins

The fan-out in §8 is the honest weakness. This section is the honest strength: **for a non-trivial field with rich behavior, opening one file is the entire story.** The best way to show it is with a real field that has every interesting dimension.

### 10.1. The complete `battleReport_battleDate` field file

`battleReport_battleDate` is the most interesting field in the codebase. It has:

- **Date-type parse** with localized format tolerance (V28 exports vary by locale).
- **Required-in-flow** constraint (single-entry import form validates it).
- **Derives internal fields** — `_date` and `_time` are computed for fast filter/grouping.
- **Composite-key component** for duplicate detection (minute-precision datetime).
- **Legacy aliases** from V2 (`battleDate`, `battle_date` from older exports).
- **Display formatting** that differs by context (full datetime in the card, date-only in lists).

In the current code, the logic for this field is scattered across the parser, the date-formatters utility, the duplicate-detection module, the single-entry import form, and the derivation hooks. Under 05, it's one file:

```ts
// src/shared/domain/fields/fields/battle-report/battle-date.field.ts
import { defineField } from '../../define-field'
import {
  parseBattleDateLocalized,
  formatIsoDate,
  formatIsoTime,
  formatIsoDateTimeMinute,
} from '@/shared/formatting/date-formatters'

export const battleDate = defineField('battleReport_battleDate')
  .parseFrom({ section: 'Battle Report', label: 'Battle Date', type: 'date' })
  .legacyKeys('battleDate', 'battle_date')
  .display({ name: 'Battle Date', formatHint: 'raw' })
  .appearsInSection('battleReport', { order: 2 })
  .aggregates({ strategy: 'last' }) // a run has one date; aggregating is last-wins
  // Required by the single-entry import form and the paste-preview validator.
  .withCapability('required-in', { flows: ['single-entry-import', 'bulk-paste-preview'] })
  // Coerce localized date strings. V28 ships "04/18/2026 14:30:15" or "18.04.2026 14:30:15"
  // depending on locale; older V27 data sometimes has epoch millis as a string.
  .coercesVia((raw) => {
    if (!raw) return undefined
    const asNumber = Number(raw)
    if (Number.isFinite(asNumber) && asNumber > 1_000_000_000_000) {
      return new Date(asNumber) // epoch millis fallback (V27-era quirk)
    }
    return parseBattleDateLocalized(raw) // returns Date | undefined
  })
  // Derived internal fields — registered here so the hook that builds
  // ParsedGameRun knows to populate them. `_date` and `_time` are used
  // for fast date-only filtering and time-of-day grouping respectively.
  .derivesInternalFields({
    _date: (value) => (value instanceof Date ? formatIsoDate(value) : undefined),
    _time: (value) => (value instanceof Date ? formatIsoTime(value) : undefined),
  })
  // Composite-key membership. Minute precision matches the duplicate-detection
  // algorithm in src/shared/domain/duplicate-detection/duplicate-detection.ts.
  .withCapability('composite-key-component', {
    part: 'datetime',
    precision: 'minute',
    formatter: (value) => (value instanceof Date ? formatIsoDateTimeMinute(value) : ''),
  })
  // Tombstone: if V29 renames this, update the canonical key above and add
  // the old name here. Drop entirely only after 2+ releases of migration
  // headroom (see markDroppedInVersion usage below when applicable).
  .build()
```

Every line is a real use-site. Every capability registration answers a question a future maintainer will ask:

- *"Why does this field parse dates from multiple locales?"* → The `.coercesVia` block.
- *"Where is this field required?"* → The `required-in` capability.
- *"How are `_date` and `_time` populated?"* → The `.derivesInternalFields` block.
- *"Why does the duplicate-detection key use minute precision?"* → The `composite-key-component` capability.
- *"What are the legacy V2 names?"* → `.legacyKeys(...)`.
- *"What section does this appear in?"* → `.appearsInSection(...)`.
- *"How does it aggregate in charts?"* → `.aggregates(...)`.

One file, 40 lines of real code, seven distinct behaviors. Compare to the status quo, where these behaviors live in:

1. `src/features/analysis/shared/parsing/section-aware-parser.ts` — parse rule
2. `src/features/analysis/shared/parsing/field-utils.ts` — type detection for "Date"
3. `src/shared/formatting/date-formatters.ts` — localized parser + formatters
4. `src/contexts/data-context.tsx` or a hook — `_date` / `_time` derivation
5. `src/shared/domain/duplicate-detection/duplicate-detection.ts` — composite-key use
6. `src/features/data-import/single-entry/use-single-entry-form.ts` — required validator
7. `src/shared/domain/migrations/v2-to-v3-field-map.ts` — legacy aliases

Seven files, one field's story split across all of them, each file knowing only its slice.

### 10.2. The git-blame angle

Concrete scenario: a contributor is debugging why `_date` isn't populating correctly for a run imported from the Russian locale. The raw value is `"18.04.2026 14:30:15"` (dot-separated day.month.year). The contributor doesn't know the codebase.

**Under the status quo:**

1. Grep for `_date`. Hits in the data context, in filter hooks, in multiple chart inputs.
2. Find the derivation site. Read the logic. Notice it calls `formatIsoDate(someDate)`.
3. Grep for where `someDate` comes from. Back up to the parser output.
4. Trace back through `parseBattleDate` in date-formatters.
5. Find the localized parser. Realize it only handles `/`-separated formats.
6. Patch the localized parser.
7. Wonder if there are other fields with the same issue. No easy way to check.

Seven steps, five files opened, one hour.

**Under the composable model:**

1. Open `fields/battle-report/battle-date.field.ts`.
2. See `.coercesVia((raw) => parseBattleDateLocalized(raw))`.
3. Open `parseBattleDateLocalized` in date-formatters. Notice the format list is incomplete.
4. Add the `dd.MM.yyyy` format. Save.

Four steps, two files opened, 15 minutes.

The locality difference is real and compounds. For every future "why does this field do X" question, the composable model delivers a one-file answer. That ergonomic win, multiplied across 150 fields and across 18+ months of maintenance, is the approach's core payoff.

**Git-blame also tells a cleaner story.** Under the status quo, "who last changed the battle-date handling" produces a scattered history across 7 files — most of those changes unrelated to the battle date (they happened to touch the file for other reasons). Under 05, `git log fields/battle-report/battle-date.field.ts` is the actual history of this specific field. Every commit in that log is a decision about this field. No noise.

That's the sense in which per-field locality compounds: **the file is not just a container for today's code; it's the historical record of the field's evolution.** Renames, capability additions, coercion fixes, legacy-alias additions — all recorded on the field that owns the identity. That is, in the end, what the user meant by "I want to open one file and see everything about a field." The composable model delivers it literally.

---

## 11. Internal app-fields — how this approach handles them

Sections 1-10 have been talking almost exclusively about game fields (`battleReport_coinsEarned`, `damage_projectiles`, and so on) — values that arrive from the Tower export and are subject to version churn. But the app also owns a second category of fields: **internal fields**, which are the ones prefixed with `_`. These are app-generated metadata, not parsed from the game export (or only *partially* derived from it). Today they live in `src/shared/domain/fields/internal-field-config.ts`:

```
_date         // derived from battleReport_battleDate
_time         // derived from battleReport_battleDate
_notes        // user-supplied
_runType      // user-chosen (enum: 'farm' | 'tournament' | 'milestone')
_rank         // user-supplied, tournament-only
```

These fields differ from game fields in four structurally important ways:

1. **Underscore CSV headers.** CSV export writes them as `_Date`, `_Time`, `_Notes`, `_Run Type`, `_Rank` — explicitly distinct from game-field headers like `v3_battleReport_coinsEarned` so re-imports can't collide.
2. **Cross-version stability.** They survive untouched when the game schema changes. A v27 → v28 migration rewrites `battleReport_*` keys but leaves `_runType` alone.
3. **Enum-like value constraints.** `_runType` is not free-form — it must be one of three known values. `_rank` is a number string but semantically only applies to tournament runs.
4. **Sometimes derived.** `_date` and `_time` are computed from `battleReport_battleDate` during parse, not supplied by the user.

The question this section answers: does the composable file-per-field model handle these structural differences gracefully, or does it need a separate mechanism?

The short answer: **it handles them well, but it forces two new capabilities** — `.acceptsValues(...)` and `.derivesFrom(...)` — that don't appear in the game-field world. Both are small and well-scoped. Both make existing scattered logic visible in one file.

### 11.1. The `_runType` field as a composable file

```ts
// src/shared/domain/fields/fields/internal/run-type.field.ts
import { defineField } from '../../define-field'

export const runType = defineField('_runType')
  .isInternal({ csvHeader: '_Run Type', csvOrder: 4 })
  .display({ name: 'Run Type', formatHint: 'raw' })
  // Enum-value enforcement. Consumers (filter dropdowns, add-run modal,
  // bulk-import preview) query this list; no feature hand-codes the values.
  .acceptsValues(['farm', 'tournament', 'milestone'] as const)
  .defaultValue('farm')
  // Detection fallback: when a parsed run has no explicit runType but we
  // can infer one from the tier string (e.g. "10+" → tournament), this
  // is the rule. Mirrors detectRunTypeFromFields in run-type-detection.ts.
  .detectFrom({
    // First try explicit field (legacy CSVs wrote 'runType' or 'run_type').
    explicitKeys: ['runType', 'run_type'],
    // Fallback: tier-string heuristic.
    inferFrom: (fields) => {
      const tier = fields.battleReport_tier?.rawValue ?? fields.tier?.rawValue ?? ''
      return /\+/.test(tier) ? 'tournament' : 'farm'
    },
  })
  // Legacy v1 migration: old CSVs exported 'runType' and 'run_type' as
  // game-field-shaped keys. On load, rewrite them to '_runType'.
  .legacyKeys('runType', 'run_type')
  // Enum-specific display: color, label, ordering. Replaces the current
  // split across run-type-display.ts and run-type-selector-options.ts.
  .enumDisplay({
    farm:       { label: 'Farm',       color: '#10b981', order: 1 },
    tournament: { label: 'Tournament', color: '#f59e0b', order: 2 },
    milestone:  { label: 'Milestone',  color: '#8b5cf6', order: 3 },
  })
  // Feature-visibility signal: consumers that offer a run-type filter ask
  // `registry.getField('_runType').isFilterable()` — always true here.
  .withCapability('filterable', { scope: 'global' })
  .build()
```

Seven capabilities registered. Every one of them corresponds to a real file in today's codebase:

| Capability | Today's home |
|---|---|
| `.isInternal({ csvHeader })` | `internal-field-config.ts` (`INTERNAL_FIELD_MAPPINGS`) |
| `.acceptsValues(...)` | `types.ts` (`RunType` enum) |
| `.defaultValue('farm')` | `run-type-defaults.ts` (`mapUrlTypeToRunType` fallback) |
| `.detectFrom({ explicitKeys, inferFrom })` | `run-type-detection.ts` (`detectRunTypeFromFields`) |
| `.legacyKeys(...)` | `internal-field-config.ts` (`LEGACY_FIELD_MIGRATIONS`) |
| `.enumDisplay({...})` | `run-type-display.ts` + `run-type-selector-options.ts` |
| `.withCapability('filterable', ...)` | implicit — every filter hook hand-wires it |

Status quo: seven files. Composable: one file.

### 11.2. The `.acceptsValues(...)` capability — making enum constraints queryable

Today, the set `['farm', 'tournament', 'milestone']` lives in `RunType` (`types.ts`). Consumers that need it either import the enum directly or pattern-match strings. The former is fine; the latter is fragile — when `'dissonance'` is added (section 12), every `switch (runType)` statement becomes a bug waiting to happen.

Under the composable model, consumers query the registry:

```ts
// src/features/data-import/manual-entry/run-type-selector.tsx
import { registry } from '@/shared/domain/fields/registry'

const runTypeField = registry.getField('_runType')
const validValues = runTypeField.acceptedValues()
// ['farm', 'tournament', 'milestone']  — or later: ['farm', 'tournament', 'milestone', 'dissonance']

const options = validValues.map((value) => ({
  value,
  label: runTypeField.enumLabel(value),       // 'Farm' | 'Tournament' | ...
  color: runTypeField.enumColor(value),       // '#10b981' | ...
}))
```

The add-run modal, the filter dropdown (`src/features/game-runs/filters/` and `src/features/analysis/shared/filtering/`), and the bulk-import preview all consume the same source. Adding a new enum value (section 12) auto-propagates — no grepping for `switch (runType)` sites.

**Invariant test.** A single registry-level test asserts that every field declared with `.acceptsValues(...)` has a corresponding `.enumDisplay(...)` entry for every value. Adding `'dissonance'` to `.acceptsValues` without a matching `enumDisplay.dissonance` entry fails CI. This is the fan-in win from §8.3 applied to enums.

### 11.3. The `.derivesFrom(...)` capability — internal fields that aren't user-supplied

`_date` and `_time` are special: they're internal fields (underscore prefix, app-owned, CSV-renamed) but their value is **computed** from another field, `battleReport_battleDate`. The status quo spreads this across the parser, a derivation hook in the data context, and date-formatter utilities.

The composable file:

```ts
// src/shared/domain/fields/fields/internal/date.field.ts
import { defineField } from '../../define-field'
import { formatIsoDate } from '@/shared/formatting/date-formatters'

export const date = defineField('_date')
  .isInternal({ csvHeader: '_Date', csvOrder: 1 })
  .display({ name: 'Date', formatHint: 'raw' })
  // Derivation: this field is populated by the parser from another field's
  // coerced value, not from a user-supplied input. The second argument
  // receives the DERIVED value (Date) of the source field, not the raw string.
  .derivesFrom('battleReport_battleDate', (battleDateValue) => {
    return battleDateValue instanceof Date ? formatIsoDate(battleDateValue) : undefined
  })
  .legacyKeys('date') // V1 CSVs wrote a bare 'date' column
  .withCapability('filterable', { scope: 'global' })
  .build()
```

```ts
// src/shared/domain/fields/fields/internal/time.field.ts
import { defineField } from '../../define-field'
import { formatIsoTime } from '@/shared/formatting/date-formatters'

export const time = defineField('_time')
  .isInternal({ csvHeader: '_Time', csvOrder: 2 })
  .display({ name: 'Time', formatHint: 'raw' })
  .derivesFrom('battleReport_battleDate', (battleDateValue) => {
    return battleDateValue instanceof Date ? formatIsoTime(battleDateValue) : undefined
  })
  .legacyKeys('time')
  .build()
```

**How the parser calls these.** During a parse run-through, after all game fields are parsed into `{ rawValue, value }` pairs, the parser walks `registry.getDerivedFields()` and runs each one:

```ts
// src/features/analysis/shared/parsing/section-aware-parser.ts (conceptual)
function applyDerivations(parsed: Record<string, GameRunField>): void {
  for (const derived of registry.getDerivedFields()) {
    const sourceKey = derived.getDerivationSource()          // 'battleReport_battleDate'
    const sourceField = parsed[sourceKey]
    if (!sourceField) continue
    const derivedValue = derived.applyDerivation(sourceField.value)
    parsed[derived.key] = {
      rawValue: String(derivedValue ?? ''),
      value: derivedValue,
    }
  }
}
```

The mirror operation in `battleDate.field.ts` from §10.1 (`.derivesInternalFields({ _date, _time })`) and the new `.derivesFrom('battleReport_battleDate', ...)` declarations in `_date` and `_time` describe the **same relationship from opposite directions**. Do we need both? No — the registry collapses them. At build time, the registry validates:

- Every `.derivesInternalFields({ _date: ... })` has a matching `_date` field with a `.derivesFrom('battleReport_battleDate', ...)` declaration.
- The transform functions are identical (or, more practically, the derived-field declaration is the source of truth and `.derivesInternalFields(...)` is omitted).

**Recommendation:** only use `.derivesFrom(...)` on the derived field's file. The source field's file stays clean. This is the pure direction of the dependency.

### 11.4. Gotchas — and how the composable file surfaces each one

These are real gotchas from today's codebase. The question for each is: **does opening one file make it obvious?**

**1. CSV header mismatch between internal-field keys and export columns.**
`_runType` (internal key) ≠ `_Run Type` (CSV header). Today, the mapping lives in `INTERNAL_FIELD_MAPPINGS` in `internal-field-config.ts`, far from any field's logic. A contributor renaming `_runType` to `_runCategory` could easily miss the CSV-header rename and break round-trip.

**Composable verdict:** visible. `.isInternal({ csvHeader: '_Run Type' })` in `run-type.field.ts` makes the pair obvious. Rename one, rename both on the same line.

**2. `_rank` is only meaningful for tournament runs.**
`handleRunTypeChange` in `use-data-input-form.ts` clears `rank` when switching away from tournament. The "rank only for tournament" rule is encoded in one React handler, far from the field definition.

**Composable verdict:** visible, once `.visibleWhen(...)` lands. `rank.field.ts` declares `.visibleWhen(run => run.fields._runType?.value === 'tournament')`. The handler becomes a consequence of the registered rule instead of its only home. (This is also the mechanism for dissonance sub-categories in §12.)

**3. `_notes` encoding — newlines and tabs.**
Notes can contain newlines. The CSV exporter quotes them; the bulk-paste preview strips leading whitespace but preserves in-cell newlines. These rules live in `csv-exporter.ts` and `data-parser.ts`.

**Composable verdict:** partially visible. `notes.field.ts` can declare `.csvQuote({ preserveNewlines: true })` but the pre-parse stripping still lives in the parser. The field file makes the *encoding contract* visible; the parser is where the contract is enforced. Better than today, not perfect.

**4. `_runType` detection vs. `_runType` explicit value.**
Today's `detectRunTypeFromFields` runs the tier-string heuristic only when there's no explicit field. A subtle corner case: a v1 CSV with `runType=farm` (explicit) and `tier=10+` (would infer tournament) — the explicit value wins. This precedence is a one-liner in `run-type-detection.ts` that a reader might miss.

**Composable verdict:** visible. `.detectFrom({ explicitKeys, inferFrom })` makes the precedence explicit in the registration: explicit keys are tried first, then `inferFrom` runs.

**5. `_date` / `_time` derivation timing.**
Today, `_date` and `_time` are populated in two places: during parse (for new runs) and during localStorage migration (for old runs that lack them). The two paths are structurally different and can drift. A date-formatter change might fix new runs but leave legacy runs stale.

**Composable verdict:** visible. The `derivesFrom` declaration lives on `_date` / `_time`. The migration code walks `registry.getDerivedFields()` and re-runs derivations on every loaded run. One source of truth, two consumers. No drift.

**6. Legacy v1 migration naming collisions.**
`LEGACY_FIELD_MIGRATIONS` maps `'date' → '_date'`, `'runType' → '_runType'`. Two separate problems: (a) if a future game-export ever exports a bare `date` column, the migration would eat it; (b) the migration table and the canonical-key table live in separate constants, easy to update one without the other.

**Composable verdict:** visible for (b), not for (a). `.legacyKeys('date')` on the `_date` field co-locates the alias with the canonical key. But **no file-per-field model prevents a future game-export name collision** — that's a registry-level invariant (§8.3), not a per-field concern. The registry can assert: for every `.legacyKeys('date')` on an internal field, no game field currently uses or reserves `'date'`.

**7. Tournament-only `_rank` field in CSV export.**
`INTERNAL_FIELD_ORDER` always includes `_rank`. For a farm-only CSV export, the column is present but every cell is blank. Is that desired?

**Composable verdict:** visible, and makes the question askable. `.isInternal({ csvHeader: '_Rank', csvOrder: 5 })` plus `.visibleWhen(...)` lets the exporter ask "is this field visible for ANY run in the export?" and omit the column entirely when the answer is no. Today this logic would be awkward to add because the exporter doesn't know about per-field visibility rules.

**8. `RunTypeValue` type drift.**
Today, `RunTypeValue = '${RunType}'` is a template-literal type derived from the enum. Every consumer imports `RunTypeValue` from `types.ts`. Under the composable model, the type source of truth becomes the field definition's `.acceptsValues(...)` literal tuple.

**Composable verdict:** visible. TypeScript can infer `type RunTypeValue = typeof runType['acceptedValues'][number]`. Consumers import from `fields/internal/run-type.field.ts` instead of `run-types/types.ts`, and the enum declaration becomes redundant. This is a cleanup opportunity, not a gotcha per se — but it's an opportunity the composable model creates.

**Summary.** Of eight gotchas, the composable model makes six visible in-file, partially addresses one (notes encoding), and leaves one as a registry-level concern (cross-category name collision). That's a meaningful improvement over today, where the majority of these gotchas are implicit contracts spread across five files.

---

## 12. Extending with a new run type + sub-category (dissonance)

V28 introduced a fourth run type: **dissonance**. Dissonance runs have four sub-categories — Attack, Defense, Ultimate Weapons, Utility — that ship as separate export files (`Dissonance_Attack_2026-04-09.txt`, `Dissonance_Defense_2026-04-09.txt`, etc.). The sub-category affects which game fields are present in the export, which sections render in the run-details card, and which analytics views make sense.

Requirements:
- Add `'dissonance'` to `_runType`'s accepted values.
- Add a new internal field `_dissonanceSubCategory` with values `'attack' | 'defense' | 'ultimate-weapons' | 'utility'`.
- Wire through:
  - Parser: route `Dissonance_<Category>_*.txt` files into `_dissonanceSubCategory = <category>`.
  - Single-entry modal: conditional sub-category picker when `_runType === 'dissonance'`.
  - Bulk import: pick up the sub-category from filename.
  - Filters: show a dissonance filter on analysis pages **only if** any stored run has `_runType = 'dissonance'`.
  - Run-details display: show sub-category on the run card.

Let's measure the cost honestly.

### 12.1. File-change inventory

**Edits to existing composable files (2 files):**

1. `src/shared/domain/fields/fields/internal/run-type.field.ts` — add `'dissonance'` to `.acceptsValues(...)` and `.enumDisplay(...)`.
2. `src/features/analysis/shared/parsing/section-aware-parser.ts` — the parser takes a filename hint; add the filename-regex routing rule for `Dissonance_*_*.txt`. (Alternative: the sub-category field owns its own detection rule — see 12.2.)

**New composable file (1 file):**

3. `src/shared/domain/fields/fields/internal/dissonance-sub-category.field.ts` — the new field.

**Edits to non-composable files (0-2 files):**

- **Potentially zero** if features query the registry for filterable internal fields and render them generically. The composable model is specifically designed to make this possible.
- **At most two** if features still hand-render filters for specific fields: the dissonance filter in `src/features/analysis/shared/filtering/` and a section renderer in `src/features/game-runs/card-view/run-details/section-config.ts`.

The honest number: **3 files definitely change, 2 more might change** depending on how generic the consuming code is. Compare to the status-quo estimate in 12.3.

### 12.2. Concrete code

**Updated `run-type.field.ts`** (diff view):

```ts
// src/shared/domain/fields/fields/internal/run-type.field.ts
export const runType = defineField('_runType')
  .isInternal({ csvHeader: '_Run Type', csvOrder: 4 })
  .display({ name: 'Run Type', formatHint: 'raw' })
  .acceptsValues(['farm', 'tournament', 'milestone', 'dissonance'] as const) // + dissonance
  .defaultValue('farm')
  .detectFrom({
    explicitKeys: ['runType', 'run_type'],
    inferFrom: (fields, context) => {
      // NEW: filename-based detection for dissonance exports.
      if (context?.sourceFilename?.match(/^Dissonance_/i)) return 'dissonance'
      const tier = fields.battleReport_tier?.rawValue ?? fields.tier?.rawValue ?? ''
      return /\+/.test(tier) ? 'tournament' : 'farm'
    },
  })
  .legacyKeys('runType', 'run_type')
  .enumDisplay({
    farm:       { label: 'Farm',        color: '#10b981', order: 1 },
    tournament: { label: 'Tournament',  color: '#f59e0b', order: 2 },
    milestone:  { label: 'Milestone',   color: '#8b5cf6', order: 3 },
    dissonance: { label: 'Dissonance',  color: '#ec4899', order: 4 }, // NEW
  })
  .withCapability('filterable', { scope: 'global' })
  .build()
```

Two functional additions: an accepted value, a display entry, a filename-detection branch. The `enumDisplay` entry is what §11.2's invariant test would force a contributor to add.

**New `dissonance-sub-category.field.ts`:**

```ts
// src/shared/domain/fields/fields/internal/dissonance-sub-category.field.ts
import { defineField } from '../../define-field'

type DissonanceSubCategory = 'attack' | 'defense' | 'ultimate-weapons' | 'utility'

export const dissonanceSubCategory = defineField('_dissonanceSubCategory')
  .isInternal({ csvHeader: '_Dissonance Category', csvOrder: 6 })
  .display({ name: 'Dissonance Category', formatHint: 'raw' })
  .acceptsValues(['attack', 'defense', 'ultimate-weapons', 'utility'] as const)
  // Only populated when the parent run type is dissonance. Consumers querying
  // for filterable fields still see this field, but respect its visibility rule
  // (filter UI hides it when no dissonance runs exist; modal only asks for it
  // when runType === 'dissonance'; CSV export writes a blank cell otherwise).
  .visibleWhen((run) => run.fields._runType?.value === 'dissonance')
  // Detection: derive from export filename. Pattern is literal from sampleData/v28/:
  //   Dissonance_Attack_2026-04-09.txt
  //   Dissonance_Defense_2026-04-09.txt
  //   Dissonance_UltimateWeapons_2026-04-09.txt
  //   Dissonance_Utility_2026-04-10.txt
  .detectFrom({
    inferFrom: (_fields, context) => {
      const match = context?.sourceFilename?.match(
        /^Dissonance_(Attack|Defense|UltimateWeapons|Utility)_/i,
      )
      if (!match) return undefined
      const raw = match[1].toLowerCase()
      return raw === 'ultimateweapons' ? 'ultimate-weapons' : raw
    },
  })
  .enumDisplay({
    'attack':           { label: 'Attack',           color: '#ef4444', order: 1 },
    'defense':          { label: 'Defense',          color: '#3b82f6', order: 2 },
    'ultimate-weapons': { label: 'Ultimate Weapons', color: '#f97316', order: 3 },
    'utility':          { label: 'Utility',          color: '#a78bfa', order: 4 },
  })
  // Filter-UI hint: only show the filter when at least one run has a value.
  // Consumer (filter toolbar) asks `registry.getFilterableFields(runs)` and
  // this capability is consulted.
  .withCapability('filterable', {
    scope: 'conditional',
    showWhen: (runs) => runs.some(r => r.fields._runType?.value === 'dissonance'),
  })
  .build()
```

One file. Eight capability registrations. Every behavior the feature needs is declared here:

- Enum enforcement (`acceptsValues`)
- Display formatting (`enumDisplay`)
- Parse detection (`detectFrom` with filename context)
- Form visibility (`visibleWhen`)
- Filter visibility (`filterable` with `showWhen`)
- CSV export rules (`isInternal({ csvOrder })` + `visibleWhen` controls whether the column is written)

**Parser integration.** The section-aware parser already accepts a filename hint (it must, to tell Dissonance exports apart from regular exports). Under the composable model, the parser doesn't special-case dissonance — it runs the registry's detection pipeline:

```ts
// src/features/analysis/shared/parsing/section-aware-parser.ts (conceptual)
function parseExport(
  text: string,
  context: { sourceFilename?: string },
): Record<string, GameRunField> {
  const parsed: Record<string, GameRunField> = {}

  // 1. Parse game fields from text sections (unchanged).
  parseGameSections(text, parsed)

  // 2. Run detection for every internal field that declares `.detectFrom(...)`.
  for (const field of registry.getDetectableInternalFields()) {
    const detected = field.runDetection(parsed, context)
    if (detected !== undefined) {
      parsed[field.key] = {
        rawValue: String(detected),
        value: detected,
      }
    }
  }

  // 3. Apply derivations (_date, _time from battleReport_battleDate).
  applyDerivations(parsed)

  return parsed
}
```

The parser changes **only once — ever — to accept a `sourceFilename` context**. Every future detectable internal field (including `_dissonanceSubCategory`) plugs into step 2 without another parser edit.

**Filter component that auto-discovers the new field:**

```tsx
// src/features/analysis/shared/filtering/internal-field-filters.tsx
import { registry } from '@/shared/domain/fields/registry'
import { useData } from '@/shared/domain/use-data'

export function InternalFieldFilters(): React.ReactElement {
  const { runs } = useData()
  const filterableFields = registry.getFilterableInternalFields(runs)

  return (
    <>
      {filterableFields.map(field => (
        <EnumFilter
          key={field.key}
          label={field.displayName}
          field={field}
          runs={runs}
        />
      ))}
    </>
  )
}
```

The filter toolbar doesn't know about dissonance. Adding a new conditionally-filterable internal field — *any* new one — automatically appears here the day its `.field.ts` lands in the registry. This is the fan-in win of §8 applied to UI composition.

**Add-run modal conditional picker:**

```tsx
// src/features/data-import/manual-entry/internal-field-pickers.tsx
import { registry } from '@/shared/domain/fields/registry'

export function InternalFieldPickers({
  currentRun,
  onChange,
}: {
  currentRun: { fields: Record<string, GameRunField> }
  onChange: (fieldKey: string, value: unknown) => void
}): React.ReactElement {
  // registry.getUserEditableInternalFields() returns fields that accept
  // user input. getVisibleFor(currentRun) then filters by `.visibleWhen(...)`.
  const visibleFields = registry
    .getUserEditableInternalFields()
    .filter(field => field.isVisibleFor(currentRun))

  return (
    <>
      {visibleFields.map(field => (
        <EnumSelect
          key={field.key}
          label={field.displayName}
          options={field.acceptedValues().map(v => ({
            value: v,
            label: field.enumLabel(v),
            color: field.enumColor(v),
          }))}
          value={currentRun.fields[field.key]?.value as string}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
    </>
  )
}
```

When `_runType` is `'dissonance'`, `dissonanceSubCategory.isVisibleFor(currentRun)` returns true and the picker appears. When `_runType` is anything else, it doesn't. The modal component has zero dissonance-specific code.

### 12.3. Cross-cutting ripple — composable vs. status quo

The status-quo count is worth being concrete about. Today, adding `'dissonance'` + sub-category would touch, at minimum:

1. `src/shared/domain/run-types/types.ts` — enum addition
2. `src/shared/domain/run-types/run-type-detection.ts` — detection branch
3. `src/shared/domain/run-types/run-type-defaults.ts` — URL mapping
4. `src/shared/domain/run-types/run-type-display.ts` — color
5. `src/shared/domain/run-types/run-type-selector-options.ts` — option entry
6. `src/shared/domain/fields/internal-field-config.ts` — new `_dissonanceSubCategory`
7. `src/features/analysis/shared/filtering/run-type-filter.ts` — label map
8. `src/features/analysis/shared/parsing/section-aware-parser.ts` — dissonance filename routing
9. `src/features/data-import/manual-entry/use-data-input-form.ts` — conditional handler for sub-category
10. `src/features/data-import/manual-entry/data-input-state.ts` — initial sub-category state
11. `src/features/data-import/manual-entry/data-input-form-logic.ts` — save logic
12. `src/features/game-runs/card-view/run-details/section-config.ts` — render sub-category
13. `src/features/data-export/csv-export/csv-exporter.ts` — new column ordering
14. Route files: `src/routes/charts/coins.tsx`, `charts/cells.tsx`, `charts/fields.tsx` — URL param handling
15. `src/features/analysis/time-series/time-series-chart.tsx` — filter predicate update
16. `src/features/analysis/tier-trends/tier-trends-analysis.tsx` — filter predicate update
17. `src/features/analysis/source-analysis/use-source-analysis.ts` — filter predicate update
18. Every `switch (runType) { case 'farm': case 'tournament': case 'milestone': }` — add `case 'dissonance':`. `grep -rn "case 'milestone'"` currently returns ~8 hits.

Roughly **18-25 files**, most with small edits, many with easy-to-miss branches. The `switch` additions are the dangerous ones: TypeScript only catches missing cases if the switch is exhaustive-checked (which most are not).

Under the composable model: **3 files definite, 2 more possible, 0 `switch` updates** — because enum-aware consumers query `field.acceptedValues()` instead of branching on hardcoded strings.

The delta — roughly 20 files → 5 files, zero exhaustive-switch risk — is the feature-extension payoff of 05.

### 12.4. Honest assessment — where this still requires cross-cutting edits

Four honest admissions:

**1. The enum addition in `run-type.field.ts` IS still a central edit.**
Adding `'dissonance'` to `.acceptsValues(['farm', 'tournament', 'milestone', 'dissonance'])` is one line in one file, but it's a line in a shared file. The composable model hasn't eliminated central edits — it's collapsed *many* central edits across *many* files into *one* edit in *one* file. That's a real win, but if the goal is zero central edits, this approach doesn't reach it. (Nothing short of a plugin architecture reaches it, and plugins are overkill for this app.)

**2. Conditional-visibility logic requires consumers that query it.**
`.visibleWhen(run => run.fields._runType?.value === 'dissonance')` only works if the add-run modal, filter toolbar, and CSV exporter actually call `field.isVisibleFor(...)` before rendering or writing. If any consumer skips the registry and hand-rolls its own visibility, the capability is silently bypassed. Mitigation: invariant tests that assert every internal-field consumer uses the registry. Even with the test, it's a discipline requirement — the composable model doesn't enforce it at the compiler level.

**3. Parser routing still needs a filename-context plumbing change, once.**
The parser has to receive `sourceFilename` from its caller (bulk-paste, single-entry, file-drop). Today, that context doesn't thread through. Making it thread through is a one-time refactor (probably 4-6 files in the import pipeline). After that, every new filename-detectable field is free.

This is actually a generic shortcoming of today's code, not of the composable approach — but the composable approach surfaces it. That's fair: you can't add dissonance-from-filename detection at all today without similar plumbing.

**4. The `RunTypeValue` type alias is awkward during migration.**
Today, `RunTypeValue` is a template-literal type over the `RunType` enum. If `.acceptsValues(...)` becomes the source of truth, the enum becomes dead code. Deleting it is a breaking change for external imports — every feature that does `import { RunType, RunTypeValue } from '@/shared/domain/run-types/types'` has to change. Not a big deal, but it's real churn, and the composable model creates it.

**Net verdict for dissonance specifically.** The composable model turns a 20-file ripple into a 3-file ripple. It eliminates the exhaustive-switch hazard. It gives filename-based detection a home that doesn't require parser special-casing. It makes conditional visibility declarative. And it does all of this while requiring one unavoidable central edit (the enum extension) and one one-time plumbing change (filename context in the parser). That ratio — one central edit to gain locality for all future additions — is the honest fit profile for this approach.

---

## 13. Commit / PR strategy recommendation

The user's framing was honest: *"convince me."* Here's the convincing, delivered straight.

### 13.1. The case FOR big-bang on THIS approach

Three reasons, in order of weight:

**1. The composable model is a mechanical transformation.**
Section 7 showed the rollout: for each field, read its current scatter (parse rule, formatter, coin-source flag, rate formula, aggregation strategy) and pour it into a `.field.ts` file. There is almost no *design* happening during migration — all the design happens once, up front, when you settle on the `.withCapability(...)` API. After that, 150 fields are 150 repetitions of the same shape. A single-PR migration is nothing but the same pattern played out 150 times. That's ideal for a big review: skim one file carefully, then trust the shape of the rest.

**2. Cross-cutting consistency is only testable in aggregate.**
The invariant tests in §8.3 (every coin-source field has a color, every V2-mapped field has a canonical key, every `.acceptsValues` has an `.enumDisplay`) only pass when the migration is complete. If you split the migration into 10 PRs, each intermediate PR has partial invariants — you're either disabling the tests temporarily or accepting that CI is yellow for weeks. A big-bang flip turns red invariants green in one commit and they stay green.

**3. The "old path" and "new path" coexistence is expensive.**
During an incremental rollout, you have two systems: the scattered one (for unmigrated fields) and the composable one (for migrated fields). Every consumer has to branch on which era a field is in. That branching logic is throwaway code written specifically for the migration, and it lives in the codebase until the last field is migrated. Big-bang skips this entirely.

### 13.2. The case AGAINST big-bang

Two reasons, in order of weight:

**1. 150 new files in a single PR is a review nightmare, full stop.**
Even if each file is boring and similar, GitHub's PR-diff UI chokes on 150-file PRs. It truncates. It loads slowly. The "Files changed" tab becomes unusable. Reviewers mentally check out after the first 30 files. The user specifically prefers GitHub's diff UI — it's the tool most punished by this PR size.

**2. You can't pivot mid-flight.**
If you're 80 files in and realize the `.withCapability(...)` API is wrong (e.g. you should have gone with the graph approach — user's heavy favorite — instead), you've already spent days writing code in the wrong shape. An incremental rollout would have surfaced this after 1-2 files. A big-bang rollout surfaces it after 80.

This second point is the sharper one, and it dovetails with the user's "convince me" reservation about regretting the choice.

### 13.3. Concrete recommendation

**Recommend: hybrid — one foundation PR + one big-bang "flip" PR + optional cleanup PRs.**

This stance takes the user's concerns head-on:

- "Reviewing a 10k-line PR is painful" → Split the scaffolding from the mass migration. Scaffolding gets a focused review; the mass migration is structurally uniform and can be reviewed by sampling.
- "Multiple PRs pollute history if reverted" → Only two PRs do heavy lifting. Rollback is clean at either checkpoint.
- "Prefers GitHub's PR-diff view" → The scaffolding PR fits in that view. The mass-migration PR is skim-friendly because of the uniform file shape.
- "Might miss holistic impact if split" → The holistic view comes from the scaffolding PR, where the API and the first 3-5 representative fields are settled together. After that, the flip is implementation of a known design.
- "Changelog pollution from revert churn" → Two PRs, two changelog lines. Minimal.

**The sequence:**

**PR 1: Foundation + pilot fields (~2,000-3,000 lines, focused review).**
- `define-field.ts` + capability infrastructure.
- Registry (`registry.ts`, `registry-queries.ts`).
- 3-5 pilot fields covering the shape spectrum: one coin-source game field (`battleReport_coinsEarned`), one damage-source game field (`damage_projectiles`), one complex field (`battleReport_battleDate` from §10.1), one enum internal field (`_runType` from §11.1), one derived internal field (`_date` from §11.3).
- **Old and new paths coexist for these fields only.** Pilot fields are registered but consumers still use the status-quo code paths. The registry is introduced; nothing depends on it yet.
- Invariant tests for the capabilities the pilots use (even though full coverage isn't possible yet).
- Codebase tools from §9 (`field:describe`, `field:list`, `capability:list`) — these make PR 2 skimmable.

**PR 2: The flip (~8,000-12,000 lines, skim-friendly review).**
- Migrate the remaining ~145 fields.
- Switch consumers to query the registry instead of the scattered status quo.
- Delete the old scatter (internal-field-config, run-type-* files, coin-source tables, etc.).
- All invariant tests pass. All E2E tests pass. Build is green.

PR 2 is the uncomfortable one. But the uniformity earned by PR 1 makes it reviewable by **sampling** rather than reading: pick 15 random field files, verify they follow the shape from PR 1, trust the rest. `npm run field:list` in the PR description provides a machine-checkable index.

**Optional PR 3+: cleanup.**
- Remove now-redundant type aliases (`RunTypeValue` from §11.4).
- Consolidate color constants.
- Anything the architecture reviewer flags post-merge.

Two PRs do the real work. Changelog shows "Introduce composable field registry (PR #X)" and "Migrate all fields to composable registry (PR #Y)" — clean.

### 13.4. The "oh crap" case — mid-flight pivots

The user's sharpest concern: "I regret this halfway through. Now what?"

**Mid-flight pivot away from composable → graph.** The graph approach (the user's heavy favorite from a prior doc) models relationships between fields explicitly. The composable approach models capabilities field-by-field. Here's what's salvageable if you pivot:

- **The registry infrastructure (~100% salvageable).** `registry.getField(key)`, `registry.getFieldsWithCapability(...)`, etc. — all of this works identically under the graph model, just with different queries. The registry isn't tied to the composable API.
- **Per-field parse rules, legacy aliases, coercion functions (~100% salvageable).** These are atomic facts about each field. Every model needs them somewhere; the composable model's file is as good a home as any. Under the graph model, these can stay in the per-field files and the graph relationships layer over them.
- **Enum values + display mappings (~100% salvageable).** Same — atomic per-field facts.
- **Capability-based consumer queries (~50% salvageable).** Consumers that do `registry.getFieldsWithCapability('coin-source')` translate to `graph.query({ matches: 'coin-source' })`. The queries change shape but the *call sites* stay — you're swapping the underlying index, not rewriting features.
- **`.withCapability(...)` declarations (~30% salvageable).** The capability *names* and *schemas* are directly reusable in the graph model. The *mechanism* of registration changes (registration becomes graph-edge authoring instead of method chaining). Moderate rework, not from scratch.

The good news: **PR 1 above is mostly salvageable even under a pivot.** The scaffolding PR is the high-risk commitment, and its cost is mostly recoverable. PR 2, if interrupted mid-way, leaves you with half-migrated fields — painful but not catastrophic, because the pattern of "atomic field facts live in a per-field file" survives any model change.

**Salvageable to tags** (i.e., pivoting to a tag-based registry instead of a capability-based one): closer to 90%. Tags and capabilities are semantically similar; the method-chain API is the same shape; only the consumer queries change.

**Net takeaway on regret risk.** PR 1 is your insurance policy. Ship it. See how it feels. 3-5 pilot fields is enough to stress-test the API against every dimension (parse, display, capability, detect, derive, enum). If PR 1 feels right, proceed to PR 2 with confidence. If PR 1 feels wrong, pivot now — you've burned a week, not two months, and 80%+ of the work ports to whichever model you pick next.

### 13.5. GitHub review strategy

Specific to the user's GitHub PR-diff preference:

**For PR 1 (foundation + pilots):**
- Standard file-by-file review. 10-15 files, each deserves careful read.
- Review ordering: read `define-field.ts` first, then one pilot field, then the registry query methods, then the remaining pilots, then the invariant tests.
- The pilot field `battleReport_battleDate.field.ts` from §10.1 is the keystone — if that file reads well, the approach works.

**For PR 2 (mass migration):**
- Skim strategy, not read strategy. GitHub's diff view is actually good for this:
  - Collapse files using the Files changed sidebar.
  - Group by directory: review all `fields/battle-report/*.field.ts` together, then `fields/damage/*.field.ts`, etc.
  - Look for shape outliers — any file that looks structurally different from its siblings deserves a careful read.
- Ask for a `npm run field:list` diff in the PR description: before (empty) → after (all 150 fields). This is the machine-verifiable completeness check.
- Commit organization inside PR 2 matters. Recommended commit structure:
  - Commit 1: `fields/battle-report/*` (cluster of ~15 fields)
  - Commit 2: `fields/damage/*` (cluster of ~20 fields)
  - Commit 3: `fields/defense/*`
  - Commit 4: `fields/enemies/*`
  - Commit 5: `fields/records/*`
  - Commit 6: `fields/utility/*`
  - Commit 7: `fields/internal/*` (underscore fields)
  - Commit 8: `registry consumer migrations` (every `registry.getField(...)` call that replaces a hardcoded table)
  - Commit 9: `delete dead code` (remove internal-field-config, run-type-*, coin-source tables)

The per-directory commits are reviewable in isolation via `git show <commit> --stat` — a reviewer who trusts the shape can check that commit 2 added 20 files matching a predictable pattern and move on. The consumer-migration commit (commit 8) is the one that deserves careful read, because it's where behavior actually changes. The dead-code-deletion commit (commit 9) is the cleanest red diff of the PR and is easy to scan for unintended deletions.

**The honesty at the bottom.** This approach is not your favorite. You're leaning graph. If you're going to do composable, the hybrid-two-PR strategy above is the lowest-regret path: PR 1 is cheap insurance, PR 2 is mechanical execution, and both are friendly to GitHub's review tooling. But if you're 30% sure about composable and 70% sure about graph, **don't ship PR 1 for composable yet.** Ship an equivalent PR 1 for graph first — that's a week's investment in your preferred direction. The composable approach will still be here if graph doesn't pan out, and PR 1 under graph is itself ~70% salvageable toward composable if you pivot back. The real advice isn't "ship this plan"; it's "ship the cheapest PR 1 in your favorite model, and let that decide for you."
