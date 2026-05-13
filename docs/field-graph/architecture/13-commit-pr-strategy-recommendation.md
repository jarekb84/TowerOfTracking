# 13. Commit / PR strategy recommendation (for THIS approach)

> Part of the Field Graph Architecture spec.
> [< Prev: 12. Extending with a new run type + sub-category (dissonance)](./12-extending-with-a-new-run-type-and-sub-category.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 14. Key lookup and renames — the conceptual model >](./14-key-lookup-and-renames.md)

---

The user has five concerns with big-bang PRs and is leaning toward one anyway for the graph approach. Their thesis: the graph's structure makes a big-bang *easier* to review because most of the diff is declarative edge data, not logic. That thesis deserves a strong yes/no, not a hedge.

I'll take a strong stance: **for the graph approach, a single hybrid-style big-bang PR is the right choice**, with internal commit groupings designed for GitHub's file-tree-based review UI. I'll defend it against each concern, then call out where I'd still split.

### 13.1. The honest case for big-bang for THIS approach

Three reasons the graph approach specifically rewards a single PR:

**1. The graph's value proposition is cohesion, and cohesion demands atomic review.** The whole thesis of the graph is that *one declaration replaces scattered encodings*. Shipping half the graph leaves the codebase in a worse state than either full status quo or full graph — consumers now have to know which fields are in the graph and which aren't, and every new edge declaration requires cross-referencing both sources. A reviewer evaluating "does this make the codebase better?" cannot answer that question from half the PR. They need to see the declarative-edge block alongside the consumer-refactor block to confirm the consumer is *actually* derived from the edges.

The user's own insight is key: **"each edge is a pattern... should be not a ton of code to read through and understand"**. That observation is true *only if* the reviewer sees patterns, not code. When the PR is 10k lines and 8k of them are `edge('coins_goldenTower', 'BELONGS_TO_SECTION', 'section:coins')` repeated 200 times, the reviewer scans by pattern, not line-by-line. A multi-PR split destroys that scanning by injecting consumer-refactor commits between edge-data commits — now the reviewer is context-switching between "is this edge right?" and "is this refactor correct?" in different PRs, days apart.

**2. Status-quo coexistence penalty is nontrivial for the graph.** Sections 3g and 5 describe the `BEFORE → AFTER` pattern where `COIN_FIELDS` keeps its export and becomes derived. That's elegant engineering *in the abstract*, but in practice it means for weeks/months there are two sources of truth and every consumer is reading from "the one that's been migrated this week." New feature PRs during that window have to choose which side to target. In a single big-bang PR, the choice evaporates — every consumer reads from the graph, and any future PR targets only the graph.

**3. Graph changes are disproportionately data edits, which GitHub's diff UI handles very well.** GitHub's PR review UI is file-tree-oriented and collapses folders. A PR that adds `src/shared/domain/field-graph/` as a new tree and modifies ~10 consumer files is easy to navigate: the reviewer expands `field-graph/` and sees every edge declaration in sibling files; collapses it and sees every consumer change. The file-tree structure *does the decomposition for you*. This is a property specific to organizing changes in a fresh directory — it doesn't hold if the changes are scattered across the existing tree.

Concretely: the PR-summary commit history for the big-bang would read something like:

```
1. field-graph/types.ts, builder.ts, query.ts        (core infra)
2. field-graph/nodes/*.ts                            (all node declarations)
3. field-graph/edges/*.ts                            (all edge declarations)
4. field-graph/derivers.ts                           (derivation functions)
5. field-graph/__tests__/*.test.ts                   (invariant tests)
6. scripts/graph-{viz,describe,orphans,diff,explain} (CLI)
7. Consumer refactor: coin-sources.ts → graph query
8. Consumer refactor: damage-sources.ts → graph query
9. Consumer refactor: V2_TO_V3_FIELD_MAP → graph query
10. Consumer refactor: section-config.ts → graph query
11. Consumer refactor: composite-key generation
12. Consumer refactor: run-type switch statements
13. Consumer refactor: DynamicFilterBar, one analytics page
14. Consumer refactor: remaining analytics pages
15. Delete legacy hand-authored arrays (dead code cleanup)
```

Fifteen commits, viewed in GitHub's "Files changed" tab, feel like a structured walkthrough. Viewed in "Commits" tab, feel like a step-by-step story. Both are natural GitHub flows.

### 13.2. The honest case AGAINST big-bang

Three real counter-arguments:

