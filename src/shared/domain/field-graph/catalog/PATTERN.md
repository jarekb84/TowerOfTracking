# Pattern: catalog structure — nodes vs edges

The field-graph catalog has two kinds of declarations: **nodes** (the things)
and **edges** (the relationships and facts about them). This file decides
which goes where. **Read this before adding a new piece of catalog
metadata** — adding facts in the wrong shape is the most common way to
introduce drift between the graph and the rest of the codebase.

If you're adding an *instance* of an existing edge concept, you don't need
this file — see [`edges/PATTERN.md`](./edges/PATTERN.md) for the per-concept
directory pattern. If you're adding a brand-new fact about a Field (or
contemplating a `Node` shape change), this file is the gate.

## Nodes — what they are

A node is a thing: a Field, a Section, a Category, a View, a Schema, an
EnumValue. Every node has the shape:

```ts
interface Node {
  readonly id: string;          // unique across all kinds
  readonly kind: NodeKind;      // 'Field' | 'Section' | 'Category' | 'View' | 'Schema' | 'EnumValue'
  readonly payload?: Readonly<Record<string, unknown>>;  // see "Node.payload" below
}
```

That is the **entire** node surface. Nodes are deliberately sparse —
identity, kind, optional opaque payload. Every other fact about a node
lives on an outgoing or incoming edge.

Node declarations live in `catalog/<kind>.nodes.ts` files (flat at the
catalog root). One file per kind (`fields.nodes.ts`, `sections.nodes.ts`,
…). Each declaration is a named `*_NODE` export (see
[`EXPLORATION-node-identity-abc-deep-dive.md`](../../../../../../docs/field-graph/EXPLORATION-node-identity-abc-deep-dive.md)).

## Edges — what they are

An edge is a typed fact: who, what relationship, optionally to which other
node or terminal string, with optional payload. Every edge has the shape:

```ts
interface Edge {
  readonly type: EdgeType;
  readonly from: string;        // source node id
  readonly to?: string;         // target node id, terminal string, or absent (marker edges)
  readonly payload?: Readonly<Record<string, unknown>>;
}
```

Edges live in `catalog/edges/<concept>/<concept>.edges.ts`. The per-concept
directory pattern is documented separately in
[`edges/PATTERN.md`](./edges/PATTERN.md) — read that for "how to add a new
edge concept folder."

## The four-question litmus — edge or node property?

When you discover a new fact you want to record about a Field (or any
node), apply this checklist. **Pass any one of the four → edge. Fail all
four → candidate for `Node.payload`.** No other home is legitimate.

1. **Does any consumer query "find me every node where this fact is X"?**
   Cross-cutting queries are why the graph exists. If a UI, a parser, an
   aggregator ever has to enumerate "all fields that …", the fact belongs
   on an edge — `graph.edgesOfType(...)` is indexed; node-property
   iteration via `graph.nodesOfKind(...)` works but routes around the
   indexing surface.

2. **Is the fact the relationship to another named node** — a Section, an
   EnumValue, another Field, a Schema, a View? **If yes → edge, no
   exceptions.** Properties can hold an id string, but only edges preserve
   target-identity refactor-safety: the engine validates that the target
   node is declared, the IDE rename catches uses, and dangling edges
   throw at build time. A property pointing at another node by id has
   none of that.

3. **Does the fact drive consumer behavior** — parser dispatch, formatter
   dispatch, validator branching, UI rendering? Behavior-driving facts
   become structural contracts when they're edges (build-time validation
   via `EDGE_META.cardinality`). The
   [`tag-vs-edge` ADR](../../../../../../docs/field-graph/EXPLORATION-tag-vs-edge.md)
   established this principle: tags were retired because every fact a
   consumer queries should be a structural contract, not a free-form
   string on a node.

4. **Would absence of an explicit declaration constitute a bug?** If yes
   → edge with `cardinality: 'at-least-one'` (or `'one'` plus a paired
   invariant test against the production catalog). The engine's
   `'at-least-one'` cardinality fails the build when a source node lacks
   the required edge — properties default silently and let bugs through.

