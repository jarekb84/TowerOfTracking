# V28 Migration Safety — Exploration

Companion to [EPIC-v28-support-and-data-resilience.md](EPIC-v28-support-and-data-resilience.md) and [v28-parser-and-field-mapping.md](v28-parser-and-field-mapping.md). Those cover the parser and field mapping. **This doc focuses on the migration UX, storage versioning, and the architectural-coupling question raised during voice-note exploration.**

**Primary goal: don't lose user data.** The app is browser-only. localStorage is the sole source of truth. A bug in migration = silent, permanent data loss for real users (including ~700 of my own runs). Adding V28 support is the trigger, not the goal.

---

## 1. The Core Problem

V28 groups fields under section headers (`Battle Report`, `Damage`, `Coins`, `Enemies Hit By`, …). The same label (e.g. `Death Wave`) appears in multiple sections with different meanings. To disambiguate, the parser must emit `section + label` keys (e.g. `damage_deathWave`, `coins_deathWave`).

**Key ripple**: the canonical names used in localStorage change. A user whose stored CSV has a column `Coins Earned` (meaning battle report → coins earned) now needs that same value living under `Battle Report Coins Earned` (or whatever naming we settle on). Without a migration, their 700 runs of history become orphaned columns and the in-app analytics think coins-earned history is empty.

Two incompatible storage formats => **breaking data change**. Not just for me — for every user who has ever opened the app and accumulated runs.

---

## 2. Current State (grounding the plan)

| Concern | Today |
|---|---|
| In-memory shape | `ParsedGameRun` with camelCase fields (e.g. `coinsEarned`, `battleDate`) |
| localStorage key | `tower-tracking-csv-data` (a CSV blob) |
| Storage format | Tab-delimited CSV, headers use title-case like `Coins Earned`, internal fields prefixed `_Date`, `_Notes`, etc. |
| Version tracking | Separate key `tower-tracking-data-version` — **not embedded in the CSV** |
| Existing migration | `migrateDataIfNeeded()` runs on load, auto-applies, v1→v2 was a clean rename (pre-v28) |
| Section headers | Parser currently *skips* them as label-only rows → last-write-wins, silent data loss on V28 |
| Unknown-field behavior | CSV import preserves them; single-run vertical parser drops them |

App version is 0.11.5. Target release: 0.12.x for this change.

---

## 3. Proposed Plan (consolidated from voice notes)

### 3.1 Parser: section-aware keys

Every field becomes `<section><Label>` in camelCase (e.g. `battleReportCoinsEarned`, `damageDeathWave`, `coinsDeathWave`). Section is detected by "line has no tab / no numeric value". Internal app fields keep the underscore prefix (`_date`, `_runType`, `_dissonanceWorkshop`, …). Special characters in labels (e.g. `Coins / Wave`) are stripped before camel-casing.

### 3.2 Embed the version inside the CSV itself

Today the version lives in a *separate* localStorage key. That means:
- Users who export the CSV and later re-import have no idea what version it was.
- The version key can desync from the data file (e.g. partial failures, corrupt writes, user clearing one key).

Proposal: the CSV's **first line is a metadata row**. Options:

```
# tower-tracking-data v3 hash=a1b2c3d4
<header row>
<data rows…>
```

Leading `#` means parsers that don't know about it ignore it. `v3` is the human-readable schema version. `hash` is a stable fingerprint of the header set (sorted headers joined, SHA-256 truncated) so we can detect *silent* format changes (game dev renames a field mid-version). Parser compares `hash` to the version's known hash; if it differs on a known version, log a warning and surface a "data shape changed" event.

**Devil's advocate on this:** a comment-prefixed metadata line is not standard CSV and users pasting into Excel/Sheets will see a weird first row. Counter: we're the producer and consumer — external tools aren't the target. Still, worth keeping the metadata line out of `includeAppFields=false` exports aimed at spreadsheets.

### 3.3 Migration flow: forced backup before any transformation

On app load, before *any* other data logic runs:

1. Read raw `tower-tracking-csv-data` without parsing.
2. Read embedded version (or fall back to `tower-tracking-data-version` key if missing).
3. If version < current, **halt the app**. Render a blocking full-screen modal (not a dismissable toast).
4. Modal body:
   - Plain-language explanation ("The Tower v28 changed how it exports run data. We need to reorganize your saved history to match. This is a one-time step.")
   - Link to Discord for help
   - **Button 1: Download backup** — downloads current raw CSV as-is, no transformation. Sets a session flag `backupDownloaded=true`.
   - **Button 2: Run migration** — disabled until `backupDownloaded=true`. On click: apply field-name mapping, write new CSV + new version metadata, then prompt user to refresh.
   - **Button 3: Cancel** — app stays in locked state. No data mutations occur.
