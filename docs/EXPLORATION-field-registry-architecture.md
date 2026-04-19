# Exploration: Field Registry Architecture

**Status:** Discovery · **Author:** (auto-generated from conversation, Apr 2026)
**Related:** [PRD-v28-migration-safety.md](PRD-v28-migration-safety.md) · [EPIC-v28-support-and-data-resilience.md](EPIC-v28-support-and-data-resilience.md)

---

## 1. The problem (in plain terms)

The Tower of Tracking app has ~150 game-field concepts (Coins Earned, Damage Dealt, Golden Tower, etc.). Each field has a *story* that is told in ~7 different files:

1. **Raw V28 parse** — `src/features/analysis/shared/parsing/section-aware-parser.ts`
2. **In-memory field key** — `ParsedGameRun.fields` (implicit contract, no registry)
3. **V2→V3 migration map** — `src/shared/domain/migrations/v2-to-v3-field-map.ts`
4. **"Known" list** — `sampleData/supportedFields.json`
5. **Type/format detection** — `src/features/analysis/shared/parsing/field-utils.ts` (pattern matching)
6. **Breakdown source config** — `src/shared/domain/fields/breakdown-sources/coin-sources.ts`, `damage-sources.ts`, `index.ts`
7. **Section display config** — `src/features/game-runs/card-view/run-details/section-config.ts`

Plus scattered references: color pickers in chart configs, duplicate-detection composite keys, per-hour computed fallbacks, run-type defaults.

**The pain the user is hitting:**
- When V28 added new fields, old UIs silently failed to display them because nothing forced the files to agree.
- Field colors differ across views (run-details vs. chart vs. source-analysis) because each UI file has its own color literal.
- Tracing "why is this value missing" requires eyeballing 5+ files.
- AI and humans alike struggle to discover "where is this field used?" when making a change.
- "Display name" and "color" are often derivable from the field key, but they're hand-coded in multiple places — drift is inevitable.

**The meta-pain:** As the app grows, adding features requires knowing about existing patterns. Nothing in the code makes that knowledge discoverable; you either remember, grep, or break something.

## 2. What "good" looks like

Design constraints the user cares about:
- **Discoverability** — for any field, I can find every place it's used in ≤30 seconds.
- **Consistency enforcement** — adding a new field in one place can't silently bypass other places it belongs.
- **Relationship expression** — "this field is a *source* of that total," "these three fields *affect* that section," "this field belongs to *category X*."
- **Algorithmic derivation** — display names and colors shouldn't need hand-authoring when the field key is enough to derive them. Overrides for edge cases are fine.
- **Single-identity constraint** — one field = one color across every UI, derived or declared once.
- **Change safety** — renaming a field or adding one shouldn't require touching 8 files blindly. Tooling or structure should tell me what's affected.
- **No YAML source of truth** (user preference) — keep it TypeScript.

## 3. The approaches, at a glance

| # | Approach | File path (deep dive) | Effort | Payoff | Novelty |
|---|---|---|---|---|---|
| 1 | Invariant tests on the status quo | [field-registry-exploration/01-invariant-tests.md](field-registry-exploration/01-invariant-tests.md) | S | M | Low |
| 2 | Central field manifest | [field-registry-exploration/02-central-manifest.md](field-registry-exploration/02-central-manifest.md) | M | M | Low |
| 3 | Codegen from TS source-of-truth | [field-registry-exploration/03-codegen.md](field-registry-exploration/03-codegen.md) | L | M | Med |
| 4 | File-per-field (pure) | [field-registry-exploration/04-file-per-field.md](field-registry-exploration/04-file-per-field.md) | L | M | Low |
| 5 | File-per-field + behavior composition | [field-registry-exploration/05-file-per-field-composable.md](field-registry-exploration/05-file-per-field-composable.md) | L | H | Med |
| 6 | Algorithmic derivation + override file | [field-registry-exploration/06-algorithmic-derivation.md](field-registry-exploration/06-algorithmic-derivation.md) | S–M | M | Med |
| 7 | Relationship graph / node-based registry | [field-registry-exploration/07-relationship-graph.md](field-registry-exploration/07-relationship-graph.md) | M–L | H | High |
| 8 | Trait/tag-based capability system | [field-registry-exploration/08-trait-tag-system.md](field-registry-exploration/08-trait-tag-system.md) | M | H | High |

Effort = S/M/L (small/medium/large PR). Payoff = how much it solves the "silent drift + discoverability" pain.

## 4. Why each approach is on the list

### 1. Invariant tests on the status quo
**What**: Keep file-per-concern structure. Add tests that *enforce* consistency between files ("every `coins_*` in supportedFields must be in COIN_FIELDS or an explicit excludes list"). If drift happens, the test fails and names the offending file pair.
**Why listed**: Lowest-cost move that prevents the class of bug we just shipped. Doesn't reduce cognitive load, does reduce *surprise*.

### 2. Central field manifest
**What**: One TS file declaring every field as a `{ key, section, display, color, isCoinSource?, isDamageSource?, totalFor?, ... }` object. Feature files SELECT from it via predicates.
**Why listed**: The "obvious" centralization move. Single source of truth per field. Adding a field = one edit. File becomes a churn magnet but the churn is at least in one place.

### 3. Codegen from TS source-of-truth
**What**: A TS file (or set of files) under `scripts/` defines the canonical field registry, plus a generator script emits the feature-specific configs (`supportedFields.json`, `COIN_FIELDS`, `section-config.ts`) as generated artifacts. Generated files have a header comment saying "do not edit."
**Why listed**: Reconciles "SRP per feature file" with "single source of truth." Feature files look unchanged to consumers but can't drift because they're rebuilt from one source.