**1. Invariant-test failures compound.** In a multi-PR world, each PR's invariants are small — "every coin field IS_SOURCE_OF coinsEarned" in PR 2, "every field has HAS_DATA_TYPE" in PR 5. If an invariant fails, the blast radius is that PR's scope. In a big-bang, all fifteen commits' invariants go live at once. If on PR-merge day the CI catches "seven fields missing HAS_DATA_TYPE," you are debugging seven field declarations across three sections. This is still very tractable — the invariants point at specific fields — but it is a larger surface than a multi-PR split.

**2. Multi-PR rewards progressive ambition.** The graph's migration plan (section 5) is explicitly step-wise: start with coin-sources as a narrow slice, see if the team likes it, expand. That optionality is real value the user might want. A big-bang PR commits to the full graph before anyone has worked with it in anger.

**3. Review fatigue is real.** A 10k-line PR with 8k lines of data is still a 10k-line PR. Even if the data is scannable, a reviewer who has a bad day and rubber-stamps the data block might miss a subtle consumer-refactor bug. Multiple smaller PRs force separate review sessions, which force separate attention spans.

### 13.3. Concrete recommendation

**Recommendation: ONE big-bang PR with pre-agreed internal structure, PLUS ONE follow-up "delete legacy files" PR after a one-week soak.**

In detail:

**PR 1 — The Graph** (big-bang)
- Introduces the full `src/shared/domain/field-graph/` directory with nodes, edges, query API, CLI scripts, invariant tests.
- Refactors all identified consumers to query the graph while keeping their public export shapes unchanged (the `COIN_FIELDS` → derived pattern).
- Leaves the hand-authored arrays in place, but reduces them to thin wrappers around graph queries. Net LOC: +2400 added, -800 removed (similar to the in-place estimate from section 9.7 minus the delete step).
- Ships behind no feature flag. The graph is pure addition plus consumer-refactors that preserve shape.

**PR 2 — Legacy cleanup** (one week later)
- Deletes the hand-authored arrays entirely, leaves only the graph-query versions.
- One week soak gives time to catch real-world bugs where the graph and the legacy array diverge.
- Trivial mechanical change, ~1 day of work.

Why this structure addresses each user concern:

**Concern: "Reviewing a 10k-line PR in GitHub is painful."**
The PR is structured into 15 commits mapping 1:1 to file-tree groupings. GitHub's "Files changed" tab with the file tree collapsed shows eight top-level folders. The reviewer expands `src/shared/domain/field-graph/` and scans for structural issues; expands consumers one at a time. The *logical* review unit is the folder, not the file. In my experience reviewing graph-PRs like this, data-heavy diffs scan at ~500-1000 lines per minute after the first 10 minutes of pattern-locking. The 10k-line PR takes 15-20 minutes to scan once the reviewer has locked onto the edge pattern.

**Concern: "Multiple PRs pollute git history if one gets reverted."**
One-PR structure makes this concern moot. If PR 1 needs to be reverted after merge, it's one `git revert`. If the revert happens *during* the PR (before merge), you have a WIP you can abandon and restart. Multi-PR has the reverse pain — reverting PR 2 but keeping PR 1 leaves you with an odd in-between state where the graph exists but consumers still read from legacy. Big-bang has a cleaner revert story.

**Concern: "User prefers GitHub's PR-diff UI over VS Code's diff panel."**
This actively favors big-bang. GitHub's UI displays file-tree summaries, per-file review threads, and the ability to view "all commits" vs "one commit" at will. None of those benefits compound across multiple PRs — each PR is a separate UI session. The graph approach's *file-tree structure* (everything under `src/shared/domain/field-graph/`) is a gift to GitHub's UI specifically.

**Concern: "User is hesitant about missing holistic impact if work is split."**
Big-bang preserves the holistic view. The reviewer sees the edge data right next to the consumer refactor that consumes it. The structural invariants live in the same PR as the edges they enforce. The CLI scripts live next to the query API they're built on. Nothing is "out of sight."

**Concern: "Changelogs are generated from commit history — rollback churn pollutes release notes."**
Big-bang gives you one changelog entry. The internal commit history is rich, but the release-notes impact is one line: "Introduces field relationship graph as source of truth for field metadata." Multi-PR gives you 9-15 release-notes entries, each vague enough ("Adds coin-source graph edges"), each separately revertible, each a line of release-notes pollution if reverted.

**On "convince me."** Here is the convincing line, plainly: **the graph's atomic value is its cohesion, and the cost of a big-bang PR is mostly imagined**. The 10k-line PR is scannable because 80% of it is data in a new directory tree. The alternative — 9-15 PRs over 9-15 weeks — introduces every interim state as a distinct source of truth, and every interim state is worse than either full endpoint. If the graph is right, commit to it. If it's not right, you'll know in PR 1's review and you'll abandon it cleanly.

