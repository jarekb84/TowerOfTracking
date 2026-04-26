## Prompt skeleton — implementation chats

Copy-paste this into a new chat for each commit. Fill in the bracketed parts.

```
You are implementing commit [N] from docs/field-graph/EPIC-migration.md on branch 204-v28-migration-safety.

Read in this order before starting:
1. docs/field-graph/field-graph-for-ai.md — standing contributor guide.
2. docs/field-graph/EPIC-migration.md — epic checklist. Read the **full preamble** (the "If you are an AI picking up this work" section) before scrolling to commit [N]. The preamble locks design conventions and — critically — defines what "vertical slice" means in this epic. Confirm commit [N] is TODO, confirm its dependencies are marked DONE, and read the commit's scope + spec references.
3. docs/field-graph/Notes-and-findings.md — running log of cross-commit learnings. Skim entries from the most recent few commits before starting; some of them constrain or expand the scope of the commit you're about to do.
4. docs/field-graph/architecture/[NN-...md files listed in the commit's spec references] — authoritative spec. The full spec lives in docs/field-graph/architecture/, indexed at 00-table-of-contents.md; only load the per-section files referenced by this commit.

Scope for this commit (from the epic):
[PASTE the commit's Scope + Cutover Requirement + DoD verbatim from the epic.]

Constraints:
- **The vertical-slice principle is non-negotiable.** Per epic preamble §5, this commit is not "declare the edges and stop." It is "declare the edges + cut over EVERY existing consumer + delete the legacy mechanism." After the commit lands, no production code path uses the pre-graph approach for this concept. If you find a consumer not listed in the commit's "Files touched" but using the legacy mechanism, that's part of the cutover — fold it in.
- **Variable-swap is NOT cutover.** A cutover that ports field-name constants (`INTERNAL_FIELD_NAMES.DATE` → `_DATE_NODE.id`) but leaves the surrounding `if/else if (fieldName === X) { specific-logic } else if (fieldName === Y) { specific-logic }` ladder intact is the *letter*, not the *spirit*, of the architecture. The graph exists to eliminate that conditional logic — fields are self-aware, the engine answers questions, the consumer becomes a one-line query call. If your cutover leaves a switch-on-field-id that the graph could collapse, you have NOT cut over the concept; you have cut over the strings. Surface this in your "Smells & questions" report-back. If a future commit owns the conditional-logic elimination (e.g. the per-field switch in csv-exporter is owned by commit 5c — `HAS_CSV_EXTRACTOR` registry), say so explicitly. If no future commit owns it, **propose adding one** in the same PR, or scope the elimination into the current commit. (Reference: commit 5 originally landed as a variable-swap; commit 5c was added retroactively to eliminate the actual conditional logic.)
- **The epic is evolving.** Per epic preamble §7, you are encouraged to update the epic in this same PR if you discover the commit scope was wrong. Examples: cutover footprint larger than expected → expand "Files touched"; emerging architectural smell across commits → add a new follow-up entry to phase 2.5; a dependency on a not-yet-shipped concept → flag it and stop. The user is the decider; you are the spotter. Surface smells; don't ship around them silently.
- Follow the React separation and code-org rules in CLAUDE.md.
- `npm run integration-precheck` must pass before the commit lands.
- If a prior commit's work turns out to be incomplete, STOP and flag it; do not silently fix it.
- **Mark the commit DONE in the epic at the end of your initial implementation pass.** Flip its checkbox `[ ]` → `[x]` and change `Status: TODO` → `Status: DONE` in `EPIC-migration.md`. The user reviews the diff and pushes back if they disagree — that's cheaper than them having to update it manually every time. **Exception:** if your "Smells & questions" report-back surfaces a *material* architectural question that might restructure the commit (not a minor polish concern — a "should this commit even exist in this shape" question), DO NOT mark it done. Surface the question, leave the marker `[ ]`, and say explicitly in your report "not marking done because <question>." The user's decision drives whether to mark, revert, or restructure.
- If you introduce any temporary suppression (`eslint-disable`, `test.skip`, ESLint config override, deferred fixture, loosened lint-staged rule, `@ts-expect-error`, etc.), append a row to [`Migration-era-suppressions.md`](./Migration-era-suppressions.md) in the same PR. Commit 16 audits this file; nothing ships without a row.

Mid-implementation self-check (run these BEFORE you finalize the commit):
1. **Cutover audit.** Grep for any remaining usage of the legacy mechanism this commit replaces (the hand-authored constant, map, switch, etc.). Every hit either gets cut over in this commit or gets explicitly noted as a deferred follow-up commit (added to phase 2.5 in the epic). No silent partial cutovers.
2. **Conditional-logic elimination check.** This is the harder cousin of #1. After your changes, grep the *surrounding* code for `if (X === _Y_NODE.id)` / `switch (fieldName)` / `fieldName === ...` ladders. Did your cutover eliminate them, or did it just rename their RHS? If the ladder remains, the commit has NOT delivered the architectural intent — it has only ported the strings. Either fold the elimination into this commit or, if the right mechanism is owned by a different concept (e.g. `HAS_CSV_EXTRACTOR`, `IS_DERIVED_FROM`), name the future commit explicitly and ensure that commit's scope is updated. If no future commit owns it, propose adding one in the same PR.
3. **Cumulative-trajectory check.** Re-read the engine class (`src/shared/domain/field-graph/field-graph.ts`) you just modified. How many query methods does it have now? How many methods has this commit added? If commits 4 + 5 + your commit have grown the surface to ≥10 named methods on `FieldGraph`, flag it as an API-shape concern in your report — even if the approved direction (commit 5b's ADR) hasn't been picked yet.
4. **Dead-code drained.** What did this commit's cutover make redundant? Run a final grep for the now-orphaned helpers and either delete them in this commit or add a `[commit N]` Notes-and-findings entry naming the deferred deletion and which later commit owns it.
5. **Epic-evolution check.** Did anything you learned during this commit invalidate or refine a later commit's scope? Update that later commit's scope in the epic in the same PR. Don't leave the next implementer with a stale scope description.

Before reporting back:
1. Edit docs/field-graph/Notes-and-findings.md and APPEND entries for anything unexpected, deferred, or that later commits need to know about. Use the format `- [YYYY-MM-DD] [commit N] — <note>`. One bullet per observation. The Notes file is the running architectural log; future commits read it.
2. **Mark the commit DONE** in the epic — checkbox `[ ]` → `[x]` and `Status: TODO` → `Status: DONE`. Skip ONLY if a material architectural question is open (per the constraints section above); in that case leave the marker `[ ]` and call it out in your report.
3. If you updated any later-commit scopes in the epic (per the epic-evolution check above), call that out explicitly in your report so I can sanity-check.

Then report back:
1. Summarize what changed (files added / modified / deleted, roughly).
2. Show me the commit message you suggest.
3. **Cutover report.** State explicitly: which legacy mechanisms got deleted, which call sites were migrated, and what — if anything — remains using the pre-graph approach (with a follow-up plan). "Nothing remains; cutover complete" is the target.
4. **Conditional-logic report.** State explicitly: did the cutover eliminate the surrounding conditional ladders, or only port the field-name constants inside them? If conditional logic remains, name the commit (existing or proposed) that will eliminate it. "Variable-swap with conditional logic intact" is a smell, not a successful cutover — call it out.
5. **Trajectory report.** Did this commit grow the engine API? By how much? Are we approaching the threshold where commit 5b (or whatever follow-up the human picked) should land?
6. **Smells & questions.** Anything that felt off during implementation. The pattern that didn't fit. The duplication between two declarations. The helper that took three tries to name. Surface it. The user wants to be the decider, not the spotter.
7. **Notes & Findings appended.** List the Notes-and-findings.md entries you just added, so the user can sanity-check them.
8. **Epic edits made.** List any commit-scope edits you made in EPIC-migration.md (per the epic-evolution check).
```