If all four answers are "no" — no consumer queries it; it doesn't relate
to another node; it doesn't drive behavior; absence is fine — then
`Node.payload` is the home. As of today, **`Node.payload` has zero
consumers in the catalog.** That's a healthy state, not a missing
feature. The carve-out exists; we have not needed it.

### Worked applications of the litmus

| Concept | Q1 query? | Q2 to-node? | Q3 behavior? | Q4 absence-bug? | Verdict |
|---|---|---|---|---|---|
| `IS_OF_TYPE` (data type) | yes (parser/exporter dispatch table) | no (terminal) | yes (parser, exporter, formatter) | yes (every Field needs one) | edge (`'at-least-one'` semantic; `'one'` + invariant test for fixture pragmatism — see commit 8) |
| `IS_INTERNAL_FIELD` | yes (`internalFields()` enumerates) | no (marker) | yes (CSV column ordering) | no (most fields legitimately don't have it) | edge (`cardinality: 'one'`) |
| `BELONGS_TO_SECTION` | yes (run-details enumerates per section) | yes (Section node) | yes (UI grouping) | yes (every field belongs somewhere) | edge by Q2 alone |
| `ACCEPTS_VALUE` | yes (filter enumerates) | yes (EnumValue node) | yes (form validation, filter UI) | no (only enum fields) | edge by Q2 alone |
| `HAS_CSV_HEADER` | yes (csv-exporter looks up per field) | no (terminal) | yes (CSV header rendering) | no (override only) | edge (`cardinality: 'one'`, override) |
| `RENAMED_FROM` | yes (parser resolves legacy keys) | no (payload-only) | yes (parser dispatch) | no (only renamed fields) | edge |
| `SHIPPED_IN_SCHEMA` (planned commit 11) | yes (lifecycle queries) | yes (Schema node) | yes (migration gate) | yes (every field has a shipping schema) | edge by Q2 alone |
| `PARTICIPATES_IN_COMPOSITE_KEY` (planned commit 14) | yes (duplicate-detection enumerates) | no (terminal — composite-key scope) | yes (composite key construction) | no (opt-in) | edge |

The litmus reproduces every prior structural decision the codebase has
arrived at. If you ever apply it and it disagrees with the rest of the
catalog, **the litmus is wrong** (open a follow-up to the
[`EXPLORATION-data-type-edge-vs-property.md`](../../../../../../docs/field-graph/EXPLORATION-data-type-edge-vs-property.md)
ADR) — don't override it case-by-case.

### What about facts that "apply to everything"?

Universality is the *weakest* signal, not the strongest. Every Field
declares `IS_OF_TYPE`; every Field will eventually declare
`BELONGS_TO_SECTION`, `APPEARS_IN_VIEW`, `IS_REQUIRED_IN`, etc. — all
edges, all universal. Universality maps to `'at-least-one'` cardinality
on the edge, **not** to a `Node` property.

The reasoning: even a universal fact still benefits from indexed-edge
query primitives, build-time invariant enforcement, and the per-concept
directory pattern. Promoting it to a property gains nothing structurally
and loses the build-time enforcement.

## `Node.payload` — the carve-out (currently empty)

`Node.payload` exists for facts that pass *none* of the four litmus
questions. By design that's a thin slice: node-local debug metadata that
no consumer queries and no behavior depends on. Today no node carries a
non-empty payload.

If you find yourself reaching for `Node.payload`, double-check the
litmus. It's almost always wrong — the case where a fact about a node
truly satisfies "no consumer queries it, no behavior depends on it"
rarely justifies adding it to the catalog at all.

## `Node` shape evolution — when (not) to extend

If you think you need a typed `Node` property — a discriminated-union
split (`FieldNode` vs `SectionNode` etc.) or a new optional field on
`Node` — pause and re-apply the litmus. The
[`EXPLORATION-data-type-edge-vs-property.md`](../../../../../../docs/field-graph/EXPLORATION-data-type-edge-vs-property.md)
ADR rejected this path for `dataType` (the most universal, most-queried
field-level fact) on principle: edges win on cross-cutting query
ergonomics, build-time invariant enforcement, and conformance with the
declarative-only `Node` shape established in
[`EXPLORATION-node-identity-abc-deep-dive.md`](../../../../../../docs/field-graph/EXPLORATION-node-identity-abc-deep-dive.md).

Open the ADR question with a fresh exploration doc before extending
`Node`. The bar is high.

## How edges map to consumer queries

Each edge concept has a query module under
`catalog/edges/<concept>/<concept>.queries.ts` exposing one or more
single-purpose query functions. Consumers import the singleton-bound
wrapper from the top barrel (`@/shared/domain/field-graph`), not the raw
query module:

```ts
import { dataTypeOf, fieldsInSection, sourcesOf } from '@/shared/domain/field-graph';
```

The engine class (`FieldGraph`) exposes only primitives
(`edgesFrom`, `edgesTo`, `edgesOfType`, `nodesOfKind`, `terminalOf`,
`getField`, `resolveFieldByAnyKey`, `toId`); domain queries live in the
per-concept modules. See
[`edges/PATTERN.md`](./edges/PATTERN.md) for the full pattern.

## What does NOT belong in this catalog

- **TypeScript types that exist purely for compile-time use.** `RunType`
  enum, `RunTypeValue` union — those live with their domain (e.g.
  `shared/domain/run-types/types.ts`). The graph reads from them
  (`RUN_TYPE_VALUES` is the source of truth for `_runType ACCEPTS_VALUE`
  edges); the catalog doesn't redeclare them.
- **Runtime computed state.** Filter selections, sort order, UI toggles
  belong in component / context state, not the graph.
- **Math.** Aggregations still compute sums/means/groupings the same way.
  The graph tells you WHICH fields to aggregate, not HOW.

## Anti-patterns

- **Adding a property to `Node` instead of an edge.** Re-apply the
  four-question litmus; the answer is almost always "edge."
- **Putting a non-empty payload on a node to dodge the edge layer.** If
  any consumer reads it, it should be an edge.
- **Declaring two facts on the same target with overlapping semantics.**
  The `tags: ['internal']` + `IS_INTERNAL_FIELD` edge duplication retired
  in commit 5b is the canonical example of why this fails.
- **Defaulting silently in consumers.** If "fall back to `'number'` when
  there's no edge" feels right at a consumer site, the catalog is
  missing a declaration. Add the edge; don't default.

## Appendix — pattern history

The pattern was shaped across the migration epic. Read these only if
you want to *evolve* the pattern (not when adding a new instance):

- [`EXPLORATION-data-type-edge-vs-property.md`](../../../../../../docs/field-graph/EXPLORATION-data-type-edge-vs-property.md) —
  established the four-question litmus and the "edges over node
  properties" doctrine; case study is `IS_OF_TYPE`.
- [`EXPLORATION-tag-vs-edge.md`](../../../../../../docs/field-graph/EXPLORATION-tag-vs-edge.md) —
  retired `Node.tags`; the principle "every fact a consumer queries
  should be an edge" originated here.
- [`EXPLORATION-node-identity-abc-deep-dive.md`](../../../../../../docs/field-graph/EXPLORATION-node-identity-abc-deep-dive.md) —
  fixed the `Node` shape (named `*_NODE` exports, `FieldRef = string |
  Node` polymorphic input). Any change to `Node` rubs against this ADR.
- [`EXPLORATION-engine-api-shape.md`](../../../../../../docs/field-graph/EXPLORATION-engine-api-shape.md) —
  per-concept query modules, Style 2 singleton-bound consumer
  ergonomics. Closes the engine class for new methods.
- [`EPIC-migration.md`](../../../../../../docs/field-graph/EPIC-migration.md) —
  the broader migration epic that introduces edge concepts incrementally.

When you do evolve the pattern, update **this file first**, spawn a
fresh `EXPLORATION-*.md` capturing the question + options + decision,
and add its link to the appendix above.
