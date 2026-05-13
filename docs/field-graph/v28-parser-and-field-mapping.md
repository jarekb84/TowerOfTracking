# V28 Section-Aware Parser + Field Mapping

Exploratory document for the combined work of teaching the parser about V28's sectioned format and defining the canonical field mapping. These were originally scoped as separate stories but need to be designed and shipped together. This doc captures the problem, the open questions, and what needs to be explored before implementation begins.

## Why These Must Ship Together

A section-aware parser without a field mapping produces keys that nothing in the app recognizes — the UI, filters, analytics, and storage all expect specific canonical field names. A field mapping without a parser to use it is an unused lookup table. More importantly, the mapping decisions directly determine the parser's output keys, and those keys propagate into storage, display, and every feature downstream. You can't iterate on one without the other.

Beyond the technical coupling, these touch the most fragile part of the system — the boundary between the game's unstable export format and the app's internal model. Any inconsistency between parser output and mapping target results in silent data loss or "miscellaneous" bucket pollution. Getting this right on the first try matters.

## The Problem in Concrete Terms

### What the V28 format looks like

```
Battle Report          ← section header (label only, no value)
Battle Date    Apr 09, 2026 16:56
Tier           12
...
Damage                 ← section header
Damage Dealt   448.15N
Projectiles    83.99M  ← "Projectiles" means damage here
Death Wave     237.22M ← "Death Wave" means damage here
...
Coins                  ← section header
Death Wave     30.64T  ← "Death Wave" means coins here
...
Enemies Hit By         ← section header
Projectiles    37.28K  ← "Projectiles" means hit count here
Death Wave     329.57K ← "Death Wave" means hit count here
```

### Current parser behavior (data loss)

The vertical parser treats each line as a flat key-value pair and uses last-write-wins. Roughly 20 labels appear across multiple sections, so ~40+ field values per import silently overwrite each other. Confirmed affected labels:

```
Orbs, Flame Bot, Death Wave, Black Hole, Thorns, Smart Missiles,
Projectiles, Poison Swamp, Land Mines, Inner Land Mines, Golden Tower,
Death Ray, Chain Lightning, Chrono Field, Attack Chip, Total Enemies,
Spotlight, Golden Bot, Coins Earned, Cells Earned
```

Some of these (Coins Earned, Cells Earned, Total Enemies) duplicate with identical values and are safe. The rest have different values in each section representing different concepts (damage vs. hit count vs. coins earned vs. enemies destroyed).

### Scale of the mapping work

- ~90 existing canonical fields in `supportedFields.json`
- ~160 lines in a V28 export (including section headers)
- ~60 genuinely new fields introduced in V28 (Enemies Hit By breakdowns, Killed With Effect Active, Health Regenerated, Damage Blocked, expanded Currencies, etc.)
- ~15 fields from the old format that appear removed, renamed, or restructured
- ~20 labels that need section context to disambiguate

### Section headers observed in V28

```
Battle Report, Records, Damage, Damage Taken, Bonus Health Gained,
Health Regenerated, Damage Blocked, Utility, Counts, Enemies Hit By,
Killed With Effect Active, Total Enemies, Coins, Cash, Currencies,
Enemies Destroyed By
```

## What's In Scope

1. **Format detection** — reliably distinguish V28 sectioned format from legacy flat format at parse time
2. **Section-aware parsing** — track the current section while walking the export, use it to disambiguate duplicate labels
3. **Field mapping table** — complete lookup from `[section, label]` to canonical field name for every line in a V28 export
4. **Canonical name decisions** — for each V28 field, decide: maps to existing canonical name (e.g., `deathWaveDamage`), gets a new canonical name, or goes into an extras/unknown bucket
5. **`supportedFields.json` updates** — add all new canonical names, document any renames
6. **Backward compatibility** — legacy flat format continues to parse exactly as before; existing stored data is not affected
7. **Test coverage** — every sample run in `sampleData/v28/` parses without data loss and maps fields to expected canonical names

## Key Decisions That Need Exploration

### How do V28 fields map to existing canonical names?

The pre-V28 format had globally unique names like `Death Wave Damage`, `Coins from Death Wave`, `HP From Death Wave`. These map to camelCase canonical names (`deathWaveDamage`, `coinsFromDeathWave`, `hpFromDeathWave`) that already exist in `supportedFields.json`. The V28 format moved this information into sections, but the underlying concepts are the same. Most V28 fields should map to existing canonical names — need to go through systematically and decide each one.

