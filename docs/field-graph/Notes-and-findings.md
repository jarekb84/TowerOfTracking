[2026-04-19] [commit 1] npm run lint fails with 8 pre-existing errors on the branch tip (9546ef3), inherited from commit a9846a9 (V2→V3 migration / V28 parser work):

scripts/migration-data-prep/extract-v2-fields.mjs — 2× no-undef on process.
scripts/migration-data-prep/extract-v28-fields.mjs — max-statements on main, no-undef on process.
scripts/migration-data-prep/scaffold-v2-to-v3-map.mjs — 2× max-statements.
src/shared/formatting/date-issue-detection.ts:115 — complexity: 11/10 on detectDateIssue; :207 — unused _legacy binding.
These are out of scope for commit 1 but will block npm run integration-precheck for every subsequent commit on this branch until fixed. Options: (a) add an eslint-suppressions.json entry (fast), (b) a dedicated cleanup commit between commits 1 and 2, or (c) fold into commit 2's incidental cleanup. Flagging here per the "don't silently fix prior work" constraint.

[2026-04-19] [commit 1] Spec §8.4 lists BELONGS_TO_SECTION cardinality as 'one'; §15.1 updates it to 'many'. Implementation follows §15.1 (the later, explicit multi-section section). The "every field belongs to at least one section" rule will be added as a per-tag invariant in commit 6 when real BELONGS_TO_SECTION declarations land.

[2026-04-19] [commit 1] PARTICIPATES_IN_COMPOSITE_KEY was coded with targetKind: 'terminal' (any string). Spec §8.1 shows to: 'compositeKey:primary' with no matching node declaration, so a terminal is the simplest honest model until commit 14 introduces real composite-key usage. Revisit there if a CompositeKey node kind becomes useful.