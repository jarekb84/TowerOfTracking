# PRD: V28 Migration Safety

**Status:** Draft · **Target Release:** v0.12.0 · **Author:** Jarek
**Companion docs:** [EXPLORATION-v28-migration-safety.md](EXPLORATION-v28-migration-safety.md) · [EPIC-v28-support-and-data-resilience.md](EPIC-v28-support-and-data-resilience.md) · [v28-parser-and-field-mapping.md](v28-parser-and-field-mapping.md)

---

## 1. Problem

The Tower v28 introduces a breaking export format: fields are grouped under section headers (`Battle Report`, `Damage`, `Coins`, `Enemies Hit By`, …) and the same label can appear in 3–5 different sections meaning different things. The current parser treats lines as flat key/value pairs, so ~20 labels per run silently collide (last-write-wins).

Resolving this requires renaming canonical field keys throughout stored data (e.g. `coinsEarned` → `battleReportCoinsEarned`). That makes v0.12 **incompatible with v0.11-shaped localStorage**. Every existing user — most of whom are non-technical — has hundreds of runs of history in their browser that must survive the transition.

The app is browser-only. There is no server, no account, no remote backup. A bad migration = permanent data loss for a real person.

## 2. Goals

**Primary:** Zero data loss across the v0.11 → v0.12 transition.
**Secondary:** Ship V28 export support with correct disambiguation of sectioned fields.
**Tertiary:** Reduce the cost of future format changes (better version signaling, better unknown-field handling, proactive backups).

## 3. Non-Goals (Out of Scope)

- Detailed section-aware parser design → see [v28-parser-and-field-mapping.md](v28-parser-and-field-mapping.md).
- Internal-schema adapter layer, JSON storage, IndexedDB migration → deferred to a follow-up epic.
- Backward-compatible dual-read in app code. App assumes v3 only; migration is the sole bridge.
- Automated detection of dissonance run type / workshop subcategory → separate stories in the epic.

**In scope (clarifying — not out of scope):**

- Authoring the full V2→V3 field mapping. Process is deterministic: a scaffolding script reads [v2-field-list.csv](../scripts/migration-data-prep/out/v2-field-list.csv) + [v28-field-matrix.csv](../scripts/migration-data-prep/out/v28-field-matrix.csv) and emits a TypeScript `V2_TO_V3_FIELD_MAP` skeleton with best-guess matches pre-filled and unresolved entries flagged. Hand-edit the skeleton to finalize. See F2 + F2a.

## 4. Users & Context

| Group | Count (est.) | State at v0.12 launch |
|---|---|---|
| Existing users | ~10–20 DAU, unknown MAU | Have v2-shaped localStorage with up to ~1000 runs each |
| New users | — | No data; migration flow does not fire |
| Power users who re-import backups | small | May paste/upload v2-format CSVs after the migration lands |

Users are assumed **non-technical**. They play a game. They don't read changelogs. They discover an issue when something breaks.

## 5. User Experience

### 5.1 First load after v0.12 deploys (existing user)

1. App loads. **Before any other code runs** (see F8), the migration gate checks storage version and detects v2 data.
2. **Gate's first action — not the user's —** is to copy the raw v2 CSV into `tower-tracking-csv-data-backup-pre-v3`. This happens automatically, synchronously, and before *any* UI renders. If the page is refreshed at any point from here on, the pre-migration copy is already safe.
3. Renders a **full-screen takeover** — not a dismissable modal. The app below is inert. Router, data context, and feature code are not initialized.
4. Screen content (plain language, no jargon):
   - Title: *"Your run history needs a quick update"*
   - Body: explains that The Tower v28 changed how run data is exported, and the app needs to reorganize your saved history to match. One-time step.
   - Link: *"Questions? Ask in #bug-reports on Discord"*
   - **Step 1 button: "Download Backup"** — triggers download of raw pre-migration CSV to the user's disk. On success, sets `tower-tracking-v3-migration-backup-confirmed` in localStorage (persists across refresh) and unlocks Step 2.
   - **Step 2 button: "Run Migration"** — disabled until Step 1's localStorage flag is set. On click, runs the migration transactionally.
   - No Cancel button. No Skip. No "remind me later."