Examples:
- `[Damage, Death Wave]` → `deathWaveDamage` (existing)
- `[Coins, Death Wave]` → `coinsFromDeathWave` (existing)
- `[Bonus Health Gained, From Death Wave]` → `hpFromDeathWave` (existing — but note the label is "From Death Wave" not "Death Wave")
- `[Enemies Hit By, Death Wave]` → `enemiesHitByDeathWave` (new?)
- `[Killed With Effect Active, Death Wave]` → `killedWithDeathWave` (new?)

### What naming convention for new canonical fields?

Existing convention is semantic camelCase (`deathWaveDamage`, `coinsFromDeathWave`). For the ~60 new fields, do we follow the same pattern, or switch to a namespaced pattern (`damage.deathWave`, `enemiesHitBy.deathWave`)? Namespacing would prepare cleanly for the internal schema work in item 6 of the epic, but mixing conventions is ugly. Consider whether to:
- Keep semantic names (consistent with existing) and just extend them
- Switch to namespaced names (preparing for adapter layer) and rename existing ones as part of item 6
- Start with semantic names now, rename during the adapter layer migration

### What about fields the old format had that V28 doesn't?

`Damage Taken While Berserked`, `Damage Gain From Berserk`, `Total Elites`, `Destroyed by Death Ray`, and others appear removed or restructured. Existing stored data has these fields with real values. Decisions needed:
- Preserve them in stored data (don't touch historical values)?
- Stop offering them in new-run analysis?
- Map any that have V28 equivalents (e.g., `Total Elites` might be derivable by summing individual elite types)?

### Format detection strategy

The V28 format has section header lines (label with no value). The legacy format is flat (every line has a value). Simplest detection: if the input has any line matching known section header names (`Battle Report`, `Damage`, `Coins`, etc.), treat as V28. Alternative: detect by presence of duplicate labels. Need to decide which is more robust and handles edge cases (partial exports, malformed input, user-edited data).

### Does this ship before or after the adapter layer (epic item 6)?

Original plan was to ship this as Phase 0 hotfix (item 1) before tackling the adapter architecture (item 6). But the field naming decisions here directly influence the adapter's internal schema. Options:
- **Ship this first (current plan)**: Gets the hotfix out quickly, but the canonical names chosen may need to be renamed later during the adapter work
- **Ship the adapter layer first**: Delays the hotfix, but establishes the schema before mass field mapping
- **Hybrid**: Ship a minimal hotfix that uses a simple mapping table now, then evolve into a proper adapter layer later — accept some rename churn

## Risks

- **Incorrect mapping silently loses data** — if `[Damage, Death Wave]` is mapped to the wrong canonical name, users think data is there but it's in the wrong place
- **Legacy stored data coexistence** — stored runs from pre-V28 use old field names. V28 runs use new canonical names. Filters, analytics, and aggregations need to handle both or be migrated
- **CSV export round-trip** — a V28 run imported, exported, and re-imported must produce identical data. Any asymmetry in the mapping table breaks this
- **Incremental game format changes** — the game devs have a history of tweaking field names between minor versions. A V28.1 that renames three fields could break the mapping again. Any solution should make adding mappings cheap
- **Test data drift** — the sample data in `sampleData/v28/` is a snapshot. If the game format changes mid-implementation, tests go stale

## Open Questions To Explore

1. How do we build confidence that every V28 field is correctly mapped? Manual audit? Snapshot tests per sample run? Field-by-field validation UI?
2. What's the plan if we discover mid-implementation that the field mapping table needs to be fundamentally restructured?
3. Should the V28 import preview show users the mapping decisions (e.g., "this field was mapped to this canonical name") so they can catch errors?
4. How do we handle the transition period where some users have legacy data, some have V28 data, and some have a mix?
5. Is there value in shipping a "dry run import" mode that shows what the parser produced without actually saving, so users can verify their data made it through?
6. What's the rollback plan if a mapping bug is discovered post-release? Can we re-import from original clipboard data, or is that lost?
7. Do we need a formal test fixture suite with expected canonical output per sample file?
8. How does this interact with the field mapping report UI that already exists? Does it need changes to surface section context?

## What To Do Before Implementing

- Walk through every V28 sample file line-by-line and produce a complete mapping table (`[section, label]` → canonical name + status: existing | new | unknown)
- Decide on the naming convention question (semantic vs. namespaced)
- Decide on the sequencing question (ship before or after adapter layer)
- Identify which of the 20 duplicate labels are safe (same value across sections) vs. which lose data
- Design the test strategy — likely snapshot tests per sample file
- Design the format detection heuristic and its failure modes
- Decide how to surface mapping results in the import preview UI