### Per-phase notes on this prompt

- **Phase 1 commits (1–3)**: lower risk; the agent is writing greenfield (no consumers yet, so the cutover principle doesn't apply). Follow the skeleton as-is but skip the "cutover audit" self-check.
- **Phase 2 commits (4–14)**: each deletes imperative code AND cuts over every consumer. The cutover audit and dead-code drain are the core work — not afterthoughts. If a cutover is genuinely too large for one commit (say, 50+ call sites that touch unrelated subsystems), break it into a `Na` / `Nb` pair in the epic *before starting* — don't ship a half-cutover and leave a Notes-and-findings entry as the followup tracking.
- **Commit 5b (API ergonomics interlude)**: special — it's a design-doc-and-refactor commit, not an edge-declaration commit. The cutover principle still applies: whatever direction is picked, all engine methods get migrated to the new shape in the same commit. No "old API" / "new API" coexistence.
- **Commit 15**: the real feature. Add to the scope: "After declaring the edges, run the parser against each Dissonance_*.txt sample in `sampleData/v28/` and show me the resulting `ParsedGameRun.fields._dissonanceSubCategory` values."
- **Commit 16**: the suppression sweep. Cutover principle is inverted — the goal is "delete every entry in `Migration-era-suppressions.md`" rather than introduce something new.

### Exploration-doc convention

If during this commit you (or a side agent you spawn) produce an exploration doc — design discussion, options analysis, deep dive — for an architectural question raised during implementation:

1. **Place it in `docs/field-graph/`** as `EXPLORATION-<topic>.md`. Match the format of [`EXPLORATION-tag-vs-edge.md`](./EXPLORATION-tag-vs-edge.md) and [`EXPLORATION-node-identity-abc-deep-dive.md`](./EXPLORATION-node-identity-abc-deep-dive.md): blockquoted front-matter with date, branch, status, cross-links; then numbered sections; then a per-option matrix; then a recommendation; then per-commit impact.

2. **Frame the doc's top-of-page summary as `Recommendation summary (30-second read)`**, not "Decision summary." This is the model's recommendation — clearly distinguished from the human's actual decision.

3. **Include a `## Human decision` section directly after the front-matter cross-links**, BEFORE section 1 of the doc body. Use the following structure, prefilled as a placeholder for the human to complete (the human edits this section after reviewing the doc):

   ```markdown
   ## Human decision

   **Decided <YYYY-MM-DD> by <author>:**

   <One-sentence summary of the decision. Make it copy-pasteable into a commit message.>

   **Reasoning (the human's words, captured for future revisits):**

   > <Direct quote or close paraphrase of the human's stated reasoning. Preserve their voice — it's load-bearing for future engineers revisiting the call.>

   <Optional: 1–2 sentence translation of the quote into more structured language if the original is conversational.>

   **Where the decision deviates from the recommendation:**

   - <bullet list of any places the human chose differently from the doc's recommendation, with a brief why for each>
   - <if no deviations: "Accepted as recommended.">

   **Scope of decision (which commits implement it):**

   - <commit N> — <what changes there>
   - <commit M> — <what changes there>
   - <link any updated EPIC commit-scope edits>

   **Status:** <accepted / superseded by <other doc> / rejected>; <implemented in commit N | pending implementation in commit N | no implementation needed>.

   **Future revisit triggers:**

   <When should we re-open this question? Specific conditions: scale change, new requirement, pattern recurrence, etc. If "never," say so.>
   ```

4. **Why this matters.** The model's recommendation is the *input* to the decision; the human's decision is the *output*. Both stay in the doc — preserving the reasoning chain in git history is the whole point of these exploration docs. When a future engineer (or future AI) asks "why did we go this way?", they should find the recommendation and the human's response side by side, not just the implemented result.

5. **The exploration doc lands in the same PR as the commit that surfaced the question.** Don't ship the exploration doc separately; it's part of the architectural record of that commit. The Human decision section can be filled in during the same PR review or in the immediately following PR — whichever the human prefers — but the placeholder section MUST exist in the initial commit.

6. **If you (the implementing agent) are spawning the exploration agent**, brief it to follow the convention above. The exploration agent writes the recommendation summary + the empty Human decision placeholder; the human fills the placeholder in during review.

## Status audit — last updated

_(update this line each time you mark a commit DONE.)_

- Last updated: 2026-04-25
- Commits DONE: 7 / 16 (commits 1, 2, 3, 4, 5, 5b, 8). Commit 5c was proposed as a separate slot then retired/folded into commit 8 mid-implementation; net commit count is back to 16.
- Currently in progress: none — commit 8 just landed. Next up: any of commits 6, 7, 9, 10 (their dependencies are met).
- Recent epic edits:
  - **Commit 5c retired → folded into commit 8.** Originally a `HAS_CSV_EXTRACTOR` + registry to eliminate the csv-exporter switch ladder. User review surfaced that the underlying axis was data type, not extractors. Redesigned per [`EXPLORATION-data-type-edge-vs-property.md`](./EXPLORATION-data-type-edge-vs-property.md) — every Field declares `IS_OF_TYPE` (renamed from `HAS_DATA_TYPE`), parser becomes graph-driven, csv-exporter ladder collapses naturally via uniform `formatFieldValue` dispatch.
  - **Commit 8 expanded** to include the `IS_OF_TYPE` rename + the catalog-level [`PATTERN.md`](../../src/shared/domain/field-graph/catalog/PATTERN.md) (four-question litmus for edge-vs-node-property) + the csv-exporter cutover that 5c originally targeted.
  - **Commit 9 absorbed** the deletion of csv-exporter's transitional `withPopulatedAppFields` preprocessor. Once the IS_DERIVED_FROM cascade ensures `_date` / `_time` / `_runType` are populated at parse time, the preprocessor disappears.
  - **Commit 16 absorbed** a litmus retrospective + a TypeScript-vs-graph trade-off audit (revisit triggers from the data-type-edge-vs-property ADR).
  - **Prior:** Commits 6–14 got "Cutover requirement" lines (commit 5 era); commit 5b expanded to include `Node.tags` removal (per `EXPLORATION-tag-vs-edge.md`); commit 10 absorbed the legacy-internal-field rename helpers; prompt skeleton gained a "conditional-logic elimination" self-check + the "mark commit DONE on initial pass with material-question exception" rule.