5. After migration: show a confirmation screen with counts ("migrated 723 runs, preserved 12 custom fields"). Recommend refresh.

**No auto-migration.** The 1→2 migration was safe because it was a pure rename. This one reshapes meaning and needs the user's acknowledgment.

### 3.4 Explicit field mapping file

A dedicated module (e.g. `src/shared/domain/migrations/v2-to-v3-field-map.ts`) exporting a `Record<oldFieldName, newFieldName>`. Not derived, not heuristic — hand-written, fully enumerated, fully tested.

```ts
export const V2_TO_V3_FIELD_MAP: Record<string, string> = {
  coinsEarned: 'battleReportCoinsEarned',
  cellsEarned: 'battleReportCellsEarned',
  // … ~100 entries
};
```

Reasoning: a lookup-table mapping is the only form where the tests can exhaustively confirm "every v2 field has a known home in v3, nothing is accidentally dropped." A heuristic would let bugs through.

Pair it with an **inverse-check test**: every value in the map must exist in `supportedFields.json` post-v3, and every field in the pre-v3 schema must be either mapped or explicitly listed in an "intentionally dropped" allowlist.

### 3.5 Support step-wise migration for future jumps

Structure migrations as `v2→v3`, `v3→v4`, … composable. A user dormant for six months and opening the app on v4 should be migrated v2→v3→v4. This is what forced the existing `migrateDataIfNeeded` pattern; extend rather than replace.

### 3.6 Unknown-field handling

User-added custom columns (spreadsheet imports) currently land in the "miscellaneous" bucket. After v3, any imported field not recognized should be prefixed `userCustom_` (or similar) rather than being silently absorbed into the canonical namespace. This prevents a future game-export change from colliding with a user-custom field.

---

## 4. Devil's Advocate / Poke Holes

### Gaps I see in the plan

**4.1. The "embedded version" first line has a bootstrapping problem.** Users with v2 data have no metadata line. On load we must handle three cases: (a) data exists with embedded metadata, (b) data exists without metadata (→ v2 by definition), (c) no data at all (first-time user, skip modal entirely). Case (b) detection must be bulletproof — if the first header happens to start with `#` for some reason, we'd misclassify. Recommendation: use a more distinctive sentinel like `##tower-tracking-meta##` that couldn't plausibly be a field name, and check for exact match.

**4.2. "Forced download before migration" is easy to bypass.** User clicks Download, the file lands in a default downloads folder they never look at, they click Run Migration, later hit a bug, ask for help — and we claim "well you have a backup." They don't, in any meaningful sense. Strengthen by:
- Also writing the pre-migration CSV to a *second* localStorage key (`tower-tracking-csv-data-backup-pre-v3`). Costs ~340KB once. Lets support recover data even if the user's filesystem backup is gone.
- Never delete that backup key from code. Let it live. Storage-limit users can clear it manually with a button in settings.

**4.3. localStorage ~5MB quota.** With ~700 runs at ~340KB, you're fine. But adding a backup copy plus v28's expanded schema (more columns = wider rows) could push power users toward the limit. Back-of-envelope: v28 adds maybe 60 new columns; if each row grows ~30% and there are two copies, a user with 2000 runs might hit the cap. Mitigation: (a) compress the backup (gzip → base64, ~3x smaller), or (b) offer an "I've verified my data" button in settings that deletes the backup. Do *not* auto-delete the backup — require explicit user action.

**4.4. What if migration partially fails?** E.g. 700 rows, parser throws on row 342 because of an unexpected value. Current `migrateDataIfNeeded` catches errors and *doesn't update version*, meaning it retries on next load. That's good for transient issues, bad if the data is genuinely malformed — user gets stuck in an infinite "needs migration" modal. Add: if migration fails twice in a row (session-counted), surface a "Migration is failing on your data — please share your backup with Discord support" state with a link to open an issue + attach the backup file.

**4.5. The session flag `backupDownloaded=true` can be gamed / cleared.** Someone refreshes, the flag's gone, they'd have to download again. That's fine for safety but annoying UX. Alternative: persist the flag to localStorage with a timestamp, so "I already backed this up 5 minutes ago" still counts. Tradeoff: staler the flag, less meaningful.