5. On migration success: confirmation screen showing run count migrated (e.g. *"723 runs migrated successfully"*), prompt to refresh.
6. On migration failure: error screen citing the failing row ("Row 342 couldn't be migrated"), instructions to share the downloaded backup in Discord `#bug-reports`, and a *"Try Again"* button. Data is left in v2 state; migration has not mutated anything.

**Refresh resilience.** Both the localStorage pre-migration backup (step 2) *and* the Step 1 download flag are persisted to localStorage. A user who refreshes mid-flow is not sent back to the start — they pick up where they left off, and the original v2 data is already copy-protected regardless of what they do next.

### 5.2 First load (new user with no data)

Migration gate detects no stored runs. Skips the takeover entirely. App loads normally.

### 5.3 Bulk import of a v2-format CSV (any time after v0.12)

1. User pastes/uploads CSV in import page.
2. Importer detects v2-shaped headers (no `v3_` prefix / no sentinel row / legacy `Coins Earned`-style column).
3. Imports are silently run through the same v2→v3 field adapter before being merged. Success message is unchanged.
4. If any column is genuinely unrecognized (not in v2 map, not in v28 schema), it imports under `unrecognizedField_<camelCase>` and the import summary lists them.

### 5.4 Bulk export (any time after v0.12)

Always writes v3 format. Never writes v2.

### 5.5 Proactive backup reminder (ongoing)

After the migration ships, a dismissable banner appears on app load when **any** of the following is true:
- user has added **≥ 30 new runs** since their last download-backup, **or**
- **≥ 30 days** have passed since their last download-backup, **or**
- user has **never** downloaded a backup.

