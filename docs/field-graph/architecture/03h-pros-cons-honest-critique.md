# 3h. Pros, cons, honest critique

> Part of the Field Graph Architecture spec.
> [< Prev: 3g. Concrete code samples](./03g-concrete-code-samples.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3i. When this wins / loses >](./03i-when-this-wins-loses.md)

---

_Part of §3 (Evaluation). See [3a](./03a-adding-a-new-v29-field.md) for the parent intro._

**Pros**

- **Relationships are first-class.** Every relationship the user described — source-of, derived-from, renamed-from, appears-in-view, shares-label — has a dedicated edge type. No more hand-maintained arrays that encode a relationship implicitly.
- **Discoverability is a query.** `graph.describe(field)` returns everything about a field in one call. For humans, `npm run graph:describe` does the same at the terminal.
- **Rename safety.** Rename history is walkable. The current hand-authored `V2_TO_V3_FIELD_MAP` becomes a derived view over `RENAMED_FROM` edges. Multi-hop renames (V2 → V3 → V4) work without any additional code.
- **Structural invariants replace pairwise invariants.** Instead of "coin-sources.ts must agree with supportedFields.json must agree with section-config.ts," the test is "every Field node has exactly one BELONGS_TO_SECTION edge." One assertion covers every file-pair the old system maintained.
- **Graph visualization.** The Mermaid/DOT output is real debugging value that no other approach offers cheaply.
- **Unifies migrations, display, derivation, grouping.** They all live in the same substrate. Adding a new kind of relationship is one new entry in the edge discriminated union plus one new query method.

**Cons**

- **Learning curve.** "Which edge do I use?" is a real question. A new contributor who wants to add `coins_dragonBreath` has to know that `IS_SOURCE_OF` exists, that `BELONGS_TO_SECTION` exists, that `HAS_COLOR` is an edge and not a property. Good naming and good docs help, but there is an unavoidable onboarding step.
- **Edge proliferation.** Each new kind of relationship adds a case to the union, a method to the query API, and an invariant test. Over two years, the taxonomy could grow to 20+ edge types. At some point the graph becomes harder to reason about than the files it replaced.
- **Runtime cost.** Every query walks an index. Aggressive memoization keeps this fast, but the cost is real — especially for chart code that calls `graph.colorOf(fieldName)` in a render loop. Solution: pre-compute a flat lookup table once at module load, export it alongside the query API, let hot paths use the flat table.
- **The "graph database in a dict" problem.** At some point you are reinventing a graph DB in TypeScript. If the edge count grows past ~2000 and you start wanting path queries, transitive closures, aggregation, you will hit the limits of this hand-rolled implementation. At that point the question is: port to [cozo](https://github.com/cozodb/cozo) / [DuckDB](https://duckdb.org/) in-browser, or admit that the problem was never big enough to justify the graph in the first place.
- **Over-engineering risk.** If the relationships were always simple — a field belongs to one section, has one color, has one total — then a flat manifest (approach 2) or algorithmic derivation (approach 6) does the job with a fraction of the setup cost. The graph pays off only when relationships are the dominant axis of change.
- **Debugging is different.** `console.log(COIN_FIELDS)` showed you the answer. `console.log(graph.sourcesOf('battleReport_coinsEarned'))` shows the answer only if the graph built successfully. A bad edge declaration can produce confusing empty arrays rather than loud errors. Mitigation: strict `constructor` validation that errors on dangling edges at startup.

**Is this a graph DB in disguise?**

Honestly, yes. The question is whether the scale and query complexity justify tool support. Back-of-envelope for this app: ~150 field nodes, ~10 section nodes, ~15 view nodes, ~200 rename edges, ~50 source edges, ~150 display-name edges, ~150 color edges, ~400 appears-in-view edges. Total: ~1000 edges, maybe doubles to ~2000 over three years. That is well within "index and walk in memory with no measurable cost." The line is crossed if and when: (a) the graph needs to answer transitive or path queries (e.g., "find all fields reachable from X via any combination of edges"), (b) the graph is queried by non-code consumers, (c) the graph has cycles that need cycle-detection as part of normal queries. None of those look close for this app.

---

> [< Prev: 3g. Concrete code samples](./03g-concrete-code-samples.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3i. When this wins / loses >](./03i-when-this-wins-loses.md)