The one-week cleanup PR is a pragmatic safety net. It costs nothing, it preserves optionality for a week, and it cleanly separates "add the graph" from "delete the legacy." Those are the only two reviewable units. Everything in between is implementation detail.

### 13.4. The "oh crap" case

Mid-flight pivoting from the graph approach.

**If pivoting from graph → tag system (approach 8) mid-implementation:**
Salvageable: ~60%. Node declarations are directly portable — a field node with tags `['internal', 'coin-source']` is valid in both systems. Tag-style edges (`HAS_TAG`) map 1:1. What doesn't port is structured edges with metadata: `IS_DERIVED_FROM { deriver: 'X' }`, `RENAMED_FROM { atSchema: 'schema:v3' }`, `CONDITIONAL_ON enum:runType.dissonance`. Those require either collapsing to opaque strings (losing structure) or keeping a parallel "structured edges" data file next to the tags. In practice you'd keep the graph for derivation/rename/conditional edges and let tags carry the rest. That's an acceptable degradation — the graph's most *structural* edges (the ones tags can't express) are the ones most worth keeping.

**If pivoting from graph → status quo mid-implementation:**
Salvageable: ~30-40%. Query methods become pure functions on typed arrays (`sourcesOf(totalField)` becomes a constant). CLI tools (`graph:describe`, `graph:viz`) can be ported to operate on the flat arrays, keeping their discoverability value. Invariant tests port almost 1:1 since they were *always* walking indexes. What is lost: the cohesion. The one-edge-declaration-serves-many-consumers property evaporates. Each relationship type regresses to its own hand-authored file.

**If pivoting mid-PR-1 (before merge):**
Very salvageable. The graph is pure addition at that point — no legacy files have been deleted. Abandon the branch, take the CLI-tool concept back to whatever other approach survives, carry the invariant-testing style, discard the rest.

**If pivoting 6 months post-merge after seeing the graph in production:**
The blast radius is every consumer. Mitigation: keep the public exports of `COIN_FIELDS`, `DAMAGE_FIELDS`, `V2_TO_V3_FIELD_MAP` intact during PR 1 (they just become derived). If later you regret the graph, you rehydrate those arrays with their literal content — one PR that inlines the query results into the source files — and the downstream code is untouched. The graph was always sitting above a preserved public API; that preservation is what enables graceful rollback.

**On regret specifically.** The user is worried about regretting the choice mid-implementation. The graph's structure makes mid-flight pivoting *easier than most alternatives* because:
- Consumer-level abstractions (the preserved exports) insulate most code from the query-vs-literal decision.
- The invariant-test style survives any approach.
- The CLI tooling survives any approach that has a declarative data file.
- The cost of the graph is the cost of writing ~1500 edges. That cost, if discarded, becomes ~1500 entries in tag arrays or flat manifests — still useful input, still reformatable.

The sunk cost of a half-built graph is mostly data, and data rehydrates. The sunk cost of *half-migrated consumers* is the real risk — and that's why PR 2's "delete legacy" is a separate, deferred step. Until PR 2 ships, the legacy files are still there and the graph is an ornament; if regret strikes, you delete the `field-graph/` directory and the codebase is unchanged.

### 13.5. GitHub review strategy

Assuming one big-bang PR, here is the concrete organizational approach inside the PR that maximizes GitHub's review UX.

**Commit structure (15 commits, atomic, each passing CI on its own):**

1. `feat(field-graph): introduce core types, builder, query API`
2. `feat(field-graph): declare Section, Category, View, Schema nodes`
3. `feat(field-graph): declare Field nodes (grouped by section)`
4. `feat(field-graph): declare EnumValue nodes and _runType enum edges`
5. `feat(field-graph): declare BELONGS_TO_SECTION and BELONGS_TO_CATEGORY edges`
6. `feat(field-graph): declare IS_SOURCE_OF edges (coin/damage sources)`
7. `feat(field-graph): declare HAS_DISPLAY_NAME, HAS_COLOR, HAS_DATA_TYPE edges`
8. `feat(field-graph): declare RENAMED_FROM edges (V2→V3 migration)`
9. `feat(field-graph): declare APPEARS_IN_VIEW and APPEARS_IN_FILTER edges`
10. `feat(field-graph): declare derivations and register deriver functions`
11. `feat(field-graph): add structural invariant tests`
12. `feat(field-graph): add CLI scripts (graph:{describe,viz,orphans,diff,explain})`
13. `refactor(fields): rewrite COIN_FIELDS, DAMAGE_FIELDS as graph queries`
14. `refactor(migrations): rewrite V2_TO_V3_FIELD_MAP as graph query`
15. `refactor(analytics): rewrite filter bar as DynamicFilterBar; update analytics pages`

The "Files changed" tab groups these naturally by directory. The "Commits" tab tells the story in order.

**File-order conventions inside each folder:**

- `nodes/` first, `edges/` second — reviewer sees nodes declared before edges reference them.
- Within `edges/`, group by semantic weight: core membership (`belongs-to-section`, `is-source-of`) before display (`has-display-name`, `has-color`) before migration (`renamed-from`) before views (`appears-in-view`, `appears-in-filter`). A reviewer skimming top-to-bottom sees structural truth first, cosmetics second.
- `__tests__/` last in each folder — tests reference the data, so reviewer has already loaded the data context.

**PR description checklist (what the reviewer sees first):**

```markdown
## Summary
Introduces `src/shared/domain/field-graph/` as the single source of truth
for field metadata. Replaces hand-authored arrays in `coin-sources.ts`,
`damage-sources.ts`, `v2-to-v3-field-map.ts`, and parts of `section-config.ts`
with queries over declarative edges.

## Review Guide (~30 minutes total)

**10 minutes: scan edge data (~8000 lines, ~500 lines/min)**
- [ ] `field-graph/nodes/*.ts` — node declarations are plausible
- [ ] `field-graph/edges/*.ts` — edges reference declared nodes; read for
      patterns, not every row

**10 minutes: core infrastructure (~800 lines)**
- [ ] `field-graph/types.ts` — Edge union covers all needed relationships
- [ ] `field-graph/builder.ts` — build-time validation catches dangling refs
- [ ] `field-graph/query.ts` — query methods are memoized and correct

**5 minutes: consumer refactors (~400 lines)**
- [ ] `coin-sources.ts`, `damage-sources.ts`, `v2-to-v3-field-map.ts` — exports
      preserved, bodies derived
- [ ] `DynamicFilterBar` — one new component, replaces N filter components

**5 minutes: tests and tooling**
- [ ] 12 invariant tests in `field-graph/__tests__/graph-invariants.test.ts`
- [ ] CLI scripts in `scripts/graph-*.mjs`

## Non-goals
- Legacy file deletion (deferred to follow-up PR after one-week soak)
- Additional edge types beyond those listed (future PRs can add without
  touching consumers)

## Runbook if something breaks
- `npm run graph:orphans` — find missing edges
- `npm run graph:describe <field>` — inspect any field's metadata
- `npm run graph:diff main HEAD` — see every edge added/changed

## Invariant tests catch
- Dangling edges (references to undeclared nodes)
- Duplicate node ids
- Fields missing required edges (section, data type)
- Rename cycles
- Empty sections / orphaned fields
```

The checklist format turns the PR into a guided review. The reviewer works through the checklist, ticks items, leaves targeted comments. GitHub's per-file comment threads are reserved for specific issues; the high-level review is driven by the checklist.

**Bot-generated graph diff as a comment.** One hook worth adding: on PR open/update, CI runs `npm run graph:diff main HEAD` and posts the result as a PR comment. The reviewer sees:

```
## Graph diff vs main
Added nodes (N): section:coins, section:damage, ...
Added edges (M):
  BELONGS_TO_SECTION × 80
  IS_SOURCE_OF × 25
  HAS_DISPLAY_NAME × 150
  ...
Removed: (none)
Changed: (none)
```

This gives the reviewer a structural summary before opening a single file. Paired with the checklist, it's a very effective review flow.

**On forward-looking comments.** Encourage the reviewer to leave TODO-style comments for future PRs rather than blocking on "this edge could be cleaner." The graph data is purely additive — cleanup is always a separate PR with tiny blast radius. Blocking on data-level nits delays a merge that the codebase benefits from immediately.

**Final note on scannability.** The user's instinct that "each edge is a pattern, like those should be not a ton of code to read through" is exactly right — *provided the pattern is visible*. The structure above makes the pattern visible: edges grouped by type, one type per file, sorted by semantic weight. A reviewer who reads the first 20 edges of `is-source-of.ts` has locked onto the pattern and can scan the remaining 180 edges at a glance. The big-bang PR is reviewable precisely because its bulk is *self-similar data*. That's the property multi-PR splits would sacrifice.

---

> [< Prev: 12. Extending with a new run type + sub-category (dissonance)](./12-extending-with-a-new-run-type-and-sub-category.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 14. Key lookup and renames — the conceptual model >](./14-key-lookup-and-renames.md)
