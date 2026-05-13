# Pattern: per-concept edge directories

This directory holds the field-graph's edge declarations and the query
functions that read them, organized one folder per *concept*. **Read this
file before adding a new concept folder, a new edge type, or a new query.**

If you only want to *use* an existing query (e.g. to build a chart or
data-import flow), you don't need this file — see the cold-start query
index in `docs/field-graph/field-graph-for-ai.md` instead.

## What's a "concept"?

A concept is a coherent group of edge declarations + the queries that
consume them. Today's concepts:

- `internal-fields/` — `IS_INTERNAL_FIELD` + `HAS_CSV_HEADER` (the five
  app-managed metadata fields).
- `enum-values/` — `ACCEPTS_VALUE` + `HAS_STRING_VALUE` + per-enum-value
  presentation edges.
- `sections/` — `BELONGS_TO_SECTION` queries (edges land in commit 6).
- `sources/` — `IS_SOURCE_OF` queries (edges land in commit 7).
- `presentation/` — `HAS_DISPLAY_NAME` + `HAS_COLOR` (cross-source-kind
  terminal edges).

A concept usually maps to one edge type, sometimes to two or three closely
related edge types. The boundary is "files a future contributor would
expect to find next to each other when working on this concern."

## Files inside a concept folder

Each folder follows the same shape:

```
edges/<concept>/
  <concept>.edges.ts              # edge declarations (the data)
  <concept>.queries.ts            # query functions over those edges
  <concept>.queries.test.ts       # behavior tests against fixture graphs
  <concept>.invariants.test.ts    # catalog-shape tests against the production graph
```

Filenames keep both the concept prefix AND the suffix
(`internal-fields.queries.ts`, not `queries.ts`) so glob discoverability
works without resolving parent directories: `**/*.queries.ts` returns one
hit per concept with the concept name visible in the path.

Not every concept needs every file. `sections/`, `sources/`, and
`presentation/` ship queries-only today because their edges arrive in
later commits — that's fine, the queries are tested against fixture
graphs and pick up production edges when those land.

## How queries are written

Each query function takes a `FieldGraph` as its first parameter and a
`FieldRef` (`string | Node`) for any node-id parameter:

```ts
export function csvHeaderOf(graph: FieldGraph, field: FieldRef): string | undefined {
  return graph.terminalOf(field, 'HAS_CSV_HEADER');
}
```

Queries build on the engine's primitive surface only:
`graph.edgesFrom`, `graph.edgesTo`, `graph.edgesOfType`,
`graph.nodesOfKind`, `graph.terminalOf`, `graph.toId`. **Queries never
add methods to `FieldGraph` itself.**

The top-level barrel (`src/shared/domain/field-graph/index.ts`) wraps each
query in a thin singleton-bound thunk so consumers call the query
directly:

```ts
// in the barrel:
export const csvHeaderOf = (field: FieldRef) => internalFieldsQ.csvHeaderOf(appGraph(), field);

// in consumer code:
import { csvHeaderOf } from '@/shared/domain/field-graph';
csvHeaderOf(_DATE_NODE);
```

`appGraph()` is lazy — first call hydrates and caches; consumers do not
manage the singleton lifecycle.

## Two test shapes

- **`<concept>.queries.test.ts`** — *behavior*. Build a small fixture
  graph with `new FieldGraph(...)`, call queries with the explicit
  `(graph, ...)` form, assert outcomes. Verifies the query mechanism
  works regardless of catalog content.