**4.6. The modal ordering of "Cancel" button.** If Cancel is just "close the modal," users might think they can keep using the app. Rename to "I'll Do This Later — Exit App" and actually redirect them out / render a placeholder. The modal cannot be dismissable in any state that leaves the app usable.

**4.7. No way to downgrade.** If v0.12 ships buggy and I want to roll users back to v0.11, I can't — they'd have migrated data. Two options:
- Keep backward-compatible *read* logic in v0.12: it can read v2 OR v3 CSVs. If a v2-shaped CSV is ever seen, prompt the user to re-run migration. This is cheap.
- Version the deployed app URL (`/v0.11/`, `/v0.12/`) so I can tell users to temporarily roll back. Heavy lift, probably not worth it.

Go with the first.

**4.8. Bulk import needs the same version awareness.** If a user imports a CSV they exported last month, it might be v2-format. The CSV import path (`parseGenericCsv` → `migrateCsvOnImport`) already has a lightweight header-detection migration. It must learn about v3 and run the same field-map when it sees v2 headers. Otherwise bulk import silently produces a run with orphaned columns.

**4.9. "Game dev changes one field name mid-version" is still not solved.** The embedded hash helps *detect* it; it doesn't *handle* it. Today the similarity-based field matching exists on bulk import. The vertical parser has no such forgiveness. This is really solved only by the adapter layer from EPIC item 6 — acknowledge it and defer.

**4.10. Testing burden.** The test I most want:
- A real user's v2 CSV export (mine, scrubbed), committed to `sampleData/migration-fixtures/`.
- A snapshot of the expected v3 output after migration.
- A regression test that runs migration and diffs the result against snapshot.
- Plus a fuzzer that generates v2 CSVs with random field subsets, runs migration, and asserts no data loss (all non-dropped values round-trip to a new key with the same value).

Without this, the claim "migration is safe" is unprovable.

### Steel-man of "don't do the architectural decoupling right now"

Moving to a namespaced internal schema (EPIC item 6) + JSON storage (item 7) + IndexedDB (item 8) is an *enormous* change. Rolling all three into the same release as v28 parser + forced-migration UX is a recipe for a bug slipping through on a migration path I can't easily recover from. Every additional moving piece multiplies the failure surface. **The right call is to ship v28 parser + field map + migration UX as one unit, get real users through it safely, then tackle the architectural refactor as a separate release where the *only* change is storage format.** The voice notes already landed here; this section is just reinforcing it.

### Steel-man of "do the architectural decoupling now"

If I'm forcing every user through a migration modal and telling them to download a backup, that's the most expensive UX event of the product's lifetime. Doing it *twice* (once for v28, once for JSON/IndexedDB) burns user trust. There's an argument for bundling. But the counter is: if the first migration goes wrong, there is no second migration because there's no user left to migrate. Ship the smallest thing that solves v28, prove it works, then do the rest.

Verdict: **defer**. Document it as the next epic.

### Things I genuinely haven't thought through enough

- **Rank field semantics for dissonance runs.** If dissonance is a new run type and tournament-only fields (like rank) don't apply, does the migration need to touch existing tournament runs' ranks? Probably no, but confirm.
- **Users with *no* data at all.** Confirmed the modal doesn't fire for them, but worth a test case.
- **Users on mobile.** The "download backup" button on mobile browsers behaves inconsistently. Safari iOS especially is hostile to downloads. Fallback: render the backup CSV in a textarea and say "copy and paste this into a file."
- **The `crypto.randomUUID()` call in `parseGameRun` and `parseRow`.** During migration, do we preserve existing `id`s or regenerate? Must preserve. Otherwise any feature that caches by run ID (future bookmarks, annotations, etc.) breaks across the migration.
- **Duplicate detection on re-import.** If a user re-imports their pre-migration backup after migration, duplicate-run detection (if any) must still work. The fields used for dedup (timestamp + tier + wave?) are stable across migration — verify.

---

## 5. Open Questions for Me

