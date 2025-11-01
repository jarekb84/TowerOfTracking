# Core Engineering Standards

**Purpose**: Define fundamental patterns and quality standards that ALL agents must follow.

## File Organization Principles

**CRITICAL**: Maintain hierarchical, feature-based file organization. Fight entropy through progressive refinement.

### Quick Reference: Feature-Based Organization

**Always organize by FEATURE/CAPABILITY, never by file type:**

```bash
# ✅ GOOD - Feature-based
features/data-import/
  manual-entry/
    manual-entry-form.tsx
    use-manual-entry.ts
    validation-logic.ts
    validation-logic.test.ts

# ❌ BAD - Type-based
features/data-import/
  components/
  hooks/
  logic/
```

**Key Rules:**
- **Co-locate**: Keep component + hook + logic + tests together in same directory
- **3-File Rule**: 3+ files sharing a concept → create subdirectory (`filters/`, `validation/`, `preview/`)
- **10-File Threshold**: Directory with 10+ implementation files (excluding tests) → evaluate for sub-grouping
- **Descriptive Names**: Use feature names (`filters/`, `input/`, `preview/`) NOT type names (`components/`, `hooks/`, `utils/`)

See detailed guidance below for complete file organization standards.

### Core Organization Doctrine

#### Feature-Based Architecture (NOT Type-Based)

**Principles:**

- Organize code by business features/concepts, NEVER by file types
- Group related files together: components, hooks, logic, types, tests
- Directory names reflect purpose/feature, NOT file types

**Examples:**

- ✅ **Good**: `tier-trends/`, `filters/`, `table/`, `mobile/`, `config/`
- ❌ **Bad**: `components/`, `hooks/`, `utils/`, `helpers/`, `misc/`

#### Co-location by Feature

All files related to a concept MUST be in the same directory or organized subdirectory:

- Component files (`*.tsx`)
- Associated hooks (`use*.ts`, `use*.tsx`)
- Logic/business rules (`*.ts`)
- Type definitions (`types.ts`, `*.types.ts`)
- Utilities specific to that feature
- Test files colocated with implementation (same directory as source file, or `__tests__/` subdirectory)
- Styles (if applicable)

**Import Flow (Within Feature):** `*.tsx → use*.ts → *.ts` (pure functions)

### Progressive Directory Creation Triggers

**MANDATORY EVALUATION RULES:**

#### 10-File Threshold (CRITICAL)

When a directory reaches **10+ implementation files** (excluding tests):

- **ACTION**: MUST evaluate for sub-grouping
- **COUNT ONLY**: `*.tsx`, `*.ts` (non-test)
- **EXCLUDE**: `*.test.ts`, `*.test.tsx`, `*.integration.test.tsx`, `__tests__/` directories
- **SCOPE**: Per-directory, not recursive (subdirectories count separately)
- **ENFORCEMENT**: Architecture Review Agent MUST flag violations in every review

#### 3-File Rule

When 3+ files share a clear concept:

- **ACTION**: Strongly consider creating subdirectory
- **EXAMPLES**:
  - 3 filter-related files → create `filters/` subdirectory
  - 3 mobile-specific files → create `mobile/` subdirectory

#### Cohesion Test

If you can name the group with a feature/concept (not a type):

- ✅ **Good**: `filters/` (concept), `table/` (feature), `config/` (purpose)
- ❌ **Bad**: `components/` (type), `utils/` (vague), `helpers/` (unclear)

#### Single-File Exception

- DON'T create subdirectory for single file
- Wait until 2-3 related files exist before creating subdirectory

### Directory Organization Examples

#### ✅ GOOD: Feature-Based Hierarchy