- **`<concept>.invariants.test.ts`** — *catalog shape*. Assert that the
  production catalog satisfies certain shape constraints (e.g. "every
  internal field has a CSV header"). Uses the singleton-bound queries
  from the barrel.

A failure in `*.queries.test.ts` is a mechanism bug; a failure in
`*.invariants.test.ts` is catalog drift. Splitting by filename makes the
intent obvious.

## How to add a new concept folder

1. **Create `edges/<concept>/`** with a name that describes the concern
   (`derivations/`, `schema-lifecycle/`, `composite-key/`, …) — not the
   edge type name.
2. **Add `<concept>.edges.ts`** declaring the edge data. Import nodes
   from `../../fields.nodes` (or other `*.nodes.ts` modules under
   `catalog/`). Export a `<CONCEPT>_EDGES: readonly Edge[]` array.
3. **Register the array in `edges/index.ts`** by adding a single line to
   the `CATALOG_EDGES` concatenation and a re-export below.
4. **Add `<concept>.queries.ts`** with one exported function per
   consumer-facing question. Functions take `(graph: FieldGraph, ...)`.
   Build on the engine primitives only.
5. **Add singleton-bound wrappers to the top barrel**
   (`src/shared/domain/field-graph/index.ts`) — one line per query.
6. **Add `<concept>.queries.test.ts`** with behavior tests against a
   hand-built fixture graph.
7. **Add `<concept>.invariants.test.ts`** if the production catalog
   needs shape assertions (most concepts do).
8. **Append rows to the cold-start query index** in
   `docs/field-graph/field-graph-for-ai.md` — one per query function.

## How to add a new query to an existing concept

1. Add the function to the existing `<concept>.queries.ts`.
2. Add a singleton-bound wrapper to the top barrel.
3. Add behavior tests to the existing `<concept>.queries.test.ts`.
4. Append a row to the cold-start query index in `field-graph-for-ai.md`.

Don't add methods to `FieldGraph`. The engine class is closed for new
query methods; only its primitives are extended (rare — only when a new
query genuinely can't be expressed with the existing primitives).

## How to add a new edge type

1. Append the edge name to the `EdgeType` union in
   `src/shared/domain/field-graph/types.ts`.
2. Add an `EDGE_META` row (sourceKind, targetKind, cardinality, optional
   `symmetric`).
3. Add 2-3 invariant tests to `field-graph.test.ts` covering the new
   edge type's shape, cardinality, and any cross-edge constraints.
4. Find or create the concept folder that owns the edge. Declare the
   edges + queries + tests there.

## Cross-source-kind edges

Some edges (`HAS_DISPLAY_NAME`, `HAS_COLOR`) accept multiple source
kinds. Their queries live under a *purpose-named* folder
(`presentation/`), not split between source-kind folders.

Rule of thumb: an edge type lives with its primary source concept until
2+ source concepts use it. At that point, promote it to its own
purpose-named folder.

## What does NOT belong in this directory

- Node declarations. `*.nodes.ts` files stay flat at the catalog root
  (`catalog/categories.nodes.ts`, `catalog/sections.nodes.ts`, …).
- Engine code. `FieldGraph` and the build-time invariant validators stay
  at `src/shared/domain/field-graph/`.
- Consumer code. UI components, exporters, parsers, etc. import from
  `@/shared/domain/field-graph` (the barrel) — they never reach into
  this directory.

## Anti-patterns to avoid

- Adding domain query methods to `FieldGraph`. Engine class is closed
  for new query methods; queries live in `*.queries.ts`.
- Mixing concepts in one file. If a query reads two unrelated edge
  types, it probably belongs in the folder of the edge type it reads
  *more* of, or in a new folder.
- Bare filenames inside concept folders (`edges.ts`, `queries.ts`).
  Keep the concept prefix so glob patterns surface concept names.
- Tags on nodes. The `Node.tags` property was retired; every fact about
  a node is an edge. If you want to mark a node with a binary fact, add
  a marker edge (`targetKind: 'none'`).
- Comments inside instance files describing the pattern itself. The
  pattern definition lives here in `PATTERN.md`. Instance-file comments
  cover only what's non-obvious to a reader of that file.

## Appendix — pattern history

The pattern was designed in commit 5b. Read these only if you want to
*evolve* the pattern, not when adding a new instance:

- [`docs/field-graph/EXPLORATION-engine-api-shape.md`](../../../../../../docs/field-graph/EXPLORATION-engine-api-shape.md) —
  why per-edge query modules + singleton-bound consumer ergonomics, with
  trade-off analysis vs sub-API namespaces and plugin/registry
  alternatives.
- [`docs/field-graph/EXPLORATION-tag-vs-edge.md`](../../../../../../docs/field-graph/EXPLORATION-tag-vs-edge.md) —
  why `Node.tags` was retired in favor of edges (the rationale also
  applies to any future "should this be a tag or an edge" question).
- [`docs/field-graph/EXPLORATION-node-identity-abc-deep-dive.md`](../../../../../../docs/field-graph/EXPLORATION-node-identity-abc-deep-dive.md) —
  why named `*_NODE` exports + `FieldRef = string | Node` polymorphic
  input. Established in commit 4; this directory inherits the convention.
- [`docs/field-graph/EPIC-migration.md`](../../../../../../docs/field-graph/EPIC-migration.md) —
  the broader migration epic that introduces edge concepts incrementally.
- [`docs/field-graph/Notes-and-findings.md`](../../../../../../docs/field-graph/Notes-and-findings.md) —
  running log of cross-commit learnings.

When you do evolve the pattern, update **this file first** (so future
contributors see the new pattern, not the old one), spawn a fresh
`EXPLORATION-*.md` capturing the question + options + decision, and add
its link to the appendix above.
