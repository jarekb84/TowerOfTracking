# Exploration: tag vs edge — when does a node-side `tag` earn its keep?

> **Date:** 2026-04-25
> **Branch:** `204-v28-migration-safety`
> **Author:** prep doc for human review
> **Status:** human decision recorded — see "Human decision" section below
>
> **Recommendation summary (30-second read):**
> - **Drop the `'internal'` tag. Keep the `IS_INTERNAL_FIELD` edge.** The two
>   encode the same fact ("this is app-metadata, not game-data") and the
>   edge is the structural contract; the tag is the leftover from when we
>   didn't have one. Cost: tiny — three lines deleted in
>   `fields.nodes.ts`, two assertions rewritten in `fields.nodes.test.ts`.
> - **Discipline going forward: edges for facts the engine queries; tags
>   reserved for the very narrow case of node-local metadata that NO
>   consumer queries by tag, only inspects after it already has the node.**
>   In practice this turns out to be ~zero cases at our scale, so the
>   pragmatic stance is: **prefer edges; treat any new tag as a
>   smell-with-a-rationale, not a default.**
> - **`'tournament-only'` (planned for `_rank`): drop. Subsumed by
>   `_RANK_NODE CONDITIONAL_ON ENUM_RUN_TYPE__TOURNAMENT_NODE`** in commit 13.
> - **`'user-text'` (planned for `_notes`, spec §11.4 gotcha 3): edge,
>   not tag.** Either a marker `IS_USER_TEXT` or a CSV-quoting policy
>   edge. Don't add it as a tag.
> - **`'nullable-empty-string'` (planned for `_rank`, spec §11.4 gotcha 8):
>   edge** — `HAS_NULL_SENTINEL` to terminal `''`, OR fold into the data-
>   type vocabulary. Spec already flagged this as the more structured
>   option. Take it.
> - **Generalize the framing: `tags-as-edges` (option 4 below) is what we
>   already have for the `'internal'` case** — we just have it twice
>   (once as a node tag, once as an edge). Removing the tag side leaves
>   tags-as-edges as the only extension point for binary node facets,
>   which is the intended end-state.
> - **Land the cleanup in commit 5 (the one we're finishing).** It's a
>   five-line tag deletion and two test assertions; it's the natural
>   close of the same vertical slice that introduced the edge.
>   Punting to commit 5b (API revisit) or commit 16 (suppression sweep)
>   leaves the smell hanging across multiple PRs for no benefit.
>
> Cross-links:
> - **EPIC:** [`EPIC-migration.md`](./EPIC-migration.md) — commit 5 is the
>   active commit; this doc lands as part of finishing it.
> - **Spec:** [`architecture/11-internal-app-fields.md`](./architecture/11-internal-app-fields.md) §11.1
>   (the original "tag + edge — both" recommendation that this doc
>   revisits in light of what shipped).
> - **Standing context:** [`field-graph-for-ai.md`](./field-graph-for-ai.md) —
>   read first if you don't have the field-graph mental model loaded.
> - **Companion:** [`EXPLORATION-node-identity-abc-deep-dive.md`](./EXPLORATION-node-identity-abc-deep-dive.md) —
>   format precedent.

---

## Human decision

**Decided 2026-04-25 by Jarek (project owner):**

Accept the recommendation to drop the `'internal'` tag, **and go further: remove `Node.tags` from the type system entirely.** Tags are gone as a concept on field-graph nodes; every fact a consumer queries is an edge.

**Reasoning (the human's words, captured for future revisits):**

> "I'd rather for now in 5b remove the tags approach. The edge approach is more powerful. The tag approach we initially investigated is unstructured — not as easily queryable in the graph from my understanding of what we're building here. So the edge approach gives us more, it's a more structured thing. At least it seems so."

In other words: at this codebase's scale, edges are structurally queryable and refactor-safe (rename a `*_NODE` and every edge using it follows); tags are unstructured node-local strings that consumers would have to pattern-match against. Keeping the type-system support for `tags` would invite future drift back into the parallel-representation problem this exploration was opened to resolve. The recommendation's "tags-as-anti-pattern" discipline already arrives at near-zero legitimate uses; removing the type-system carrier is the consistent next step.

**Where the decision deviates from the recommendation:**

- The doc recommends landing the `'internal'` tag deletion in commit 5. Human chose to defer to commit 5b instead — keeps commit 5's scope tight and consolidates all `Node`-shape changes (API ergonomics + tags) into the same interlude.
- The doc leaves `Node.tags` in `types.ts` "for now" pending a future tag use-case. Human chose to delete it preemptively — the planned `'tournament-only'`, `'user-text'`, and `'nullable-empty-string'` tags from earlier notes are all redirected to edges (covered by `CONDITIONAL_ON` in commit 13, and by edges yet-to-name in commits 8 / 14).

**Scope of decision (which commits implement it):**

- **Commit 5b** absorbs the implementation. Concrete steps now in 5b's scope:
  1. Delete `tags?: readonly string[]` from `Node` in [`types.ts`](../../src/shared/domain/field-graph/types.ts).
  2. Drop `tags` parameter / option from `fieldNode()` and other node-builders in [`builders.ts`](../../src/shared/domain/field-graph/builders.ts).
  3. Delete `tags: ['internal']` from the five internal-field declarations in [`fields.nodes.ts`](../../src/shared/domain/field-graph/catalog/fields.nodes.ts).
  4. Rewrite the two `tags?.includes('internal')` assertions in [`fields.nodes.test.ts`](../../src/shared/domain/field-graph/catalog/fields.nodes.test.ts) to query `appGraph().isInternalField(node)`.
  5. Add a guideline to [`field-graph-for-ai.md`](./field-graph-for-ai.md): *"Never introduce `Node.tags`. Facts about a node are edges."*
- **Commits 8, 13, 14** absorb the redirected tag intents:
  - `'tournament-only'` → covered by `_RANK_NODE CONDITIONAL_ON ENUM_RUN_TYPE__TOURNAMENT_NODE` (commit 13, already in scope).
  - `'user-text'` → new edge in commit 8 or 14 (will be folded into the relevant commit's "Cutover requirement" line when its scope is next refined).
  - `'nullable-empty-string'` → new edge or fold into data-type vocabulary in commit 8.
- **Commit 5** does NOT touch tags — the tag stays on the five field nodes through this commit, gets removed in 5b.

**Status:** Accepted; pending implementation in commit 5b.

**Future revisit triggers:**

If a real use-case emerges for unstructured node-local metadata that genuinely should NOT be queryable through the graph (purely informational, never inspected by consumers, never aggregated), revisit. As of 2026-04-25 no such case exists in the codebase.

---

## 1. The question

After commit 5 lands, the catalog encodes the same fact in two places:

```ts
// catalog/fields.nodes.ts
export const _DATE_NODE     = fieldNode('_date',     { tags: ['internal'] });
export const _TIME_NODE     = fieldNode('_time',     { tags: ['internal'] });
export const _NOTES_NODE    = fieldNode('_notes',    { tags: ['internal'] });
export const _RUN_TYPE_NODE = fieldNode('_runType',  { tags: ['internal'] });
export const _RANK_NODE     = fieldNode('_rank',     { tags: ['internal'] });

// catalog/internal-fields.edges.ts
edge(_DATE_NODE.id,     'IS_INTERNAL_FIELD'),
edge(_TIME_NODE.id,     'IS_INTERNAL_FIELD'),
edge(_NOTES_NODE.id,    'IS_INTERNAL_FIELD'),
edge(_RUN_TYPE_NODE.id, 'IS_INTERNAL_FIELD'),
edge(_RANK_NODE.id,     'IS_INTERNAL_FIELD'),
```

The two say the same thing. There's no consumer today that asks
"is this field internal?" and gets an answer that depends on which
representation it consulted. Spec §11.1 originally argued for *both* —
"the tag carries the invariant, the edge carries the structural
contract" — but it referenced "section 10's invariant tests" that
haven't been written yet, and the API surface that ships in commit 5
gives `graph.isInternalField(field)` as the single accessor every
consumer uses. The tag is unloaded.

This raises a sharper question that will recur for every facet we add
to a field node: **when is `tag` the right primitive, and when is
`edge` the right primitive?**

Concrete pending decisions where this question will matter:

| Facet | Today | Spec proposal | Commit |
|---|---|---|---|
| `'internal'` | Tag *and* edge | §11.1: both | already shipped — this doc |
| `'tournament-only'` (on `_rank`) | Not declared | §11.1 example: tag | 13 (CONDITIONAL_ON) |
| `'user-text'` (on `_notes`) | Not declared | §11.4 gotcha 3: tag | 5 / 5b / TBD |
| `'nullable-empty-string'` (on `_rank`) | Not declared | §11.4 gotcha 8: tag, OR `HAS_NULL_SENTINEL` edge | TBD |
| `'dropped'` / `'pending_classification'` | Mentioned in `field-graph-for-ai.md` invariant carve-out | tag | TBD |

If we ship the `'internal'` redundancy without a discipline, every one
of those facets above is a coin-flip — and once five different
contributors have flipped five different coins, the catalog has the
"AI slop" smell CLAUDE.md warns about: same-shaped fact expressed
differently in different files. The discipline-call has to land now.

## 2. Options

Five framings. Each is described in terms of: catalog declaration
shape, engine surface, consumer impact, and how it scales when commits
6–14 add the next four facets above.

### Option 1 — Drop the tag, keep the edge

Tag information moves to edges. Binary facets become marker edges
(`targetKind: 'none'`, like the existing `IS_INTERNAL_FIELD`). Value
facets become terminal-string edges (`targetKind: 'terminal'`, like
`HAS_CSV_HEADER`).

**Catalog declarations.**

```ts
// catalog/fields.nodes.ts — leading underscore is the only "internal"
// hint at the node-declaration layer; the structural fact lives in
// internal-fields.edges.ts.
export const _DATE_NODE     = fieldNode('_date');
export const _TIME_NODE     = fieldNode('_time');
export const _NOTES_NODE    = fieldNode('_notes');
export const _RUN_TYPE_NODE = fieldNode('_runType');
export const _RANK_NODE     = fieldNode('_rank');
```

```ts
// catalog/internal-fields.edges.ts — unchanged from commit 5
edge(_DATE_NODE.id,     'IS_INTERNAL_FIELD'),
// …
```

For pending facets:

```ts
// catalog/user-text-fields.edges.ts — new (commit covering _notes CSV escape)
edge(_NOTES_NODE.id, 'IS_USER_TEXT'),

// catalog/null-sentinels.edges.ts — new (covers _rank's empty-string-as-null)
edge(_RANK_NODE.id, 'HAS_NULL_SENTINEL', ''),
// no companion tag

// _rank tournament-only: NO tag, NO marker edge — the existing
// CONDITIONAL_ON edge is the structural fact:
edge(_RANK_NODE.id, 'CONDITIONAL_ON', ENUM_RUN_TYPE__TOURNAMENT_NODE.id),
```

**Engine surface.** No change today. `Node.tags` stays in
`types.ts` (deleting it is a larger refactor) but is *unused* in the
catalog from this point forward. A future cleanup commit can remove the
field if it stays empty for the rest of the epic.

**Consumer impact.** Two assertions in
`catalog/fields.nodes.test.ts` rewrite to call
`graph.isInternalField(node)` instead of `node.tags?.includes('internal')`.
That's the entire diff. No production code touches tags today.

**Tradeoffs.**
- *Discoverability:* (–) The node-declaration line no longer tells the
  reader "this is internal" — they have to follow the underscore-prefix
  convention OR look at the edges file. **Mitigation:** the underscore
  prefix is already the load-bearing visual signal (and it's enforced by
  the spec's "internal fields must start with `_`" invariant from §11.5
  test 2), and the edges file is one wildcard import away in the same
  catalog. Net: small loss, recoverable via tooling.
- *Refactor-safety:* (+) One source of truth. Renaming "internal" to
  "app-metadata" later is a one-edge-type rename, not a tag-rename + edge-
  rename + invariant-test-update.
- *Query expressiveness:* (=) Same. Both forms support
  `graph.isInternalField(field)` and `graph.internalFields()`.
- *Build-time invariant strength:* (++) Marker edges have cardinality
  enforcement (`'one'` — declared twice = build error). Tags are a
  free-for-all array; nothing prevents `tags: ['internal', 'internal']`
  or a typo'd `'intrnal'`. Removing the tag dimension removes a class
  of silent drift.
- *AI-friendliness:* (=) About the same. AI authoring a new internal
  field follows the catalog template: `fieldNode('_X')` + an edge in
  `internal-fields.edges.ts`. No tag to forget.

**Future-proofness for commits 6–14.** Each new facet earns its own
edge type or terminal edge. We get four new edge types
(`IS_USER_TEXT`, `HAS_NULL_SENTINEL`, …) over the rest of the epic.
That's consistent with the trajectory commit 5b is meant to address —
the engine API gets wider, but it gets wider with *named, queryable,
cardinality-enforced* primitives instead of free-form tags. If commit
5b chooses Option A (per-edge query modules) or Option B (sub-API
namespaces), each new edge type slots cleanly into one of those
shapes. The tag axis is a parallel, less-disciplined surface that
would have to be folded into the API decision separately.

---

### Option 2 — Drop the edge, keep the tag

Push everything to tags. `IS_INTERNAL_FIELD` is deleted from the edge
taxonomy. The engine grows a generic `nodesWithTag(tag: string)` and
`hasTag(node, tag: string)` accessor.

**Catalog declarations.**

```ts
// catalog/fields.nodes.ts — tag is the structural truth
export const _DATE_NODE  = fieldNode('_date',  { tags: ['internal'] });
// …
export const _RANK_NODE  = fieldNode('_rank',  { tags: ['internal', 'tournament-only', 'nullable-empty-string'] });
export const _NOTES_NODE = fieldNode('_notes', { tags: ['internal', 'user-text'] });
```

`internal-fields.edges.ts` deletes its `IS_INTERNAL_FIELD` lines and
keeps only `HAS_CSV_HEADER` (which has no tag analogue — it's a
value, not a flag).

**Engine surface.**

```ts
// field-graph.ts
nodesWithTag(tag: string): readonly Node[] {
  return this.nodes.filter((n) => n.tags?.includes(tag));
}

hasTag(field: FieldRef, tag: string): boolean {
  const node = this.byId.get(toId(field));
  return node?.tags?.includes(tag) ?? false;
}

// Convenience wrappers for the existing API surface
internalFields(): readonly string[] {
  return this.nodesWithTag('internal').map((n) => n.id);
}

isInternalField(field: FieldRef): boolean {
  return this.hasTag(field, 'internal');
}
```

**Consumer impact.** Same — the public methods preserve their
signatures. Only the engine internals change.

**Tradeoffs.**
- *Discoverability:* (+) Reading the node declaration tells you every
  facet at once. No need to cross-reference an edges file.
- *Refactor-safety:* (––) Tags are stringly-typed. Renaming
  `'tournament-only'` → `'requires-tournament'` is a project-wide
  string find-and-replace with no compile-time checks. Marker edges
  pass through the `EdgeType` union — the compiler catches every
  consumer.
- *Query expressiveness:* (–) Tags can't carry payloads. The existing
  `RENAMED_FROM` edge has a payload (`legacyKey`, `atSchema`). The
  pending `IS_DERIVED_FROM` edge has a `deriver` payload. If
  "tournament-only" ever wanted to say *which* enum value it depends
  on, we'd be back to inventing a parallel namespace
  (`'tournament-only:enum:runType.tournament'` as a magic string). The
  edge already has the `to` slot for that.
- *Build-time invariant strength:* (––) No cardinality enforcement.
  No source-kind check (a tag on a Section is fine; a misplaced
  `IS_INTERNAL_FIELD` from a Section is a build error). No target-kind
  check.
- *AI-friendliness:* (–) Tags are open-set. AI authoring a new field
  has to either know the tag vocabulary or invent one. AI authoring
  with edges has the `EdgeType` union as a hard constraint and the
  builder's per-type validation as a fail-loud check.

**Future-proofness.** Tags scale freely in the small (just append a
string) and badly in the large. By commit 14, `_rank` would carry
`['internal', 'tournament-only', 'nullable-empty-string']` and someone
will inevitably typo one. We have no `enum-sync.invariant.test.ts`
for the tag vocabulary.

---

### Option 3 — Keep both, define a discipline

The §11.1 stance, made explicit. Articulate when each is appropriate.

The strongest version of this discipline I can defend:

> **Use a tag when ALL of the following hold:**
>
> 1. The fact is a binary boolean (no payload, no value).
> 2. No engine method ever needs to enumerate "give me all nodes with
>    this fact" — the fact is only ever inspected once you already
>    have the node in hand.
> 3. The fact has no structural enforcement value (no cardinality
>    constraint, no source/target kind check, no invariant test that
>    couldn't be expressed against the underscore-prefix convention or
>    similar lexical rule).
> 4. The fact is unambiguously local to the node — it doesn't relate
>    the node to another node, schema, or value.
>
> **Use an edge otherwise.**

**Catalog declarations.** Per the discipline, `'internal'` fails (1)
trivially but fails (2) hard — every commit that touches internal
fields enumerates them (CSV exporter, internal-field validator,
duplicate detector). So `'internal'` should have been an edge from
day one. The marker edge is the right home.

`'tournament-only'`, `'user-text'`, `'nullable-empty-string'` all
fail (4) — they're conditions or formats that relate the field to
something else (an enum value, a CSV escape policy, an empty-string
sentinel). Edges.

**Result.** Apply the discipline rigorously and the tag column is
empty. Discipline matches Option 1 in practice.

**The honest case where a tag survives.** I tried hard to construct
a tag that survives the discipline at our scale. Candidates:

- `'experimental'` / `'beta'` — but these *are* enumerated (filter
  bars, debug overlays).
- `'deprecated'` — `REPLACED_BY` edge already covers this with more
  expressiveness.
- `'pending_classification'` (mentioned in `field-graph-for-ai.md`)
  — the carve-out for orphan fields without a section. Today it
  isn't enumerated (it's an exception in an invariant test) but if
  we ever wanted "show pending fields in a coverage view" the tag
  flips to needing enumeration. Same trap.
- A debug-only `'verbose'` or a doc-only `'do-not-rename'` — these
  are real "node-local, no enumeration" facts. But the second I
  type the example I want to write a test that asserts "no field
  declared `'do-not-rename'` was renamed in this commit," which
  enumerates.

The pattern: **once a fact exists, somebody is going to want to
enumerate it.** The discipline's condition (2) is the one that
trips every candidate over time. The right call is to plan for
enumeration up-front, which means an edge.

**Tradeoffs.**
- The discipline is *correct* — it cleanly distinguishes the two
  representations on principle.
- The discipline is *also vacuous* at our scale because almost
  every fact about a field eventually gets enumerated. We end up
  in the same place as Option 1 with extra documentation overhead.

**Future-proofness.** Stable in principle, vacuous in practice. The
risk is that contributors apply the discipline naively (tag because
"binary fact, today nobody enumerates it") and we accumulate tags
that need to be migrated to edges later when the enumeration call
site appears. That's a future refactor cost we're paying to avoid
a current refactor cost (writing an edge declaration). Bad trade.

---

### Option 4 — Generalize: tags-as-edges

Subsume both representations under one. Introduce a `HAS_TAG` (or
`HAS_FACET`) terminal-string edge. Every binary facet is a `HAS_TAG`
edge with the tag value as the terminal string.

```ts
// catalog/fields.nodes.ts — no tags ever, anywhere
export const _DATE_NODE     = fieldNode('_date');
export const _NOTES_NODE    = fieldNode('_notes');
export const _RANK_NODE     = fieldNode('_rank');

// catalog/facets.edges.ts (or distributed across feature edges files)
edge(_DATE_NODE.id,     'HAS_TAG', 'internal'),
edge(_NOTES_NODE.id,    'HAS_TAG', 'internal'),
edge(_NOTES_NODE.id,    'HAS_TAG', 'user-text'),
edge(_RANK_NODE.id,     'HAS_TAG', 'internal'),
edge(_RANK_NODE.id,     'HAS_TAG', 'tournament-only'),
edge(_RANK_NODE.id,     'HAS_TAG', 'nullable-empty-string'),
```

`Node.tags` is removed from `types.ts` entirely.

**Engine surface.**

```ts
hasTag(field: FieldRef, tag: string): boolean
nodesWithTag(tag: string): readonly Node[]
tagsOf(field: FieldRef): readonly string[]
```

Plus the existing `internalFields()` / `isInternalField()` become
sugar over `nodesWithTag('internal')` / `hasTag(node, 'internal')`.

**Tradeoffs.**
- *Uniformity:* (++) One axis. The "tag vs edge" question disappears
  by construction.
- *Refactor-safety vs Option 1:* (–) The tag string `'internal'` is
  still stringly-typed in the edge declaration. Compared to a
  named edge type `IS_INTERNAL_FIELD` in the `EdgeType` union, this
  loses compile-time discovery: `EdgeType` is a union the IDE can
  list; the set of tag strings is not a typed primitive.
- *Query expressiveness:* (=) Same as Option 1, but the engine
  surface gets a generic `nodesWithTag` instead of a domain-named
  `internalFields`.
- *Build-time invariant strength:* (=) Better than Option 2 (we get
  the edge builder's checks: source-kind validation, dedup
  diagnostics) but worse than Option 1 (no per-tag cardinality
  control — `HAS_TAG` is `'many'` by definition, so `_date` could
  carry `'internal'` twice unless we add a custom invariant).
- *Discoverability:* (–) The `EdgeType` union loses a row that named
  the concept (`IS_INTERNAL_FIELD`). Reading the union, "what kinds
  of relationships are in this graph" is no longer self-documenting
  — half the relationships hide inside `HAS_TAG` payloads.

**Future-proofness.** Scales mechanically. Adding a new facet is one
line. But the API revisit (commit 5b) is harder: per-edge query
modules and sub-API namespaces both depend on edge types as the
unit of organization. If half of the conceptual edges are
indistinguishable `HAS_TAG`s, that organization principle weakens.

**The right read.** Option 4 is what Option 1 *becomes* if we keep
adding marker edges and notice that ten of them all have the same
shape. We're not at ten yet — we have one (`IS_INTERNAL_FIELD`) and
two-or-three planned (`IS_USER_TEXT`, etc.). Premature
generalization. Reconsider after commit 14 if the marker-edge
column is dense enough to warrant collapsing.

---

### Option 5 — Generalize the other way: kinds, not tags

Spec §11.1 explicitly considered and rejected this:

> The instinct is to introduce a new `kind: 'InternalField'` node
> type. I think that's wrong for this codebase. The node kind
> answers "what *is* this thing?" The edge answers "what *role*
> does it play?" An internal field is still a field …
> Introducing a new kind would force every query to either branch
> on kind (`graph.nodesOfType('Field') + graph.nodesOfType('InternalField')`)
> or accept that half the existing invariants silently skip
> internal fields. That's worse than a tag + edge combo.

**Has the rejection still held?** Yes — for `'internal'` specifically
it's stronger now than it was when §11.1 was written. The current
catalog and engine treat `'_runType'` as a `Field` node end-to-end:
`fields.nodes.test.ts` invariants enumerate it; `field-graph.ts`
methods like `acceptedValuesFor(_RUN_TYPE_NODE)` work on it as a
Field; the bijection test against `supportedFields.json` would have
to be split into two checks. Splitting `Field` into `Field` and
`InternalField` would be a bigger refactor than anything else
under consideration.

**Is the rejection portable to other facets?** Mostly yes. None of
`'tournament-only'`, `'user-text'`, `'nullable-empty-string'`
describe what a field *is* — they describe how it behaves under
specific conditions. Kinds aren't the right primitive for any of
them either.

**Verdict.** Option 5 stays rejected. Mentioned only for
completeness.

---

## 3. Trade-off matrix

Scored 1–5 (5 = best). Not weighted.

| | 1: drop tag | 2: drop edge | 3: discipline | 4: tags-as-edges | 5: kinds |
|---|---|---|---|---|---|
| Refactor safety (rename "internal") | 5 | 1 | 3 | 3 | 5 |
| Build-time drift resistance | 5 | 1 | 3 | 3 | 5 |
| Query expressiveness | 5 | 3 | 4 | 5 | 4 |
| API surface clarity | 4 | 3 | 3 | 4 | 2 |
| Discoverability at the declaration site | 3 | 5 | 4 | 2 | 4 |
| Migration cost from today | **5** | 3 | 4 | 1 | 1 |
| Scale to commits 6–14 facets | 5 | 2 | 3 | 4 | 1 |
| Composability with commit 5b ADR | 5 | 2 | 3 | 3 | 2 |
| Avoidance of "AI slop" two-axis rep | 5 | 4 | 2 | 5 | 5 |
| **Total** | **42** | 24 | 29 | 30 | 29 |

Option 1 wins on every dimension that the team has explicitly
prioritized in CLAUDE.md (refactor safety, build-time invariants,
"each change should leave the codebase in a better state, not create
one-off patterns"). Option 4 (tags-as-edges) is the natural follow-on
*after* we have enough marker edges to motivate the collapse — it's
what 1 ages into, not a competitor to it today.

## 4. Recommendation

**Adopt Option 1.** Concretely:

1. **Delete the `'internal'` tag from the five internal field
   declarations** in `src/shared/domain/field-graph/catalog/fields.nodes.ts`:

   ```ts
   // Before
   export const _DATE_NODE = fieldNode('_date', { tags: ['internal'] });
   // After
   export const _DATE_NODE = fieldNode('_date');
   ```

   Apply to all five (`_date`, `_time`, `_notes`, `_runType`, `_rank`).

2. **Rewrite the two tag-using assertions** in
   `src/shared/domain/field-graph/catalog/fields.nodes.test.ts` to use
   the engine method instead. The current pair:

   ```ts
   it('internal fields (underscore-prefixed) carry the "internal" tag', () => {
     const misTagged = FIELD_NODES.filter((n) => n.id.startsWith('_'))
       .filter((n) => !n.tags?.includes('internal'))
       .map((n) => n.id);
     expect(misTagged).toEqual([]);
   });

   it('non-internal fields do not carry the "internal" tag', () => {
     const misTagged = FIELD_NODES.filter((n) => !n.id.startsWith('_'))
       .filter((n) => n.tags?.includes('internal'))
       .map((n) => n.id);
     expect(misTagged).toEqual([]);
   });
   ```

   becomes:

   ```ts
   it('every underscore-prefixed field has IS_INTERNAL_FIELD edge', () => {
     const graph = buildGraph();
     const missing = FIELD_NODES.filter((n) => n.id.startsWith('_'))
       .filter((n) => !graph.isInternalField(n))
       .map((n) => n.id);
     expect(missing).toEqual([]);
   });

   it('only underscore-prefixed fields have IS_INTERNAL_FIELD edge', () => {
     const graph = buildGraph();
     const wrong = FIELD_NODES.filter((n) => !n.id.startsWith('_'))
       .filter((n) => graph.isInternalField(n))
       .map((n) => n.id);
     expect(wrong).toEqual([]);
   });
   ```

   The two-way invariant (underscore-prefix ↔ IS_INTERNAL_FIELD edge)
   moves from "tag and prefix must agree" to "edge and prefix must
   agree." This is the same invariant the spec §11.5 test 1 asks for,
   stripped of its tag dependency.

3. **Leave `Node.tags` in `types.ts` as-is for now.** Removing it is
   a typed-API change that touches the node interface; better to do
   it as a small dedicated commit (or fold into commit 5b's ADR,
   which is touching the engine surface anyway). The catalog stops
   *populating* `tags`; the field stays optional and unused. This is
   a "delete-when-quiet" half-step that costs nothing.

4. **Establish the going-forward discipline in
   [`field-graph-for-ai.md`](./field-graph-for-ai.md).** A short
   addition under "Critical invariants":

   > **Don't introduce node `tag`s.** Every facet of a field is a
   > queryable structural fact. Encode it as a marker edge (binary,
   > no payload), a terminal-string edge (carries a value), or a
   > between-nodes edge (relates one thing to another). Tags are an
   > anti-pattern at our scale — they're unenforced, untyped, and
   > cannot evolve. If a tag feels right, the question is "which
   > edge type expresses this?", not "which tag string?"

5. **For the pending facets, plan their representation now:**
   - `_rank`'s "tournament-only" → covered by `_RANK_NODE
     CONDITIONAL_ON ENUM_RUN_TYPE__TOURNAMENT_NODE` in commit 13. No
     new facet needed.
   - `_notes`'s "user-text" → introduce when the CSV exporter cutover
     needs it (commit 5b candidate or a follow-on commit). Encode as
     either `IS_USER_TEXT` marker edge OR fold into the data-type
     vocabulary (`HAS_DATA_TYPE 'user-text'`) — decide as part of
     commit 8's data-type taxonomy.
   - `_rank`'s "nullable-empty-string" → spec §11.4 gotcha 8 already
     flags `HAS_NULL_SENTINEL` to terminal `''` as the structured
     option. Take it. Slot it into commit 8 (data-types) or 14
     (validation).

### Why opinionated about commit 5 specifically

The honest argument for "land in commit 5b instead":
- 5b is the API revisit; touching tag-vs-edge logic during 5 makes
  5's diff bigger.
- Removing `Node.tags` from `types.ts` is a node-shape change and
  belongs in 5b.

The argument for landing in 5 anyway (which I take):
- The tag deletion is **five lines** in `fields.nodes.ts` and **two
  test rewrites**. It's smaller than a typical commit-5 diff hunk.
- The smell exists *because* commit 5 introduced the edge that
  makes the tag redundant. The same vertical slice that creates the
  duplication should resolve it; otherwise the smell crosses a PR
  boundary unnecessarily.
- The tag cleanup unblocks a clean restatement of spec §11.5 test 1
  ("every internal field has IS_INTERNAL_FIELD edge"), which is
  itself part of the commit-5 done-list.
- Leaving `Node.tags` in `types.ts` (point 3 above) means the typed-
  API surface is unchanged — commit 5b still has full freedom.
- Commit 16 (suppression sweep) is for *escape hatches*, not
  cleanup. Putting this in 16 invents a new category of work for
  that commit and undermines its ledger discipline.

### What we accept by taking this trade

- We lose the ability to read "is this internal?" off the node
  declaration line. The information moves one file over to
  `internal-fields.edges.ts`. We accept this because (a) the
  underscore prefix on the id (`_date`, `_runType`) carries the
  same visual cue, (b) `internal-fields.edges.ts` is in the same
  catalog directory and `import * as`-aggregated, and (c) the
  invariant test makes the two-way binding explicit and
  fail-loud.
- We commit to "edges first" as a default. Future contributors
  cannot reach for a tag as an escape hatch when an edge type
  feels heavy. This is intentional. The cost of a one-edge-type
  declaration is small; the cost of a tag debt is ongoing.

## 5. Impact on adjacent commits

### Commit 5 (the active commit) — minimal diff

| File | Change | LOC |
|---|---|---|
| `src/shared/domain/field-graph/catalog/fields.nodes.ts` | Remove `{ tags: ['internal'] }` from the 5 internal-field declarations | 5 lines edited |
| `src/shared/domain/field-graph/catalog/fields.nodes.test.ts` | Rewrite the two tag-using assertions to use `graph.isInternalField` | ~15 lines edited |
| `src/shared/domain/field-graph/catalog/fields.nodes.ts` (header comment) | Remove the line "Internal fields carry the `'internal'` tag (spec §11.1)" — replace with a note about the IS_INTERNAL_FIELD edge being the structural contract | 2 lines edited |
| `docs/field-graph/field-graph-for-ai.md` | Add the "Don't introduce node `tag`s" guideline under critical invariants | ~6 lines added |
| `docs/field-graph/architecture/11-internal-app-fields.md` | Add a 2026-04-25 footnote to §11.1 noting the tag side was retired in favor of the edge after commit 5 shipped | ~4 lines added |
| `docs/field-graph/Notes-and-findings.md` | Append cross-commit note: tag axis retired; `'tournament-only'`, `'user-text'`, `'nullable-empty-string'` will all use edges per the new discipline | ~2 lines added |

Net: ~30 lines across six files. No production code touches tags
today, so no consumer rewrite is needed.

### Commit 5b (API revisit) — gain a cleaner constraint

The ADR's job is to pick among (A) per-edge query modules, (B) sub-
API namespaces, (C) plugin/registry, (D) status quo + lint cap.
Each option is organized around *edge types* as the unit of
grouping. With the tag axis retired, every fact about a field is
already an edge — no parallel surface to fold into the ADR.
Specifically:

- (A) per-edge query modules: each `*.edges.ts` ships its
  `*.queries.ts`. No tag-query module needed.
- (B) sub-API namespaces: `graph.internal.*` covers
  `IS_INTERNAL_FIELD` and `HAS_CSV_HEADER` cleanly. No
  `graph.tags.*` namespace polluting the surface.

If we *don't* retire tags, every ADR option has to either ignore
tags (leaving them on the engine root surface as a leaky exception)
or carve out a `graph.tags.*` sub-surface that's syntactically
parallel to but semantically weaker than the edge-type sub-surfaces.

The 5b ADR can additionally include the `Node.tags` field-removal
from `types.ts` as a closing item. By the time 5b lands, the
catalog has zero tag references; deleting the `tags` property is a
noop for everything except the test file from step 2 above (already
fixed) and any speculative `tags` reference in the engine
(`Grep tags` shows two — both in node-shape declarations and one
in a builder helper; all three are safe to remove).

### Commit 6 (BELONGS_TO_SECTION) — no impact

Section membership has no relationship to tags. Independent.

### Commit 7 (IS_SOURCE_OF + breakdown deletion) — no impact

`HAS_COLOR` migration moves color from a hand-authored palette to
edges on field nodes; nothing about that touches tags.

### Commit 8 (HAS_DATA_TYPE) — opportunity, not requirement

If `'user-text'` ends up as a data-type literal alongside
`'number' | 'duration' | 'date' | 'string'`, this is the commit
where it lands. Otherwise, it's a marker edge introduced
independently. Either way, no tag.

### Commit 9 (IS_DERIVED_FROM) — no impact

Derivation edges already carry `deriver` payloads. Tags aren't a
representation candidate here.

### Commit 10 (RENAMED_FROM cutover) — no impact

`RENAMED_FROM` already uses payload, not tags.

### Commit 11 (schema lifecycle) — no impact

`SHIPPED_IN_SCHEMA`, `INTENTIONALLY_DROPPED_IN_SCHEMA`,
`MIGRATED_TO_SCHEMA` are all between-nodes edges. No tag candidate.

### Commit 12 (APPEARS_IN_VIEW / FILTER) — no impact

Views and filters are explicit nodes. Edges all the way.

### Commit 13 (CONDITIONAL_ON) — REPLACES the planned `'tournament-only'` tag

The Notes-and-findings entry from 2026-04-19 (commit 3) flagged
that spec §11.1 declared `_rank` with `tags: ['internal',
'tournament-only']`, but commit 3 only shipped `'internal'`. With
the tag axis retired:

- The `'tournament-only'` tag is **dropped permanently**, not
  added in commit 13.
- The structural fact ("rank is only valid when run type is
  tournament") is fully expressed by:
  ```ts
  edge(_RANK_NODE.id, 'CONDITIONAL_ON', ENUM_RUN_TYPE__TOURNAMENT_NODE.id),
  ```
- Commit 13's done-list closes the §11.1 redundancy in one direction
  (CONDITIONAL_ON exists, replacing the runtime
  `if (runType !== TOURNAMENT) clearRank()` pattern). The tag side is
  closed in commit 5 by virtue of never being added.

This removes a decision point from commit 13 ("do we add the tag
alongside the edge for redundancy, or drop it?") that was already
flagged as TBD.

### Commit 14 (IS_REQUIRED_IN, PARTICIPATES_IN_COMPOSITE_KEY) — possibly absorbs `'nullable-empty-string'`

Validation needs to distinguish "absent" from "null sentinel". This
is the natural commit to introduce `HAS_NULL_SENTINEL` if we
haven't already done it in commit 8 (data-types). Either way, edge
not tag.

### Commit 15 (dissonance) — clean

The spec's worked example (`architecture/12-extending-with-a-new-run-type-and-sub-category.md`)
uses tags lightly. With the discipline, the new
`_dissonanceSubCategory` field declaration is:

```ts
export const _DISSONANCE_SUB_CATEGORY_NODE = fieldNode('_dissonanceSubCategory');
```

— no tags. The `IS_INTERNAL_FIELD`, `HAS_CSV_HEADER`, `ACCEPTS_VALUE`,
`CONDITIONAL_ON`, `IS_DERIVED_FROM`, and view/filter membership all
land as edges per their respective commits' patterns. The dissonance
slice ends up as the cleanest demonstration of "edges all the way
down" because it inherits the discipline rather than carrying tag
debt forward.

### Commit 16 (suppression sweep) — small audit only

Verify `Node.tags` is unreferenced in the catalog. Optionally remove
the field from `types.ts` if the ADR in 5b deferred it. No production
code change.

## 6. Anticipated objections

### "Tags are documentation."

The argument: a `tags: ['internal']` line at the declaration site
is self-documenting; readers grok the field's role at a glance.

The counter: the underscore prefix on the id (`_date`, `_runType`)
already carries the documentation. The catalog is grouped under a
`─── Internal app-fields ───` comment-bar header. The
`internal-fields.edges.ts` filename is itself documentation. The
*compiler* checks that internal fields have the IS_INTERNAL_FIELD
edge via the rewritten test. Three layers of documentation already
exist; the tag is the fourth and the only one that's unenforceable.

### "What if a future facet really is local-only?"

The argument: if we ban tags categorically, we'll regret it the day
we want to mark a field with a one-off comment-style flag.

The counter: that's what `payload` is for on the `Node` interface —
it carries arbitrary `Readonly<Record<string, unknown>>`. If you
have node-local debug metadata, put it in payload. If you have a
fact other code needs to query, you've just answered "edge."

### "Spec §11.1 said both. Are we overruling the spec?"

Yes, with rationale. Spec §11.1 was written before any of the
edge types shipped, and explicitly grounded its "tag and edge"
recommendation on "section 10's invariant tests" that referenced
the tag side. Section 10 has not shipped (commit 16 is the
suppression sweep, not the invariant library). The tag side of
the §11.1 recommendation has no live consumer. This doc adds an
implementation footnote to §11.1 noting the empirical revision.

The architecture spec stays the source of truth on *what concepts
exist*; this exploration revises *which representation we choose*
based on a year of catalog implementation experience that the
spec didn't have at write-time.

### "Removing `Node.tags` later is a typed-API ripple."

Acknowledged. This doc explicitly defers that removal to a future
commit (5b or 16) so the immediate change is six files of small
diffs. The interface stays compatible; only the catalog stops
populating it.

## 7. Open questions (deferred)

These don't block the recommendation; flagging for the human's
attention.

- **Is `'pending_classification'` a tag or an edge?**
  `field-graph-for-ai.md` references it under the BELONGS_TO_SECTION
  invariant carve-out. With the discipline, it's a marker edge
  (`IS_PENDING_CLASSIFICATION`) — but neither has shipped yet, and
  the invariant carve-out is also illustrative-not-real until
  some commit creates the situation. Track for the day it becomes
  load-bearing.

- **`HAS_DATA_TYPE` vs marker edges for type-shape facets.** Commit
  8's data-type vocabulary will need to decide: is `'user-text'`
  a data type alongside `'number' | 'duration' | 'date' | 'string'`,
  or a separate `IS_USER_TEXT` marker on top of `HAS_DATA_TYPE
  'string'`? Different ergonomic trade-off; orthogonal to the
  tag-vs-edge discipline.

- **When does Option 4 (tags-as-edges) reactivate?** If commits 6–14
  introduce ten marker edges all of the form
  `IS_X / sourceKind: 'Field' / targetKind: 'none' / cardinality: 'one'`,
  collapsing them into a generic `HAS_FACET` edge becomes worthwhile.
  Threshold guess: ~6+. We're at 1. Revisit at commit 14 close-out.

- **`Node.tags` removal.** Worth doing in 5b vs 16 vs never? Answer
  depends on whether the ADR in 5b changes node shape for other
  reasons. Track on 5b's open-questions list.

---

## Appendix: a 30-second worked diff for the recommended change

```diff
--- a/src/shared/domain/field-graph/catalog/fields.nodes.ts
+++ b/src/shared/domain/field-graph/catalog/fields.nodes.ts
@@ -10,9 +10,9 @@
 // `docs/field-graph/architecture/08-clarifying-the-mental-model.md` §8.1 for
 // the node shape.
 //
-// Internal fields carry the `'internal'` tag (spec §11.1). They are `Field`
-// nodes, not a separate node kind — the tag + an `IS_INTERNAL_FIELD` edge
-// (declared in commit 5) together express their distinct role.
+// Internal fields are `Field` nodes (not a separate node kind). Their
+// distinct role is declared structurally via the `IS_INTERNAL_FIELD` edge
+// (commit 5). See `EXPLORATION-tag-vs-edge.md` for why the parallel
+// `tag` axis was retired.
 //
 // Naming convention: `<SECTION>__<FIELD>_NODE` (double-underscore section/
 // field separator). Internal fields preserve their leading `_`. See
@@ -22,11 +22,11 @@
 // ─── Internal app-fields ─────────────────────────────────────────────────
 // See architecture/11-internal-app-fields.md.

-export const _DATE_NODE = fieldNode('_date', { tags: ['internal'] });
-export const _TIME_NODE = fieldNode('_time', { tags: ['internal'] });
-export const _NOTES_NODE = fieldNode('_notes', { tags: ['internal'] });
-export const _RUN_TYPE_NODE = fieldNode('_runType', { tags: ['internal'] });
-export const _RANK_NODE = fieldNode('_rank', { tags: ['internal'] });
+export const _DATE_NODE = fieldNode('_date');
+export const _TIME_NODE = fieldNode('_time');
+export const _NOTES_NODE = fieldNode('_notes');
+export const _RUN_TYPE_NODE = fieldNode('_runType');
+export const _RANK_NODE = fieldNode('_rank');
```

```diff
--- a/src/shared/domain/field-graph/catalog/fields.nodes.test.ts
+++ b/src/shared/domain/field-graph/catalog/fields.nodes.test.ts
@@ -54,18 +54,21 @@
   it('every declared field node has kind Field', () => {
     const wrongKind = FIELD_NODES.filter((n) => n.kind !== 'Field');
     expect(wrongKind.map((n) => `${n.id} (kind=${n.kind})`)).toEqual([]);
   });

-  it('internal fields (underscore-prefixed) carry the "internal" tag', () => {
-    const misTagged = FIELD_NODES.filter((n) => n.id.startsWith('_'))
-      .filter((n) => !n.tags?.includes('internal'))
-      .map((n) => n.id);
-    expect(misTagged).toEqual([]);
-  });
-
-  it('non-internal fields do not carry the "internal" tag', () => {
-    const misTagged = FIELD_NODES.filter((n) => !n.id.startsWith('_'))
-      .filter((n) => n.tags?.includes('internal'))
-      .map((n) => n.id);
-    expect(misTagged).toEqual([]);
-  });
+  // Underscore-prefixed ids and IS_INTERNAL_FIELD edges agree in both
+  // directions. The `'internal'` tag axis was retired in commit 5 — see
+  // EXPLORATION-tag-vs-edge.md.
+
+  it('every underscore-prefixed field has an IS_INTERNAL_FIELD edge', () => {
+    const graph = buildGraph();
+    const missing = FIELD_NODES.filter((n) => n.id.startsWith('_'))
+      .filter((n) => !graph.isInternalField(n))
+      .map((n) => n.id);
+    expect(missing).toEqual([]);
+  });
+
+  it('only underscore-prefixed fields have an IS_INTERNAL_FIELD edge', () => {
+    const graph = buildGraph();
+    const wrong = FIELD_NODES.filter((n) => !n.id.startsWith('_'))
+      .filter((n) => graph.isInternalField(n))
+      .map((n) => n.id);
+    expect(wrong).toEqual([]);
+  });
```

That's the entire production diff. The catalog gets simpler, the
tests get a real engine consumer instead of a tag-introspection,
and the discipline is captured in the comment + the new
`field-graph-for-ai.md` guideline. Ship in commit 5.