### 4. File-per-field (pure)
**What**: Each field gets its own file (`fields/coins-earned.field.ts`) declaring its metadata. An index loads them all. No behavior composition.
**Why listed**: Maximally granular. Each field's story in one place. Cross-cutting changes fan out badly.

### 5. File-per-field + behavior composition
**What**: The user's idea. Each field has a file, but features don't just *read* metadata — they *register* behavior against the field. E.g., the chart feature registers a color-picker function; the run-details feature registers a section-binding; the migration feature registers an ancestor key. The field file orchestrates these.
**Why listed**: Novel hybrid. Puts the field at the center and lets features attach capabilities. Discoverability per-field is high.

### 6. Algorithmic derivation + override file
**What**: Display name, color, section membership are *derived* from the field key via pure functions (e.g., `deriveDisplayName("coins_goldenTower") → "Golden Tower"`, `deriveColor("coins_goldenTower") → hashToHex(…)`). A small override file handles exceptions.
**Why listed**: Eliminates a huge chunk of hand-authored metadata. Every new V28/V29 field auto-renders. Overrides capture the genuine exceptions (brand colors, unusual labels).

### 7. Relationship graph / node-based registry
**What**: Fields are nodes. Relationships are edges with typed labels: `IS_SOURCE_OF` (coins_goldenTower → battleReport_coinsEarned), `BELONGS_TO_SECTION` (battleReport_tier → BattleReport), `DERIVED_FROM` (cellsPerHour → cellsEarned, realTime), `RENAMED_FROM` (coins_goldenTower → coinsFromGoldenTower). A query layer lets features ask "give me all sources of coinsEarned" or "what sections does this field appear in."
**Why listed**: Directly models relationships the user is trying to track. Natural fit for migration history, breakdown totals, cross-UI consistency.

### 8. Trait/tag-based capability system
**What**: Fields have *tags* (or *traits*): `#coin-source`, `#damage-source`, `#summary-field`, `#v27-removed`, `#time-type`. UIs query by tag. Adding a tag to a field automatically includes it in every UI that queries that tag.
**Why listed**: Powerful, flat, highly queryable. Lower ceremony than a full graph.

## 5. Combining approaches

These aren't exclusive. Realistic combinations:

- **1 + 6**: Keep file-per-concern; add invariant tests AND derive display/color from keys. Cheapest path that fixes the immediate pain. Tests enforce the derivation + override split.
- **2 + 8**: Central manifest where entries carry traits. UIs query by trait. Single file, high expressiveness.
- **5 + 7**: File-per-field where each file also declares its graph edges. Changes to a field's relationships happen in that field's file. Features query the graph.
- **6 + 8**: Pure-algorithmic defaults for derivable things; trait system for the rest.

## 6. Evaluation framework

Each deep-dive answers:

1. **What does adding a new V29 field look like?** (The expected case.)
2. **What does renaming a field look like?** (The migration-safety case.)
3. **What does a new UI view look like?** (The cross-cutting case.)
4. **What does "where is this field used?" look like?** (The discoverability case.)
5. **What silently breaks if someone forgets a step?** (The drift case.)
6. **What does the file tree look like?** (The cognitive-load case.)
7. **Concrete code samples** for the most representative 2–3 operations.
8. **Pros / cons / honest critique.**
9. **When this approach wins / when it loses.**

## 7. Cross-cutting concerns each deep-dive must answer

After a first read pass, the following concerns emerged as *universal* — they apply to every approach, and any proposal that ducks them is incomplete. Deep-dives 05, 07, and 08 have been extended with sections addressing each:

1. **Aggregation impact.** This is an analytics app. Heavy logic groups runs by date/hour/tier, sums/averages fields across runs, computes per-hour rates, slices by run-type. How does the approach affect aggregation code? Does it make "sum coins across all Tuesday runs" easier or harder?
2. **Cross-version lifecycle** (diagrams required). Five stages to walk through:
   - Tower Tracking v0.11 (V2 storage) receiving a Tower V27 game export.
   - Tower Tracking v0.11 (V2 storage) receiving a Tower V28 game export *before* the app is updated.
   - Tower Tracking v0.12 (V3 storage) reading persisted v0.11/V2 state for the first time.
   - Tower Tracking v0.12 (V3 storage) receiving a Tower V28 game export (expected happy path).
   - Tower Tracking v0.12 (V3 storage) receiving a Tower V29 game export (unknown newer format).
3. **Debuggability.** When there's a bug (e.g. "this field shows the wrong value"), how many files does a human or AI need to read to find the cause? What surfaces errors vs. what hides them?
4. **Adding a new capability** (not just a new field). Example: a new chart view that renders every numeric field, or a new aggregation strategy. How much fan-out does this cost across the 150 fields?
5. **Runtime type-mismatch.** Game devs already rename fields; they could also change the value *type* (e.g. a number becomes a `$4.28 mil` string). What happens when the runtime value doesn't match the declared metadata?
6. **Specific-field references.** Some code must name specific fields — "battle_date is required," localization-aware date parsing of battle date, duplicate-detection composite keys. How does the approach expose those without reintroducing hardcoded-key drift?
7. **Branch-fresh vs in-place.** Is this approach a rewrite disguised as a refactor? Should it be adopted on a fresh branch starting from v0.11, or can it be applied incrementally to the current v0.12 codebase? What's the size of the cutover PR sequence?
8. **Runtime discoverability (CLI/UI).** Can you build a dev tool — npm scripts, inspector page — that makes the registry self-describing? ("`npm run graph:describe coins_goldenTower`" style.)

## 8. Next step

Read each deep-dive. They're written to be navigable cold: if you read just one, you should understand the idea in full. After that, pick a combination and an adoption path.