```bash
features/analytics/
├── tier-trends/                    # Feature-level grouping
│   ├── tier-trends-analysis.tsx    # Main component
│   ├── use-tier-trends-view-state.ts
│   │
│   ├── filters/                    # Sub-feature grouping (5 files)
│   │   ├── tier-trends-filters.tsx
│   │   ├── tier-trends-controls.tsx
│   │   ├── field-search.tsx
│   │   └── use-field-filter.ts
│   │
│   ├── table/                      # Sub-feature grouping (4 files)
│   │   ├── tier-trends-table.tsx
│   │   ├── virtualized-trends-table.tsx
│   │   └── column-header-renderer.ts
│   │
│   ├── mobile/                     # Sub-feature grouping (3 files)
│   │   ├── tier-trends-mobile-card.tsx
│   │   ├── use-tier-trends-mobile.ts
│   │   └── tier-trends-mobile-utils.ts
│   │
│   ├── filters/
│   │   ├── tier-trends-filters.tsx
│   │   ├── tier-trends-controls.tsx
│   │   ├── field-search.tsx
│   │   ├── use-field-filter.ts
│   │   └── aggregation-options.ts     # Logic co-located with filter feature
│   │
│   └── calculations/                   # NOT "logic" - specific purpose!
│       ├── tier-trends-calculations.ts # Core calculation engine
│       ├── aggregation-strategies.ts
│       └── hourly-rate-calculations.ts
```

**Why This Works:**

- ✅ All tier-trends files in one place (22 files organized into 5 subdirectories)
- ✅ Each subdirectory has <10 implementation files (excluding tests)
- ✅ Related files colocated (component + hook + logic together)
- ✅ Clear navigation: "I need to modify filters" → `filters/` subdirectory

#### ❌ BAD: Type-Based, Flat Structure

```bash
features/data-tracking/
├── components/ (38 files)    # ❌ Too many files, unclear grouping
├── hooks/ (27 files)          # ❌ Separated from components
├── logic/ (16 files)          # ❌ Separated from hooks
└── utils/ (20+ files)         # ❌ Unclear what's related to what
```

**Why This Fails:**

- ❌ Poor discoverability: Must navigate 4+ directories for single feature
- ❌ Flat structure: 38 files at same level, no conceptual grouping
- ❌ Scattered related code: Component separated from its hook and logic
- ❌ Unclear boundaries: Can't see where one feature ends and another begins

### Naming Conventions

**Directory Names:**

- Use lowercase with hyphens: `tier-trends/`, `data-import/`, `csv-export/`
- Reflect feature/concept, NOT file type
- Be specific: `filters/` not `filtering-stuff/`, `table/` not `table-components/`

**File Names:**

- **Components**: `feature-name.tsx` (e.g., `tier-trends-filters.tsx`)
- **Hooks**: `use-feature-name.ts` (e.g., `use-tier-filter.ts`)
- **Logic**: `feature-name-logic.ts` or descriptive name (e.g., `tier-trends-calculations.ts`)
- **Types**: `types.ts` or `feature-name.types.ts`
- **Tests**: Same name with `.test.ts` or `.test.tsx` extension

### Shared Code Guidelines

**Feature-Specific Shared:**

- **Location**: `src/features/<feature>/shared/`
- **Purpose**: Code shared within a single feature domain
- **Example**: `src/features/analytics/shared/formatting/chart-formatters.ts`
- **CRITICAL**: Even within `shared/`, organize by PURPOSE not by type
  - ✅ GOOD: `shared/formatting/`, `shared/parsing/`, `shared/filtering/`
  - ❌ BAD: `shared/utils/`, `shared/helpers/`, `shared/logic/`

**Cross-Feature Shared:**

- **Location**: `src/shared/<domain>/`
- **Purpose**: Code truly reusable across multiple features
- **Example**: `src/shared/formatting/number-formatters.ts`
- **CRITICAL**: Organize by domain/purpose, NEVER by file type
  - ✅ GOOD: `shared/formatting/`, `shared/validation/`, `shared/ui-components/`
  - ❌ BAD: `shared/utils/`, `shared/helpers/`, `shared/common/`