1. Is the metadata line `##tower-tracking-meta##` approach acceptable, or too hacky? Alternative: a separate metadata file (won't work — single CSV export is a single file).
2. Do I want the pre-migration localStorage backup to persist indefinitely, or auto-expire after 90 days once the user has imported at least one v3-format run?
3. Should the migration modal show the migration preview ("here's what will change") before the user commits, or is that overkill for users who won't understand it?
4. If a user has *never* exported their data and their localStorage is ~2MB, is it ethical to just … run the migration without making them click Download? The forced backup is paternalistic, but some friction is the point. Keep paternalistic path.
5. Does Posthog/analytics track enough today that I'd notice if 10% of users hit the migration modal and bounced without completing it? If not, add explicit events: `migration.modal_shown`, `migration.backup_downloaded`, `migration.completed`, `migration.failed`.

---

## 6. Proposed Scope for v0.12

One PR (big but coherent):

1. Section-aware vertical parser (the Phase 0 hotfix from the EPIC).
2. V28 field mapping data + tests.
3. `supportedFields.json` updated.
4. V2→V3 field migration map + tests.
5. Storage metadata line + version embedding.
6. Pre-migration localStorage backup key.
7. Blocking migration modal with forced-backup UX.
8. Bulk-import path updated to recognize v2 headers and apply the same migration.
9. Discord post template for the release announcement.

Explicitly NOT in scope: internal schema adapter, JSON storage, IndexedDB, full decoupling from game export format. Those are the next epic.

---

## 7. Summary of What I Believe Is the Right Call

- V28 triggers a breaking data format change. That's unavoidable.
- The *primary* engineering problem is not the parser — it's not losing user history across the transition.
- The safest path is: section-aware parser + explicit field mapping + forced-backup migration modal + dual backup (download + localStorage-key) + embedded CSV versioning + exhaustive tests against real fixture data.
- Architectural decoupling from the game's export format is worth doing, but not in the same release. One migration at a time.
- The biggest risk I'm carrying is the test coverage on the migration itself. Before writing a single line of migration code, write fixtures and snapshot tests. Then write the migration to satisfy them.

---

## 8. Decisions from Voice-Note Review

These lock in choices after walking through Section 4's devil's-advocate list. Listed per item so the reasoning stays paired with each concern.

- **4.1 (metadata-line bootstrapping):** see Section 9 — exploring three embedding strategies because the comment-line approach is fragile when users open the CSV in a spreadsheet and save it back.
- **4.2 (dual backup in localStorage + download):** **Adopt.** Write the pre-migration CSV to `tower-tracking-csv-data-backup-pre-v3` *and* force a download. Rationale: users are non-technical; downloaded files get lost; the localStorage copy lets me hand-fix bad migrations by shipping a recovery script later. This is the single most important safety net.
- **4.3 (storage runway shrinks with dual copy):** **Accept.** V28's ~60 extra fields plus a backup copy could push 340KB → ~1MB. That shortens the window before IndexedDB becomes mandatory, but doesn't block this release. Optional gzip-encoding the backup is a future stopgap.
- **4.4 (partial failure mid-migration):** **Adopt.** Migration is treated as a transaction: either succeed fully (new v3 key written, old v2 key preserved, version bumped) or fail entirely with no version bump. On failure, show a screen telling the user which row threw (`"Row 342: …"`), ask them to share the downloaded backup in Discord. **Action:** create a Discord bug-report channel (does not exist yet).
- **4.5 (`backupDownloaded` flag):** **Clarified to localStorage-persisted.** A session-only flag defeats the purpose — page refresh would re-prompt download. Key: `tower-tracking-v3-migration-backup-confirmed`, value = ISO timestamp.
- **4.6 (modal ergonomics):** **No Cancel button.** The app is incompatible with v2-shaped localStorage once v0.12 is deployed; letting the user continue is data-loss-prone. Full-screen takeover with Download → Migrate as the only forward path.
- **4.7 (backward-compatible read in v0.12):** **Reject.** Maintaining dual-read logic indefinitely is too much complexity for a solo-maintained app with 10–20 DAUs. App code assumes v3-only. Migration is the sole bridge.
- **4.8 (bulk import/export version-awareness):** **Adopt.** Bulk import must detect v2 headers and either (a) refuse and surface a clear "this is an old-format file, paste it into localStorage first and re-run migration" message, or (b) apply the v2→v3 adapter inline. Going with (b): simpler for the user. Bulk export always writes v3-format.
- **4.9 (unknown-field handling):** **Adopt with name change — use `unrecognizedField_` prefix** (not `userCustom_`). "Unrecognized" is neutral; "user custom" implies the user created it, which may be wrong if it's an unmapped game field. Future releases can rename specific `unrecognizedField_xyz` to their canonical name via a follow-up migration once identified.
- **4.10 (fixture-based snapshot tests):** **Adopt as gating requirement.** Commit a real v2 CSV export (scrubbed of PII if any) as fixture. Expected v3 output checked in as snapshot. Migration code is written to satisfy the snapshot — not the other way around.

### Additional decisions on open questions (Section 5)

- **Q2 (backup expiration):** Auto-clear `tower-tracking-csv-data-backup-pre-v3` after either 10 successful app visits or 90 days, whichever comes first. Add a tracker ticket — not blocking initial release.
- **Q3 (migration preview in modal):** **No.** Users won't parse a field-rename list. Plain-language message only.
- **Q4 (force backup for users with small datasets):** **Keep paternalistic path.** The friction is the point.
- **Q5 (PostHog telemetry on funnel):** Nice-to-have. With 10–20 DAUs, I'll notice issues from Discord reports faster than from dashboards. Defer.

### New ideas surfaced during the review

- **Proactive backup nag.** Once the migration ships, if a user has added ≥10 runs since their last download-backup (or ever, if never), show a dismissable "Back up your data" banner on app load. Reduces the cost of any future migration and protects against accidental localStorage wipes (browser settings, storage eviction).
- **Discord bug-report channel** must exist before v0.12 ships; linked from the migration failure screen.

---

## 9. Version-Embedding Strategies (Revisiting 4.1)

Three ways to signal "this CSV is format v3" inside a single-file export. The goal is that a user who exports a CSV, opens it in Excel, saves it, and re-imports it later still has a recoverable version signal.

### Option A — Metadata comment line (first proposal)

```
##tower-tracking-meta## version=3 hash=a1b2c3d4
<header row>
<data rows…>
```

- **Pros:** Version lives in a single identifiable row; easy to detect; doesn't contaminate column names.
- **Cons:** Excel/Sheets typically preserve the row as a single-cell data row. User might delete it when "cleaning up." If deleted, no version signal remains.
- **Failure mode:** silent — import has to fall back to heuristics.

### Option B — Overload the first internal field's header

Rename the first app-owned column header from `_Date` to something like `_Date_TOT_v3`. The column still holds the date value; the header is dual-purpose.

- **Pros:** Single column. Surviving the spreadsheet round-trip is very likely — users almost never rename column headers. Tight coupling of version signal to a column users already see.
- **Cons:** Parser has to special-case this header to strip the `_TOT_v3` suffix before reading the date. Dual-purpose column is a known smell. If the user deletes the column entirely (they'd have to try), the version signal is gone.
- **Failure mode:** column deletion is rare; this is the *most robust* against spreadsheet workflows.

### Option C — Namespace every game-field column header with the version prefix

```
_Date  _Time  ...  v3_battleReportCoinsEarned  v3_damageDeathWave  ...
```

- **Pros:** Version is embedded in every column — maximally redundant. Makes collision between user-custom fields and future game fields physically impossible (user-custom goes under `unrecognizedField_`, game fields under `v3_`). Bulk-import code can tell "this file is v3" just by seeing a single column starting with `v3_`.
- **Cons:** Long column headers. Every future game-format bump (v4, v5) changes *every* column header, making manual diff/merge of exports across versions awkward. Bloats file size slightly (60 columns × 3 extra chars × ~700 rows ≈ 126KB of overhead — not trivial in a 340KB file).
- **Failure mode:** almost none; version signal is unfragileable.

### Leaning

**Option C + Option B** together: game-field columns get `v3_` prefix (prevents collisions and provides redundant version signal) *and* the metadata sentinel row lives at the top for explicit version/hash. Option B feels gimmicky and I'd rather keep the `_Date` column honest. Accept the storage cost from Option C — it's the last format change I want to design around, and decoupling it from the header format is worth some bytes.

Still tentative. Deciding before implementation starts.

---

## 10. Build-Time Safety: Pre-Commit Integrity Check

A new idea during the review: every time someone (me, Claude, a future contributor) adds or renames a field in code, validate the full round-trip statically.

A script run from a pre-commit hook that asserts:

1. Every field name referenced in parser/analytics/UI code exists in `sampleData/supportedFields.json`.
2. Every field in `supportedFields.json` is either produced by the current v3 parser *or* listed as an `unrecognizedField_*` allowlisted user field.
3. Every field in the latest migration map's *source* side exists in the previous format's schema snapshot (committed alongside the mapping).
4. Every field in the latest migration map's *target* side exists in `supportedFields.json`.
5. No field in `supportedFields.json` is orphaned (not referenced anywhere).

**Why a hook and not just a test:** makes the failure immediate and impossible to bypass accidentally. Tests already enforce (4) indirectly through the inverse-check test from Section 3.4; elevating it to a hook gives earlier feedback and catches drift when someone forgets to add an entry.

Script lives at `scripts/validate-field-mappings.mjs`. Runs under Husky / lint-staged alongside existing checks. Output is terse: exit 1 with a list of specific offenders.

---

## 11. Updated Summary (supersedes Section 7)

The plan as of this exploration's second pass:

1. **Section-aware parser** emitting `section + label` camelCase keys (e.g. `damageDeathWave`).
2. **Explicit, hand-written `V2_TO_V3_FIELD_MAP`** with exhaustive inverse-check tests and snapshot-based migration tests against real fixtures.
3. **Embedded version signal** using Option C (namespaced columns with `v3_` prefix) plus a metadata sentinel row for belt-and-suspenders redundancy.
4. **Blocking full-screen migration modal** — no Cancel — forcing Download then Migrate. Both `backupDownloaded` flag and pre-migration raw CSV persisted to localStorage. Migration is transactional.
5. **Unknown fields get `unrecognizedField_` prefix**, not silently bucketed as user-custom.
6. **Bulk import detects v2 headers** and applies the same v2→v3 adapter inline. Bulk export writes v3 only.
7. **Pre-commit hook** validating field-mapping integrity end-to-end.
8. **Discord bug-report channel** and release communication ready before launch.
9. **Proactive backup-reminder banner** shipped alongside the migration so future format bumps are cheaper.
10. **Architectural decoupling from game export** (adapter layer + JSON storage + IndexedDB) deferred to a follow-up epic.

---

## 12. Deterministic Data Prep

Two scripts check in the raw field inventories that the migration map will be built from. Both are pure parsers — no AI, no fuzzy matching, no tokenization.

- [scripts/migration-data-prep/extract-v28-fields.mjs](../scripts/migration-data-prep/extract-v28-fields.mjs) — walks every `.txt` under `sampleData/v28/`, emits `out/v28-field-matrix.csv`. Each row is a `(section, label)` pair with columns per source file marking presence. Also produces `sectionCamel`, `labelCamel`, and a `proposedV3FieldName` (concatenation) as a *starting point*, not a final answer.
- [scripts/migration-data-prep/extract-v2-fields.mjs](../scripts/migration-data-prep/extract-v2-fields.mjs) — reads [sampleData/app/v2_data_format/v2_csv_headers.md](../sampleData/app/v2_data_format/v2_csv_headers.md), emits `out/v2-field-list.csv`. One row per header, with `kind` (internal vs game/custom), camelCase form, and an empty `mapsToV3Field` column for me to fill in.

Run with `node scripts/migration-data-prep/extract-v28-fields.mjs` and `node scripts/migration-data-prep/extract-v2-fields.mjs`.

### What the outputs reveal

- **V28 schema is invariant across run types.** All 142 unique `(section, label)` pairs appear in all 6 sample files (farming, tournament, 4 dissonance variants). Only values differ. That means the parser + mapping doesn't need per-run-type branches — one canonical V28 field set covers everything.
- **V2 has 159 headers** (5 internal, 154 game/custom) vs V28's 142 section-qualified fields. A handful of V2 fields are duplicates that collapsed via the last-write-wins bug (e.g. `Coins From Black Hole` and `Coins from Blackhole`). The mapping exercise should surface these and consolidate.
- **`proposedV3FieldName` is deliberately ugly** (e.g. `cashCashEarned`, `coinsCoinsEarned`) for pairs where section and label root are the same word. The migration map is where those are rewritten to cleaner canonical names (e.g. `cashEarned` stays `cashEarned`, but `damageDeathWave` and `coinsDeathWave` stay distinct). I'll hand-edit this column.

### Next step

Using these two CSVs side-by-side, hand-author `src/shared/domain/migrations/v2-to-v3-field-map.ts`. Every entry in `v2-field-list.csv` must either (a) have its `mapsToV3Field` column filled with a V28-derived canonical name, or (b) be added to an `INTENTIONALLY_DROPPED` allowlist with a reason. Every entry in `v28-field-matrix.csv` must appear somewhere in the resulting canonical name set. The pre-commit hook from Section 10 enforces both directions.
