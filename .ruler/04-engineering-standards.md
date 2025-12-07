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
