# Core Engineering Standards

## File Organization (High-Level)

**Principle**: Organize by FEATURE, never by file type.

```bash
# ✅ GOOD - Feature-based, co-located
features/tier-trends/
  filters/
    tier-trends-filters.tsx
    use-field-filter.ts
    aggregation-options.ts

# ❌ BAD - Type-based, scattered
features/tier-trends/
  components/
  hooks/
  utils/
```

**Key Rules**:
- Co-locate component + hook + logic + tests together
- 3+ related files → create subdirectory by concept name
- 10+ files in directory → must evaluate for sub-grouping
- Directory names describe purpose (`filters/`, `calculations/`), not file type (`utils/`, `logic/`)

**Detailed enforcement is handled by the Code Organization & Naming Agent**, which runs after every implementation. Focus on the high-level principle during implementation.

## React Separation

Components must be thin presentation shells. Import flow: `*.tsx → use*.ts → *.ts`

- **Components (*.tsx)**: DOM/JSX only, 200-line limit
- **Hooks (use*.ts)**: State/effects orchestration
- **Logic (*.ts)**: Pure functions, no React imports, fully tested

See `.ruler/06-react-separation.md` for complete standards.

## Type Co-Location

Types follow the same feature-based organization:
- Single file usage → inline in that file
- Feature-specific → `features/<feature>/types.ts`
- Shared (3+ features) → `shared/types/<domain>.types.ts`

## Pattern definition files (`PATTERN.md`)

When you introduce a new code-organization pattern that future contributors are expected to replicate (e.g. per-concept subdirectories under a feature root, a stamp-out shape for new instances of an abstraction), drop a `PATTERN.md` at the locality of the pattern — usually the directory holding instances of it.

`PATTERN.md` describes:
- **What the pattern is**: file-naming convention, directory shape, the "instance shape" future contributors stamp out.
- **How to add a new instance**: a step-by-step checklist, no design rationale.
- **What does NOT belong**: the anti-patterns and common-mistake list.
- **Appendix — pattern history**: links to `EXPLORATION-*.md` / decision docs / prior epics that drove the design. Useful only when *evolving* the pattern, not when stamping out an instance.

Three readers, three needs:
- **Pattern user** (consumer of an instance): doesn't read `PATTERN.md`. Reads function names + types.
- **Instance maker** (adding a new instance): reads `PATTERN.md`'s "How to add" checklist. Done.
- **Pattern designer** (evolving the pattern): reads the appendix, then updates `PATTERN.md` *first*, then captures the new design as a fresh `EXPLORATION-*.md` linked from the appendix.

**Comments inside instance files do NOT regurgitate `PATTERN.md`**. Instance-file comments cover only what's non-obvious to a reader of *that specific file* (e.g. "declaration order is load-bearing — drives column ordering"). Don't reference design history, exploration docs, or prior commits inside instance files; those references belong in `PATTERN.md`'s appendix.

When asked to add a new instance of an existing pattern, search for `PATTERN.md` at or above the relevant directory before scaffolding files.

Existing `PATTERN.md` examples:
- `src/shared/domain/field-graph/catalog/edges/PATTERN.md` — per-concept directories holding edge declarations, queries, and tests.
