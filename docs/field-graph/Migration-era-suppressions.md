# Migration-era suppressions (drained by commit 16)

Ledger of every temporary escape hatch introduced during the field-graph
migration epic. Companion to [`EPIC-migration.md`](./EPIC-migration.md). The
EPIC document points here; do not duplicate entries back into the EPIC.

## Why this file exists

Each entry is a workaround that exists only because of intermediate states
during the epic — a `test.skip` waiting on edges that haven't landed, an
ESLint override carrying dead phase-1 exports, etc. **Commit 16 deletes
every entry.** Anything that genuinely cannot be drained by then becomes
a follow-up issue and is removed from the list with a link.

## When to add an entry

Whenever a commit on this epic introduces a temporary workaround:
`eslint-disable`, ESLint config override, `test.skip`, `xit`, deferred
fixture, loosened Husky / lint-staged rule, `@ts-expect-error`, or any
inline comment of similar shape. Add the row in the same PR that
introduces the workaround.

## When to flip a row from `[ ]` to `[x]`

When the workaround has been removed in a later commit. Note the commit
number that removed it on the same line so commit 16's audit pass can
verify against `git log`.

## Format

```
- [ ] [commit N] <file:line> — <kind> — <one-line reason> — unblocked by: <commit M> / <follow-up issue>
```

`commit N` is the commit that *added* the suppression (use `[pre-epic]`
for entries inherited from the V2→V3 work that predates this epic). The
"unblocked by" pointer is the commit (or follow-up issue) that lets us
remove it.

## Active entries

- [ ] [pre-epic] [`eslint.config.ts`](../../eslint.config.ts) `scripts/**/*.{js,mjs,cjs,ts}` override — Node globals + relaxed `max-statements` / `max-lines-per-function` for one-shot data-prep `main()` functions — unblocked by: keep (these are legitimate Node scripts) **or** decide to delete the scripts post-migration.
- [x] [pre-epic] [`eslint.config.ts`](../../eslint.config.ts) `src/shared/domain/field-graph/**` override — disables `@typescript-eslint/no-unused-vars` so phase-1 dead exports don't trip lint — unblocked by: commit 4+ (consumers start importing the engine). **Removed in commit 4**: real consumers anchor every export, no unused-vars violations surface.
- [ ] [pre-epic] [`knip.json`](../../knip.json) `ignore: src/shared/domain/field-graph/**` — knip's pre-commit `--fix-type files,exports,types` was auto-deleting phase-1 engine exports (`buildGraph`, `EDGE_META`, `EdgeTargetKind`, etc.) before consumers in commits 4+ could import them — unblocked by: commit 4+ (real consumers anchor every export and knip can resume managing this directory).
- [ ] [pre-epic] [`knip.json`](../../knip.json) `ignore: src/shared/domain/migrations/v2-to-v3-field-map.generated.ts` — generated scaffold output (see [`scripts/migration-data-prep/scaffold-v2-to-v3-map.mjs`](../../scripts/migration-data-prep/scaffold-v2-to-v3-map.mjs)) consumed only by the hand-edited `v2-to-v3-field-map.ts` for diffing, so knip flags it as unused — unblocked by: commit 10 (RENAMED_FROM edges absorb the map; both files can be deleted).
- [ ] [pre-epic] [`src/shared/formatting/date-issue-detection.ts:115`](../../src/shared/formatting/date-issue-detection.ts) `// eslint-disable-next-line complexity` — V2/V3 dual-key tolerance bumps complexity to 11 — unblocked by: commit 10 (RENAMED_FROM edges collapse the dual-key check back to a single graph lookup).
- [ ] [pre-epic] [`e2e/features/analytics/tier-stats.spec.ts`](../../e2e/features/analytics/tier-stats.spec.ts) `test.skip` — persisted column config invalidated by V2→V3 rename — unblocked by: commit 6 (BELONGS_TO_SECTION).
- [ ] [pre-epic] [`e2e/features/analytics/tier-trends.spec.ts`](../../e2e/features/analytics/tier-trends.spec.ts) `test.skip` — field-search resolution still references V2 labels — unblocked by: commit 12 (APPEARS_IN_VIEW).
- [ ] [pre-epic] [`e2e/features/analytics/coverage-report.spec.ts`](../../e2e/features/analytics/coverage-report.spec.ts) `test.skip` — tooltip references V2 field labels — unblocked by: commit 6 (BELONGS_TO_SECTION).
- [ ] [pre-epic] [`e2e/features/analytics/field-analytics.spec.ts`](../../e2e/features/analytics/field-analytics.spec.ts) `test.skip` — default-field selection doesn't traverse V2→V3 rename — unblocked by: commit 10 (RENAMED_FROM).
- [ ] [pre-epic] [`e2e/features/data-import/bulk-export.spec.ts`](../../e2e/features/data-import/bulk-export.spec.ts) `test.skip` — fixture `expected-bulk-export.csv` still uses V2-era display labels; current export emits `v3_`-prefixed canonical keys — unblocked by: commit 5 (HAS_CSV_HEADER) **and** fixture regeneration.
- [ ] [commit 3] [`src/shared/domain/field-graph/types.ts`](../../src/shared/domain/field-graph/types.ts) `APPEARS_IN_VIEW` cardinality downgraded from `'at-least-one'` to `'many'` — Field nodes declared in commit 3 have no outgoing edges until commit 12, so the stricter invariant would reject every Field at build time. Paired `test.skip` in [`src/shared/domain/field-graph/field-graph.test.ts`](../../src/shared/domain/field-graph/field-graph.test.ts) ("cardinality 'at-least-one' is violated when a Field has no APPEARS_IN_VIEW"). Commit 12 must either restore `'at-least-one'` *or* document why it stays `'many'` (e.g. compound-only sources, non-UI internal fields that legitimately never render) — unblocked by: commit 12.

## Audit pass

Commit 16 verifies this list against the actual codebase via the grep
queries listed in the EPIC's commit-16 pre-work checklist. The active list
above must match the diff from those queries; if they disagree, this file
has drifted and must be reconciled before commit 16 lands.
