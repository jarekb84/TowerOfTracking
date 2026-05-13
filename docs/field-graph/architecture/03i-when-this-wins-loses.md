# 3i. When this wins / loses

> Part of the Field Graph Architecture spec.
> [< Prev: 3h. Pros, cons, honest critique](./03h-pros-cons-honest-critique.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 4. Combinations >](./04-combinations.md)

---

_Part of §3 (Evaluation). See [3a](./03a-adding-a-new-v29-field.md) for the parent intro._

**Wins when:**
- Relationships are the dominant axis of change. Adding a V29 rename edge, a new view that queries existing fields, or a new "source of" relationship happens more often than adding a field.
- Discoverability is the top-reported pain. "Where is this field used?" is a frequent question.
- Multiple views / features overlap on the same fields with different framings (color palette, grouping, label).
- Migration history matters and needs to be walkable by tooling.

**Loses when:**
- Fields and their properties are mostly flat. Most fields have one section, one color, one total. A manifest with properties wins.
- The team is small and the learning curve of "which edge do I use" dominates.
- Derived display names and colors are enough (approach 6 — algorithmic derivation — solves 80% of the drift at 10% of the cost).
- Performance-sensitive hot paths dominate the UI, and the added indirection per color/name lookup is measurable.

---

> [< Prev: 3h. Pros, cons, honest critique](./03h-pros-cons-honest-critique.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 4. Combinations >](./04-combinations.md)