**CRITICAL**: Don't prematurely extract to shared. Keep in feature until actively used by 2+ distinct features (not just "might be useful someday").

### Migration Strategy

**Boy Scout Rule Application:**

- When touching a file, reorganize its immediate relatives
- Move related hook + logic + types together
- Update imports in the same PR
- DON'T reorganize unrelated files

**Incremental Approach:**

- NO big-bang refactoring
- Changes happen naturally during feature work
- Only reorganize files touched or closely related to current work
- Each PR improves structure slightly

**Example Incremental Migration:**

```typescript
// Working on tier-trends filters:

// BEFORE (scattered):
components/tier-trends-filters.tsx
hooks/use-field-filter.ts
components/field-search.tsx

// AFTER (colocated):
analytics/tier-trends/filters/
├── tier-trends-filters.tsx
├── field-search.tsx
└── use-field-filter.ts
```

### Anti-Patterns to Avoid

**FORBIDDEN PATTERNS:**

- ❌ **Type-based separation** at feature level (components/, hooks/, logic/)
  - **Including `logic/` directories** - this is type-based organization!
  - Pure functions are STILL part of features - co-locate with consumers
  - Question: "Is this pure?" → Put in logic/ ❌
  - Correct: "What does this serve?" → Put with that feature ✅

- ❌ **Generic dumping grounds** (utils/, helpers/, misc/, common/, logic/)
  - Exception: If you can name it by PURPOSE (e.g., `calculations/`, `formatting/`, `parsing/`)
  - But even then, prefer co-locating with the feature that uses it

- ❌ **Over-nesting** (directories with single files or unnecessary hierarchy)
- ❌ **Unclear boundaries** (mixing unrelated features in same directory)
- ❌ **Premature abstraction** (creating directories for potential future files)
- ❌ **Big-bang refactoring** (reorganizing entire codebase at once)
- ❌ **Vague names** (misc/, helpers/, common/ without clear domain context)
- ❌ **Separating tightly coupled files** (component + its hook in different directories)
- ❌ **Over-nesting** (>4 levels: src/features/domain/feature/sub-feature is max depth)

## TypeScript Standards

**Type Organization**:
- Use descriptive interface/type names with clear business domain language

## Component Architecture & React Separation

**CRITICAL**: Enforce strict logic-presentation separation in all React code.

**Component Layer (*.tsx)**:
- **Ultra-thin**: DOM/JSX markup ONLY
- Event handlers must be one-liners delegating to hook callbacks
- **Hard limit: 200 lines** - extract sub-components when exceeded
- NO business logic, validation, transforms, or complex branching
- Import only: same-feature hooks (`use*.ts`), types, presentational helpers

**Hook Layer (use*.ts)**:
- React state/effects/context orchestration
- Delegate transforms/validation/calculation to pure functions (`*.ts`)
- Handle React-specific needs: state, effects, context consumption
- NO JSX (React imports allowed for hooks/effects)
- **CRITICAL**: Hook tests MUST use `.tsx` extension for React Testing Library compatibility

**Logic Layer (*.ts)**:
- Pure, deterministic functions: transforms, validation, calculation, mapping, parsing
- Small, composable, fully unit-tested functions
- **MUST NOT** import React or testing libraries
- Single responsibility per function

**Import Flow**: `*.tsx → use*.ts → *.ts` (within feature)

**Testing Requirements**:
- **~100% coverage** for all `.ts` logic files
- **~100% coverage** for hook orchestration code (`use*.test.tsx` files)
- **One happy-path** integration test per page (not exhaustive UI variants)
- **React Hook Testing**: Use `renderHook()` from `@testing-library/react`, `act()` for state updates
- **Realistic Mock Data**: Test with data matching actual TypeScript interfaces

**Boy-Scout Rule**: When touching any mixed-concern component, extract at least one logic chunk into hooks or pure functions with tests.

