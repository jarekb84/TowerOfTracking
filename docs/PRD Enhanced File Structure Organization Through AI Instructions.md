# PRD: Enhanced File Structure Organization Through AI Instructions

## Executive Summary
Update existing AI instructions in `.ruler/` and `.claude/agents/` directories to promote hierarchical, feature-based file organization rather than the current flat, type-based structure. The goal is to achieve better code organization through incremental, organic refactoring during regular development work.

## Problem Statement

### Current State

The `src/features/data-tracking/` directory currently contains **81+ files** organized by **type** (components/, hooks/, logic/, utils/, types/) rather than by **feature/concept**. This creates several critical issues:

1. **Poor discoverability**: To understand a single feature (e.g., "Tier Trends"), you must navigate across 5+ directories
2. **Flat structure**: `components/` contains 38 files at the same level with no clear grouping
3. **Scattered related code**: Files that work together are separated by file type rather than grouped by purpose
4. **Unclear boundaries**: Hard to see where one feature ends and another begins

#### Current Directory Counts
```
src/features/data-tracking/
├── components/     38 files (+ 2 subdirectories: runs-table/, tier-trends-table/)
├── hooks/          27 files
├── logic/          16 files
├── utils/          ~20+ files
├── types/          ~10+ files
└── integration/    ~5 files
```

### Concrete Examples of Current Problems

#### Example 1: Tier Trends Feature
**Current State** - Files scattered across 4 directories:

- **Components** (10 files): tier-trends-analysis.tsx, tier-trends-controls.tsx, tier-trends-filters.tsx, tier-trends-mobile-card.tsx, tier-trends-summary.tsx, tier-trends-table.tsx, tier-trends-empty-state.tsx, plus subdirectory
- **Hooks** (4 files): use-tier-trends-mobile.ts, use-tier-trends-view-state.ts (+ tests)
- **Logic** (4 files): tier-trends-display.ts, tier-trends-ui-options.ts (+ tests)
- **Utils** (4 files): tier-trends.ts, tier-trends-mobile.ts (+ tests)

**Developer Experience Problem**: To modify filter behavior, developer must:
1. Find tier-trends-filters.tsx in components/
2. Navigate to hooks/ for use-field-filter.ts
3. Check logic/ for tier-trends-ui-options.ts
4. Verify utils/ for tier-trends.ts

**Total**: **22 files across 4 directories** for a single feature.

#### Example 2: Tier Stats Feature
**Current State** - Files scattered across 5 directories:

- **Components** (3 files): tier-stats-cell-tooltip.tsx, tier-stats-config-panel.tsx, tier-stats-table.tsx
- **Hooks** (3 files): use-dynamic-tier-stats-table.ts, use-tier-stats-config.tsx (+ test)
- **Logic** (2 files): tier-stats-aggregation-options.ts (+ test)
- **Utils** (10 files): tier-stats-calculator.ts, tier-stats-cell-styles.ts, tier-stats-config.ts, tier-stats-persistence.ts, tier-stats-sort.ts (+ tests)
- **Types** (1 file): tier-stats-config.types.ts

**Total**: **18 files across 5 directories** for a single table feature.

#### Example 3: Data Input/Import Feature
**Current State** - Files scattered across 3 directories:

- **Components** (11 files): data-input.tsx, data-input-actions-section.tsx, data-input-datetime-section.tsx, data-input-error-boundary.tsx, data-input-preview.tsx, global-data-input-provider.tsx, csv-import.tsx, csv-export.tsx, csv-export-dialog-sections.tsx (+ tests)
- **Hooks** (5 files): use-data-input-form.ts, use-file-import.ts, use-global-data-input.ts, use-csv-export.ts (+ test)
- **Utils** (6 files): csv-exporter.ts, csv-export-helpers.ts, csv-parser-bulk-export.test.ts, data-input-state.ts (+ tests)

**Total**: **22 files across 3 directories** for data import/export functionality.

#### Example 4: Runs Table Feature
**Current State** - Partially grouped but still flat:

- **components/runs-table/** (28 files in one directory): base-runs-table.tsx, expandable-table-row.tsx, farming-runs-table.tsx, farming-table-columns.tsx, field-display-config.ts, field-rendering-utils.ts, milestone-runs-table.tsx, milestone-table-columns.tsx, run-card.tsx, run-card-utils.ts, run-details.tsx, scrollable-table-container.tsx, tabbed-runs-table.tsx, table-action-buttons.tsx, table-columns.tsx, table-empty-state.tsx, table-head.tsx, table-header.tsx, tier-filter.tsx, tier-filter-logic.ts, tournament-runs-table.tsx, tournament-table-columns.tsx, use-tier-filter.ts, virtualized-table-body.tsx (+ tests)

**Issue**: 28 files in one directory - better than scattered, but still flat with no sub-grouping by concept.

### Desired State
- **Hierarchical organization**: Related files grouped into conceptual directories
- **Feature-based colocation**: Components, hooks, logic, and types for a feature live together
- **Progressive refinement**: Natural evolution from flat to hierarchical as features grow
- **Clear navigation**: Directory structure reveals application architecture at a glance

## Goals & Objectives

### Primary Goals
1. Modify AI instructions to promote feature-based file organization
2. Implement automatic triggers for reorganization (when directory exceeds 10 implementation files, excluding tests)
3. Enable incremental migration through "boy scout rule" approach
4. Maintain existing quality standards while improving structure

### Success Metrics
- Reduction in average files per directory from 20+ to <10 implementation files (excluding tests)
- Increase in feature-cohesive directories (all related files together)
- Improved developer onboarding through clearer structure
- Zero dedicated "refactoring-only" PRs required

## Requirements

### Functional Requirements

#### 1. File Organization Principles

**Colocation by Feature/Concept**:
- All files related to a concept should be in the same directory:
  - Component files (.tsx)
  - Associated hooks (use*.ts, use*.tsx)
  - Logic/business rules (*.ts)
  - Type definitions (types.ts, *.types.ts)
  - Utilities specific to that feature (*.ts)
  - Test files colocated with implementation
  - Styles (if applicable)

**Progressive Directory Creation Triggers**:
- When adding file #10+ (excluding tests) to a directory → **MUST** evaluate for sub-grouping
- When 3+ files share a clear concept → consider creating subdirectory
- When component grows complex → extract with all related files

**Naming Conventions**:
- Directory names should reflect the feature/concept, not the file type
- Good: `tier-trends/`, `data-import/`, `filters/`, `table/`, `mobile/`
- Bad: `components/`, `hooks/`, `utils/`, `helpers/`

#### 2. Migration Strategy

**Boy Scout Rule**: When modifying files, reorganize related files in same PR
**Incremental Approach**: No big-bang refactoring, changes happen naturally during feature work
**Scope Limiting**: Only reorganize files touched or closely related to current work

#### 3. Detailed Proposed Structure

### Recommended Top-Level Features

```
src/features/
├── game-runs/                    # Viewing and displaying game run data
├── data-import/                  # Adding new runs (manual input, CSV, bulk)
├── data-export/                  # Exporting data (CSV, bulk export)
├── analysis/                     # All charts and analysis views (statistical analysis, not observability)
├── settings/                     # App settings (theme, data management)
├── navigation/                   # (already exists)
└── theming/                      # (already exists)
```

### Feature 1: `src/features/analysis/`

**Purpose**: All statistical analysis and visualization features

**Note on Naming**: "Analysis" is used instead of "analytics" to avoid confusion with observability/monitoring tools (Google Analytics, New Relic, DataDog). This feature focuses on statistical analysis and visualization of game data, not application monitoring.

```
src/features/analysis/
├── tier-trends/                          # Tier Trends analysis feature
│   ├── tier-trends-analysis.tsx          # Main component
│   ├── tier-trends-analysis.test.tsx
│   ├── use-tier-trends-view-state.ts     # State management hook
│   ├── use-tier-trends-view-state.test.tsx
│   │
│   ├── filters/                          # Filter controls sub-feature
│   │   ├── tier-trends-filters.tsx       # Filter UI component
│   │   ├── tier-trends-controls.tsx      # Additional controls
│   │   ├── tier-trends-controls.test.tsx
│   │   └── field-search.tsx              # Reusable search component
│   │
│   ├── table/                            # Results table sub-feature
│   │   ├── tier-trends-table.tsx         # Main table component
│   │   ├── virtualized-trends-table.tsx  # Virtualization logic
│   │   ├── column-header-renderer.ts     # Column rendering logic
│   │   ├── column-header-renderer.test.ts
│   │   └── tier-trends-summary.tsx       # Summary row
│   │
│   ├── mobile/                           # Mobile view sub-feature
│   │   ├── tier-trends-mobile-card.tsx
│   │   ├── use-tier-trends-mobile.ts
│   │   ├── use-tier-trends-mobile.test.tsx
│   │   ├── tier-trends-mobile-utils.ts
│   │   └── tier-trends-mobile-utils.test.ts
│   │
│   ├── empty-states/                     # Empty state handling
│   │   └── tier-trends-empty-state.tsx
│   │
│   └── logic/                            # Pure business logic
│       ├── tier-trends-display.ts
│       ├── tier-trends-display.test.ts
│       ├── tier-trends-ui-options.ts
│       ├── tier-trends-ui-options.test.ts
│       ├── tier-trends-calculations.ts
│       └── tier-trends-calculations.test.ts
│
├── tier-stats/                           # Tier Stats table feature
│   ├── tier-stats-table.tsx              # Main component
│   ├── use-dynamic-tier-stats-table.ts   # State management
│   ├── types.ts                          # Feature-specific types
│   │
│   ├── config/                           # Configuration sub-feature
│   │   ├── tier-stats-config-panel.tsx
│   │   ├── use-tier-stats-config.tsx
│   │   ├── use-tier-stats-config.test.tsx
│   │   ├── tier-stats-config-utils.ts
│   │   ├── tier-stats-config-utils.test.ts
│   │   ├── tier-stats-persistence.ts
│   │   └── tier-stats-persistence.test.ts
│   │
│   ├── cells/                            # Cell rendering sub-feature
│   │   ├── tier-stats-cell-tooltip.tsx
│   │   ├── tier-stats-cell-styles.ts
│   │   └── tier-stats-cell-styles.test.ts
│   │
│   └── logic/                            # Pure business logic
│       ├── tier-stats-aggregation-options.ts
│       ├── tier-stats-aggregation-options.test.ts
│       ├── tier-stats-calculator.ts
│       ├── tier-stats-calculator.test.ts
│       ├── tier-stats-sort.ts
│       └── tier-stats-sort.test.ts
│
├── deaths-radar/                         # Deaths radar chart
│   ├── deaths-radar-chart.tsx
│   └── (related logic when extracted)
│
├── time-series/                          # Time series charts
│   ├── time-series-chart.tsx
│   ├── use-chart-navigation.ts
│   ├── use-chart-navigation.test.tsx
│   └── (related logic)
│
└── shared/                               # Shared analysis utilities
    ├── aggregation-strategies.ts
    ├── aggregation-strategies.test.ts
    ├── percentile-calculation.ts
    ├── percentile-calculation.test.ts
    ├── field-percentile-calculation.ts
    ├── field-percentile-calculation.test.ts
    ├── hourly-rate-calculations.ts
    └── hourly-rate-calculations.test.ts
```

**Benefits**:
- All analysis features grouped together
- Each feature (tier-trends, tier-stats) is self-contained
- Sub-features clearly separated (filters/, table/, mobile/, config/)
- Related files colocated (component + hook + logic)
- Shared analysis logic clearly identified

### Feature 2: `src/features/game-runs/`

**Purpose**: Viewing and managing the game runs table

```
src/features/game-runs/
├── runs-table.tsx                        # Main export/wrapper
├── runs-table-provider.tsx               # Context if needed
│
├── table/                                # Core table implementation
│   ├── base-runs-table.tsx               # Base table component
│   ├── tabbed-runs-table.tsx             # Tab wrapper (Farm/Tournament/Milestone)
│   ├── virtualized-table-body.tsx        # Virtualization logic
│   ├── scrollable-table-container.tsx    # Scroll container
│   ├── expandable-table-row.tsx          # Expandable row logic
│   └── responsive-table-behavior.integration.test.tsx
│
├── table-variants/                       # Different table types
│   ├── farming-runs-table.tsx
│   ├── farming-table-columns.tsx
│   ├── tournament-runs-table.tsx
│   ├── tournament-table-columns.tsx
│   ├── milestone-runs-table.tsx
│   └── milestone-table-columns.tsx
│
├── table-ui/                             # Table UI components
│   ├── table-header.tsx
│   ├── table-head.tsx
│   ├── table-action-buttons.tsx
│   ├── table-empty-state.tsx
│   └── table-columns.tsx                 # Column definitions
│
├── filters/                              # Filtering sub-feature
│   ├── tier-filter.tsx
│   ├── use-tier-filter.ts
│   ├── use-tier-filter.test.ts
│   ├── tier-filter-logic.ts
│   └── tier-filter-logic.test.ts
│
├── fields/                               # Field configuration & rendering
│   ├── field-display-config.ts
│   ├── field-display-config.test.ts
│   ├── field-rendering-utils.ts
│   └── field-rendering-utils.test.ts
│
├── card-view/                            # Mobile card view
│   ├── run-card.tsx
│   ├── run-card-utils.ts
│   ├── run-card-utils.test.ts
│   └── run-details.tsx
│
└── shared/                               # Shared table utilities
    └── (common utilities)
```

**Benefits**:
- 28 files organized into 7 conceptual groups
- Clear separation: table core, variants, UI, filters, fields, card view
- Each subdirectory has <10 implementation files (excluding tests)
- Easy to navigate: "I need to modify filters" → go to `filters/`

### Feature 3: `src/features/data-import/`

**Purpose**: All functionality for adding new game run data

```
src/features/data-import/
├── data-import.tsx                       # Main entry point (modal/dialog)
├── global-data-input-provider.tsx        # Global state if needed
│
├── manual-entry/                         # Manual data input sub-feature
│   ├── data-input.tsx                    # Main form component
│   ├── data-input-preview.tsx            # Preview section
│   ├── data-input-preview.test.tsx
│   ├── data-input-actions-section.tsx    # Action buttons
│   ├── data-input-datetime-section.tsx   # Date/time controls
│   ├── data-input-error-boundary.tsx
│   ├── data-input-error-boundary.test.tsx
│   ├── use-data-input-form.ts            # Form state hook
│   ├── use-global-data-input.ts
│   ├── data-input-state.ts               # State logic
│   └── data-input-state.test.ts
│
├── csv-import/                           # CSV import sub-feature
│   ├── csv-import.tsx                    # CSV import UI
│   ├── use-file-import.ts                # File handling hook
│   └── csv-parser-bulk-export.test.ts    # Parsing tests
│
├── validation/                           # Import validation
│   ├── duplicate-info.tsx                # Duplicate detection UI
│   └── (validation logic)
│
└── shared/                               # Shared import utilities
    └── (common parsing/validation)
```

**Benefits**:
- Clear separation: manual entry vs. CSV import
- All import-related code in one place
- Easy to find: "I need to add CSV validation" → `csv-import/`

### Feature 4: `src/features/data-export/`

**Purpose**: All functionality for exporting game run data

```
src/features/data-export/
├── csv-export/                           # CSV export feature
│   ├── csv-export.tsx                    # Main export dialog
│   ├── csv-export-dialog-sections.tsx    # Dialog sections
│   ├── use-csv-export.ts                 # Export hook
│   ├── use-csv-export.test.ts
│   ├── csv-exporter.ts                   # Export logic
│   ├── csv-export-helpers.ts             # Helper functions
│   └── csv-export-helpers.test.ts
│
└── bulk-export/                          # Bulk export if different
    └── (bulk export functionality)
```

**Benefits**:
- Export separated from import (different concerns)
- Easy to extend with new export formats (JSON, Excel, etc.)

### Feature 5: `src/features/settings/`

**Purpose**: Application settings and data management

```
src/features/settings/
├── data-settings/                        # Data management settings
│   ├── data-settings.tsx
│   ├── data-settings.test.tsx
│   ├── use-data-settings.ts
│   ├── use-data-settings.test.tsx
│   └── migration-alert.tsx
│
├── column-config/                        # Column configuration
│   ├── searchable-column-picker.tsx
│   ├── selected-column-item.tsx
│   ├── use-column-search.tsx
│   ├── use-column-search.test.tsx
│   ├── use-column-reorder.tsx
│   ├── use-column-reorder.test.tsx
│   └── use-field-filter.ts
│
└── shared/
    └── (common settings utilities)
```

**Benefits**:
- All settings in one place
- Easy to add new setting categories
- Clear organization by setting type

### Feature 6: Shared/Common Code

**Location**: `src/features/data-tracking/shared/` or `src/shared/`

```
src/features/data-tracking/shared/        # Shared within data-tracking domain
├── components/                           # Truly shared components
│   ├── run-type-selector.tsx
│   ├── run-type-indicator.tsx
│   ├── farming-only-indicator.tsx
│   └── data-provider.tsx                 # Global data context
│
├── hooks/                                # Shared hooks
│   ├── use-data.ts                       # Data access hook
│   ├── use-run-type-context.ts
│   ├── use-run-type-context.test.tsx
│   ├── use-runs-navigation.ts
│   └── use-runs-navigation.test.tsx
│
└── types/                                # Shared types
    └── (domain types)
```

**Benefits**:
- Clear distinction between shared and feature-specific
- Prevents duplication
- Easy to identify dependencies

### Non-Functional Requirements

#### 1. Developer Experience
- Directory structure should be self-documenting
- New developers should understand feature boundaries from file structure
- Related code should be discoverable through proximity

#### 2. Tooling Integration
- Instructions must work with Claude Code
- Support specialized agents (architecture-review, frontend-design-review)

## Implementation Details

### Files to Update

1. **`.ruler/04-engineering-standards.md`**:
   - Add "File Organization Principles" section
   - Add progressive directory creation triggers
   - Include concrete examples from this PRD

2. **`.ruler/05-development-workflow.md`**:
   - Add file reorganization to Boy Scout Rule
   - Include reorganization in Architecture Review phase
   - Add file structure analysis to mandatory review checklist

3. **`.claude/agents/architecture-review.md`**:
   - Add file structure analysis capabilities
   - Flag violations of organization principles
   - Suggest reorganization opportunities

### Progressive Reorganization Triggers

#### When to Create a Subdirectory

**3-File Rule**: When 3+ files share a clear concept (e.g., filtering logic)

**10-File Threshold**: When a directory reaches 10+ implementation files (excluding tests), **MUST** evaluate for sub-grouping

**Cohesion Test**: If you can name the group with a feature (not a type), create it

#### Examples of Good Sub-Feature Extraction

Good subdirectory candidates:
- `filters/` (tier-trends-filters.tsx + use-field-filter.ts + field-search.tsx)
- `table/` (table component + virtualization + column config)
- `mobile/` (mobile card + mobile hook + mobile utils)
- `config/` (config panel + config hook + config persistence)
- `cells/` (cell components + cell styles + cell tooltips)

Not good subdirectory candidates:
- `components/` (file type, not feature)
- `utils/` (vague, what kind of utilities?)
- `misc/` (unclear purpose)

### Migration Strategy

#### Progressive Organization Rules

1. **File count triggers**:
   - Directory with 10+ implementation files (excluding tests) → **MUST** evaluate for sub-grouping
   - 3+ files sharing a clear concept → create subdirectory
   - Single file in subdirectory → keep flat until more files added

2. **Boy Scout Rule application**:
   - When touching a file, reorganize its immediate relatives (files it imports/exports)
   - Move related hook + logic + types together
   - Update imports in the same PR

3. **Example incremental migration**:

**Step 1**: Working on tier-trends filters
```
Before:
components/tier-trends-filters.tsx
hooks/use-field-filter.ts
components/field-search.tsx

After:
analysis/tier-trends/filters/
├── tier-trends-filters.tsx
├── field-search.tsx
└── use-field-filter.ts
```

**Step 2**: Later, working on tier-trends table
```
Before:
components/tier-trends-table.tsx
components/tier-trends-table/virtualized-trends-table.tsx
logic/tier-trends-display.ts

After:
analysis/tier-trends/table/
├── tier-trends-table.tsx
├── virtualized-trends-table.tsx
├── tier-trends-display.ts
└── tier-trends-display.test.ts
```

### Case Study: Tier Trends Feature

**Before**: 22 files across 4 directories (components/, hooks/, logic/, utils/)

**Problem**: To modify the filter behavior, developer must:
1. Find tier-trends-filters.tsx in components/
2. Navigate to hooks/ for use-field-filter.ts
3. Check logic/ for tier-trends-ui-options.ts
4. Verify utils/ for tier-trends.ts

**After**: All 22 files organized into analysis/tier-trends/ with 5 subdirectories (filters/, table/, mobile/, empty-states/, logic/)

**Benefit**: To modify filter behavior, developer:
1. Navigate to analysis/tier-trends/filters/
2. All related files are immediately visible (filters.tsx, field-search.tsx, use-field-filter.ts)
3. Clear separation from table/, mobile/, logic/

## Key Principles Summary

### DO ✅
- **Group by feature/concept** (tier-trends/, tier-stats/, data-import/)
- **Colocate related files** (component + hook + logic + types together)
- **Create subdirectories for sub-features** (filters/, table/, mobile/)
- **Use descriptive directory names** (names reflect purpose, not file type)
- **Apply Boy Scout Rule** (reorganize when touching files)
- **Keep directories focused** (<10 implementation files per directory, excluding tests)

### DON'T ❌
- **Don't group by file type** (components/, hooks/, logic/ at feature level)
- **Don't create single-file directories** (wait until 2-3 related files exist)
- **Don't mix unrelated features** (keep clear boundaries)
- **Don't do big-bang refactoring** (migrate incrementally)
- **Don't separate tightly coupled files** (component + its hook should be together)
- **Don't over-nest** (3-4 levels max: feature/sub-feature/specific-component)

## Example Directory Comparison

### Current (Type-Based, Flat) ❌
```
features/data-tracking/
├── components/ (38 files) ❌ Too many, unclear grouping
├── hooks/ (27 files)      ❌ Separated from components
├── logic/ (16 files)      ❌ Separated from hooks
└── utils/ (20+ files)     ❌ Unclear what's related to what
```

### Proposed (Feature-Based, Hierarchical) ✅
```
features/
├── game-runs/             ✅ Clear feature boundary
│   ├── table/ (6 files)   ✅ Focused sub-feature
│   ├── filters/ (5 files) ✅ Related files together
│   └── card-view/ (4 files)
├── analysis/              ✅ Clear feature boundary
│   ├── tier-trends/       ✅ Self-contained feature
│   │   ├── filters/       ✅ Component + hook + logic together
│   │   ├── table/         ✅ All table code colocated
│   │   └── mobile/        ✅ Mobile variant isolated
│   └── tier-stats/        ✅ Separate feature
└── data-import/           ✅ Clear purpose
    ├── manual-entry/      ✅ Sub-feature grouping
    └── csv-import/        ✅ Sub-feature grouping
```

## Notes & Considerations

- Maintain backward compatibility with existing code
- Don't force reorganization of stable, working code
- Balance between organization and over-engineering
- Keep focus on incremental improvement over perfection
- File reorganization happens as part of feature work, not dedicated refactoring PRs

## Appendix: Anti-patterns to Avoid

1. **Type-based separation**: Don't create components/, hooks/, utils/ at feature level
2. **Over-nesting**: Avoid directories with single files
3. **Unclear boundaries**: Don't mix unrelated features in same directory
4. **Premature abstraction**: Don't create directories for potential future files
5. **Big-bang refactoring**: Don't reorganize entire codebase at once
6. **Vague names**: Avoid `misc/`, `helpers/`, `common/` without clear context

## Success Criteria

1. **New features**: Follow hierarchical structure from the start
2. **Modified features**: Apply Boy Scout Rule to reorganize touched files
3. **Architecture Review Agent**: Flags directories exceeding 10 implementation files (excluding tests)
4. **Developer feedback**: Improved onboarding and code discovery
5. **Metrics**: Average files per directory reduces from 20+ to <10 implementation files (excluding tests)
