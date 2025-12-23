<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0 (Initial ratification)

Added principles:
- I. React Separation (Mandatory)
- II. Feature-Based Organization
- III. Localization First
- IV. Testing Discipline
- V. SSR Safety
- VI. E2E Page Object Model
- VII. Simplicity & Restraint

Added sections:
- Tech Stack Requirements
- Quality Gates
- Governance

Templates requiring updates:
- .specify/templates/plan-template.md: Constitution Check section updated with principle mapping ✅
- .specify/templates/spec-template.md: No changes needed ✅
- .specify/templates/tasks-template.md: No changes needed ✅
- .specify/templates/agent-file-template.md: No changes needed ✅

Follow-up TODOs: None
==================
-->

# TowerOfTracking Constitution

## Core Principles

### I. React Separation (Mandatory)

Components MUST be thin presentation shells following the import flow: `*.tsx → use*.ts → *.ts`

- **Components (*.tsx)**: DOM/JSX only, no business logic, 200-line limit
- **Hooks (use*.ts)**: State/effects orchestration, delegates to pure functions
- **Logic (*.ts)**: Pure functions, no React imports, fully unit tested

**Rationale**: Separating presentation from logic enables isolated testing, clearer responsibilities, and prevents component bloat that obscures bugs.

### II. Feature-Based Organization

Code MUST be organized by FEATURE, not by file type. Co-locate component + hook + logic + tests together.

- Good: `features/tier-trends/filters/tier-trends-filters.tsx`
- Bad: `features/tier-trends/components/`, `/hooks/`, `/utils/`

**Rationale**: Feature colocation reduces cognitive load when working on a single capability and eliminates cross-directory navigation for related code.

### III. Localization First

Date construction and number formatting MUST use shared utilities. Direct construction is prohibited.

- **Dates**: Use `parseBattleDate()`, `formatDisplayDate()`, `formatCanonicalBattleDate()` from `src/shared/formatting/date-formatters.ts`
- **Numbers**: Use `parseShorthandNumber()`, `formatLargeNumber()` from `src/shared/formatting/number-scale.ts`
- Storage uses US-centric canonical format; display respects user locale

**Rationale**: Centralized formatting prevents locale-related bugs and ensures consistent parsing across import sources.

### IV. Testing Discipline

All code MUST achieve high test coverage with appropriate testing strategies:

- **Unit tests**: Vitest + React Testing Library for logic and hooks
- **Hook tests**: MUST use `.tsx` extension for `renderHook()`
- **E2E tests**: Playwright with Page Object Model pattern
- **Coverage target**: ~100% for logic files (`.ts`) and hooks (`use*.ts`)

**Rationale**: High coverage on business logic files catches regressions early while UI tests focus on user-visible behavior.

### V. SSR Safety

All localStorage and DOM access MUST check `typeof window !== 'undefined'` before execution.

```typescript
// Required pattern
if (typeof window !== 'undefined') {
  localStorage.setItem('key', value);
}
```

**Rationale**: TanStack Start supports SSR; unguarded browser APIs cause server-side crashes.

### VI. E2E Page Object Model

E2E tests MUST NOT access DOM directly. All selectors and interactions go through Page Objects.

- Use `data-testid` attributes for E2E selectors
- Page Objects encapsulate page-specific selectors and actions
- Tests read as user journeys, not DOM manipulations

**Rationale**: Page Object Model isolates selector changes to single locations and makes tests readable as specifications.

### VII. Simplicity & Restraint

Changes MUST be minimal and focused. Avoid over-engineering.

- Only make changes that are directly requested or clearly necessary
- Do not add features, refactor code, or make "improvements" beyond what was asked
- Do not add error handling for scenarios that cannot happen
- Do not create helpers or abstractions for one-time operations
- Three similar lines of code is better than a premature abstraction

**Rationale**: The right amount of complexity is the minimum needed for the current task.

## Tech Stack Requirements

The following technologies are mandated for this project:

| Category | Technology | Version/Notes |
|----------|------------|---------------|
| Framework | React | 19.x |
| Routing | TanStack Start/Router | File-based routing |
| Tables | TanStack Table | - |
| Styling | Tailwind CSS | v4 |
| Components | shadcn/ui | - |
| Charts | Recharts | - |
| Unit Testing | Vitest | + React Testing Library |
| E2E Testing | Playwright | Page Object Model |
| Language | TypeScript | Strict mode |

**Theme**: Dark theme with orange (#f97316) accent color.

## Quality Gates

All changes MUST pass the integration precheck before committing:

```bash
npm run integration-precheck  # Full validation: lint, type-check, unit tests, E2E
```

Individual gates:

| Gate | Command | Requirement |
|------|---------|-------------|
| Linting | `npm run lint` | Zero errors |
| Type Check | `npm run type-check` | Zero errors |
| Unit Tests | `npm run test` | All passing |
| E2E Tests | `npm run e2e` | All passing |
| Build | `npm run build` | Successful |

## Governance

This constitution supersedes all other development practices for TowerOfTracking.

### Amendment Process

1. Proposed amendments MUST be documented with rationale
2. Changes require explicit approval before implementation
3. All dependent templates and documentation MUST be updated upon amendment
4. Version number MUST be incremented according to semantic versioning:
   - **MAJOR**: Backward incompatible principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance

- All PRs and reviews MUST verify compliance with these principles
- Complexity beyond these guidelines MUST be justified in writing
- Use `CLAUDE.md` for runtime development guidance

**Version**: 1.0.0 | **Ratified**: 2025-12-23 | **Last Amended**: 2025-12-23
