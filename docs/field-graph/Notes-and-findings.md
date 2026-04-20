[2026-04-19] [commit 1] npm run lint fails with 8 pre-existing errors on the branch tip (9546ef3), inherited from commit a9846a9 (V2→V3 migration / V28 parser work):

scripts/migration-data-prep/extract-v2-fields.mjs — 2× no-undef on process.
scripts/migration-data-prep/extract-v28-fields.mjs — max-statements on main, no-undef on process.
scripts/migration-data-prep/scaffold-v2-to-v3-map.mjs — 2× max-statements.
src/shared/formatting/date-issue-detection.ts:115 — complexity: 11/10 on detectDateIssue; :207 — unused _legacy binding.
These are out of scope for commit 1 but will block npm run integration-precheck for every subsequent commit on this branch until fixed. Options: (a) add an eslint-suppressions.json entry (fast), (b) a dedicated cleanup commit between commits 1 and 2, or (c) fold into commit 2's incidental cleanup. Flagging here per the "don't silently fix prior work" constraint.

[2026-04-19] [commit 1] Spec §8.4 lists BELONGS_TO_SECTION cardinality as 'one'; §15.1 updates it to 'many'. Implementation follows §15.1 (the later, explicit multi-section section). The "every field belongs to at least one section" rule will be added as a per-tag invariant in commit 6 when real BELONGS_TO_SECTION declarations land.

[2026-04-19] [commit 1] PARTICIPATES_IN_COMPOSITE_KEY was coded with targetKind: 'terminal' (any string). Spec §8.1 shows to: 'compositeKey:primary' with no matching node declaration, so a terminal is the simplest honest model until commit 14 introduces real composite-key usage. Revisit there if a CompositeKey node kind becomes useful.

[2026-04-19] [commit 2] `category:records` is declared but no matching `view:run-details:records` exists — `RECORDS_CONFIG` is defined in `section-config.ts` and included in `CATEGORIZED_FIELDS`, but `use-run-details-data.ts` never extracts or renders it today. Current catalog omits the view node to stay faithful to the present UI surface. Commit 6 (BELONGS_TO_SECTION / RENDERS_AS_IN_SECTION) or the commit that wires APPEARS_IN_VIEW for run-details should decide: either promote records to a real run-details sub-section (and add `view:run-details:records` + rendering) or drop `category:records` and surface records purely through chart views.

[2026-04-19] [commit 2] `section:enemiesDestroyedBy` is declared for completeness (it's one of the 16 V3 prefixes in `sampleData/supportedFields.json`), but run-details currently aliases `DESTROYED_BY_CONFIG = ENEMIES_HIT_BY_CONFIG` — the `enemiesDestroyedBy_*` fields have no UI surface today. Commit 3+ should flag any field whose only membership would be `section:enemiesDestroyedBy` so the graph doesn't silently promote an unused section into the UI.