Banner: *"Back up your data"* with one-click export. Tracked in localStorage under two keys:
- `tower-tracking-last-backup-at` — ISO timestamp of the last successful download-backup (set on any export, including the migration flow's Step 1).
- `tower-tracking-runs-since-last-backup` — counter incremented on each new run added; reset to zero on download-backup.

Does not block the app. Dismissal is session-scoped (returns on next app load if the criteria are still met).

**Why 30 runs / 30 days:** active users add 2–3 runs/day. Any lower threshold nags them constantly; any higher leaves a wider blast radius if localStorage gets wiped.

## 6. Functional Scope (in this release)

| # | Item | Notes |
|---|---|---|
| F1 | Section-aware vertical parser | Emits `<sectionCamel>_<labelCamel>` keys using a **single underscore delimiter** between section and label (e.g. `battleReport_coinsEarned`, `damage_deathWave`, `coins_deathWave`). Makes it trivial to split section from label with a `/^([a-z]\w*)_(\w+)$/` regex in future code. Internal fields keep their leading-underscore convention (`_date`, `_runType`); the in-middle underscore is positionally unambiguous. |
| F2 | `V2_TO_V3_FIELD_MAP` module | Authored using a deterministic scaffolding pass (F2a) + hand review |
| F2a | Scaffolding script: `scripts/migration-data-prep/scaffold-v2-to-v3-map.mjs` | Reads the two extracted CSVs, emits `src/shared/domain/migrations/v2-to-v3-field-map.generated.ts` with: auto-matched entries (exact camelCase match between v2 field and a v28 proposal), flagged unresolved entries as `TODO_V2('<v2Field>')`, and ambiguous entries (multiple candidate v28 targets) with options listed as comments. Deterministic — same inputs, same output. Non-destructive: operates alongside the hand-edited `v2-to-v3-field-map.ts` |
| F3 | `supportedFields.json` updated to v3 canonical names | Used by import field-matching |
| F4 | Storage version signal inside CSV | **Option C (`v3_` prefix on every game field)** — see §9 |
| F5 | Pre-migration backup preserved in localStorage | Key: `tower-tracking-csv-data-backup-pre-v3`. **Written by the migration gate before UI renders**, not by user action. Never auto-deleted by v0.12 code |
| F6 | Forced-download backup step | File downloaded via browser; fallback to copy-paste textarea for hostile mobile browsers |
| F7 | `backupDownloaded` flag in localStorage | Key: `tower-tracking-v3-migration-backup-confirmed` with ISO timestamp. Persists across refresh |
| F8 | Blocking migration gate — executes before ALL other code | Gate runs synchronously at app bootstrap, before router, before data context, before any feature code. If v2 data is detected, F5 fires immediately and the takeover UI is the only render path. No feature code, no background data loading, no analytics, no banners, no route resolution runs in the v2-detected state. Explicitly tested: assert that no non-migration side effects occur when the gate triggers |
| F9 | Transactional migration execution | All-or-nothing; failure preserves v2 data untouched |
| F10 | Bulk import v2 detection + adapter | Same field map as F2 applied inline |
| F11 | Unknown-field handling | `unrecognizedField_` prefix on import |
| F12 | Pre-commit integrity hook | Validates supportedFields ↔ migration map ↔ parser output consistency |
| F13 | Proactive backup-reminder banner | 30 runs since last backup, OR 30 days, OR never. Tracks `tower-tracking-last-backup-at` + `tower-tracking-runs-since-last-backup` |
| F14 | Discord `#bug-reports` channel + release announcement | Must exist before deploy |

## 7. Acceptance Criteria

### Data safety (gating)

- [ ] Fixture test: real scrubbed v2 CSV (mine, 700+ rows) committed under `sampleData/migration-fixtures/`. Snapshot of expected v3 output committed. Migration code runs to satisfy the snapshot.
- [ ] Fuzz test: generate v2 CSVs with random subsets of v2 fields; assert every non-dropped value round-trips to a v3 key with the same value.
- [ ] Inverse-check test: every value in `V2_TO_V3_FIELD_MAP.target` exists in `supportedFields.json`. Every v2 header in the committed fixture is either mapped or in an `INTENTIONALLY_DROPPED` allowlist.
- [ ] Transactionality test: induce a mid-migration throw on row N; confirm v2 localStorage key is untouched and version is not bumped.
- [ ] Backup preservation test: after a successful migration, `tower-tracking-csv-data-backup-pre-v3` contains exact pre-migration CSV bytes.
- [ ] Run IDs are preserved across migration (not regenerated).

### UX

- [ ] Migration takeover cannot be dismissed. Underlying app routes are unreachable while v2 data is present.
- [ ] "Run Migration" button is disabled until "Download Backup" has completed at least once. State persists across page refresh (`tower-tracking-v3-migration-backup-confirmed` in localStorage).
- [ ] On failure, error screen names the failing row and links to Discord `#bug-reports`. "Try Again" re-runs migration without re-requiring a new download.
- [ ] New users (no stored runs) never see the takeover.

### Gate isolation (F8)

- [ ] Test: with v2 data in localStorage, mount the app — assert router did not initialize, data context did not load runs, analytics code did not fire, proactive banner did not render. Only the migration takeover renders.
- [ ] Test: `tower-tracking-csv-data-backup-pre-v3` contains the exact raw v2 CSV bytes *before* the takeover UI renders (i.e. even if the user closes the tab immediately after seeing the takeover, the backup is already written).

### Compatibility

- [ ] Bulk import accepts v2-format CSVs and transparently adapts them. Imported rows look identical to runs imported as v28 native.
- [ ] Bulk export writes v3 format only.
- [ ] Unknown import fields land under `unrecognizedField_<name>` and are listed in the import summary.

### Build safety

- [ ] Pre-commit hook fails when any field in `supportedFields.json` is orphaned, or when a code-referenced field is missing from both the migration map and `supportedFields.json`.

### Telemetry / comms

- [ ] Discord `#bug-reports` channel exists.
- [ ] Release announcement drafted and posted before or at deploy.
- [ ] In-app changelog entry explains the migration in plain language.

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Migration bug silently corrupts field values | Low | Catastrophic | Fixture snapshot + fuzz tests; dual backup (download + localStorage) lets me hand-fix later |
| User clicks through takeover without actually retrieving the downloaded file | High | Medium | localStorage backup mirrors the download; recovery is possible even if the user loses the file |
| localStorage quota exhausted by dual copy + wider v28 schema | Medium | User can't save new runs | Document risk; add settings button to clear pre-migration backup; accelerate IndexedDB epic |
| Mobile browsers (Safari iOS) hostile to programmatic downloads | Medium | User can't complete Step 1 | Fallback: render CSV in a textarea with copy instructions |
| Infinite migration-failure loop (malformed data) | Low | User locked out permanently | After 2 consecutive failures in one session, surface "contact support" escape path with backup file attached |
| Game devs rename a v28 field mid-version (happened in v27) | Medium | Parser output drifts from mapping | Version hash in storage signals it; out-of-scope full fix deferred to adapter-layer epic |
| User re-imports their v2 backup after migration | Medium | Duplicate runs or data confusion | Bulk import adapter handles it transparently; consider dedup-by-timestamp later |

## 9. Resolved & Deferred Decisions

### 9.1 How to embed the storage version in the CSV — **RESOLVED: Option C**

**Decision:** namespace every game-field column header with the `v3_` prefix. Internal fields (`_date`, `_time`, `_notes`, `_runType`, `_rank`) keep their underscore-prefix convention unchanged.

Example header row:
```
_Date  _Time  _Notes  _Run Type  _Rank  v3_battleReport_coinsEarned  v3_damage_deathWave  v3_coins_deathWave  ...  unrecognizedField_somethingCustom
```

**Detection logic:** any column header starting with `v3_` → CSV is v3. No `v3_` / no recognizable modern headers → treat as v2 and route through the migration adapter. No sentinel row (kept the design simple; the per-column prefix alone is redundant enough).

**Accepted costs:**
- ~125KB file-size overhead on a ~340KB storage blob (3 chars × ~60 game columns × ~700 rows). Shortens runway to the IndexedDB migration but doesn't block v0.12.
- Future bumps (v4, v5) churn every column header. Acceptable — a future format change at that magnitude is going to be painful regardless; the prefix at least makes version detection trivial.
- Ugly in spreadsheets. Users who open in Excel see `v3_battleReport_coinsEarned` as a column header. Tradeoff accepted.

**Rejected alternatives:**
- Option B (overloading `_Date` header) — rejected as a dual-purpose smell.
- Metadata sentinel row — rejected as redundant given Option C's per-column signal; adds a non-standard first row that spreadsheet users might delete.

### 9.2 Pre-migration backup expiry — **DEFERRED**

Tracker ticket, not blocking launch. Current PRD: never auto-deleted by v0.12. Follow-up release may expire after 10 successful visits or 90 days.

## 10. Release Plan

Single PR (large but cohesive). Scope = F1–F14 above. No partial ship — the parser rename and the migration are coupled; shipping one without the other guarantees data loss.

Sequence within the PR:
1. Scripts and fixtures committed (already done for the extraction scripts).
2. Scaffolding script (F2a) generates skeleton V2→V3 map from extracted CSVs.
3. Hand-edit the generated skeleton to finalize `V2_TO_V3_FIELD_MAP` (F2). Resolve all `TODO_V2` entries.
4. Section-aware parser with `v3_sectionCamel_labelCamel` keys (F1) + supportedFields update (F3) + Option C storage format (F4).
5. Migration gate + pre-migration localStorage backup (F5, F8). Gate runs first; backup written before UI renders.
6. Forced-download UX (F6) + backup flag (F7).
7. Takeover UI + transactional execution (F9).
8. Bulk import adapter (F10), unknown field handling (F11).
9. Pre-commit hook (F12).
10. Backup reminder banner (F13).
11. Discord channel + release comms (F14).

## 11. Success Signals (post-deploy)

- Zero Discord reports of lost history during the first week after release.
- Zero reports of app stuck in migration-failure loop.
- Every user who opens the app and had v2 data confirms their runs migrated (observable in Discord).
- Proactive backup banner observed in use (users downloading backups on their own).

A single data-loss report from any user within the first 30 days is treated as a P0 and reverted/hotfixed immediately. There is no tolerance here.
