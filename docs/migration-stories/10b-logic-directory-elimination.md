# Migration Story 10b: Logic Directory Elimination & Purpose-Based Organization

## Parent PRD Reference
- **Main PRD**: [PRD Enhanced File Structure Organization](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md)
- **File Organization Analysis**: [file-organization-analysis.md](../file-organization-analysis.md)

## Executive Summary

**Problem**: Despite completing feature-based migrations (Stories 01-10), several areas still use `logic/` directories as a dumping ground for arbitrary files, violating the core principle of organizing by **purpose/feature** rather than by **file type**. This creates the same discoverability and maintainability issues as the original `components/`, `hooks/`, `utils/` type-based organization.

**Solution**: Eliminate all `logic/` directories by co-locating logic files with the specific features/components that use them, organizing by **purpose** rather than **purity**. Apply the same principle to oversized `shared/` directories and the remaining `data-tracking/utils/` files.

**Scope**:
- 5 `logic/` directories across analysis features (~35 implementation files)
- 1 `shared/` directory in analysis (~4 implementation files)
- 1 large `utils/` directory in data-tracking (~30+ implementation files)
- AI instruction updates to prevent future `logic/` directory creation

## Context & Motivation

### Why Logic Directories Are Problematic

**The "Purity Trap":**
```bash
# ❌ CURRENT: Organized by purity (type-based thinking)
tier-trends/
├── filters/              # "Presentation stuff"
├── table/                # "Presentation stuff"
├── mobile/               # "Presentation stuff"
└── logic/                # "Pure stuff" (9 implementation files)
    ├── aggregation-strategies.ts
    ├── field-type-detection.ts
    ├── hourly-rate-calculations.ts
    ├── run-header-formatting.ts
    ├── tier-trends-calculations.ts   # Used by: table, mobile, filters
    ├── tier-trends-display.ts        # Used by: table
    ├── tier-trends-ui-options.ts     # Used by: filters
    ├── trend-indicators.ts           # Used by: table, mobile
    └── trend-value-formatting.ts     # Used by: table, mobile
```

**Problems:**
1. **Poor discoverability**: "I need to modify the table's trend indicator color" → Must search in `logic/` directory, not in `table/`
2. **Scattered related code**: Table component is in `table/`, but logic it uses is in `logic/`
3. **Unclear relationships**: Can't tell which logic files are related to which features
4. **Same anti-pattern as before**: Just like `components/`, `hooks/`, `utils/` - separating by **type** instead of **purpose**

### The Core Insight

**"Pure functions are STILL part of features."**

Just because a function is pure doesn't mean it's unrelated to a specific feature. Pure functions exist to **serve a purpose** - they transform data for a table, calculate values for filters, format output for mobile cards, etc.

**The correct question is NOT:**
- "Is this a pure function?" → Put in `logic/`
- "Is this a component?" → Put in `components/`
- "Is this a hook?" → Put in `hooks/`

**The correct question IS:**
- "What feature/capability does this serve?" → Put it with that feature
- "Which component/feature uses this?" → Co-locate with the consumer
- "What is the PURPOSE of this code?" → Name the directory after that purpose

### Examples of Purpose-Based Organization

**Example 1: Tier Trends Logic → Purpose-Based**
```bash
# ✅ BETTER: Organized by purpose
tier-trends/
├── tier-trends-analysis.tsx
├── use-tier-trends-view-state.ts
│
├── filters/
│   ├── tier-trends-filters.tsx
│   ├── field-search.tsx
│   ├── use-field-filter.ts
│   ├── field-type-detection.ts         # Pure logic for filter feature
│   └── tier-trends-ui-options.ts       # Pure logic for filter feature
│
├── table/
│   ├── tier-trends-table.tsx
│   ├── virtualized-trends-table.tsx
│   ├── column-header-renderer.ts
│   ├── trend-indicators.ts             # Pure logic for table display
│   ├── trend-value-formatting.ts       # Pure logic for table display
│   └── tier-trends-display.ts          # Pure logic for table display
│
├── mobile/
│   ├── tier-trends-mobile-card.tsx
│   ├── use-tier-trends-mobile.ts
│   └── tier-trends-mobile-utils.ts
│
└── calculations/                        # NOT "logic" - CALCULATIONS (purpose!)
    ├── tier-trends-calculations.ts      # Core calculation engine
    ├── aggregation-strategies.ts        # Aggregation algorithms
    ├── hourly-rate-calculations.ts      # Hourly rate computations
    └── run-header-formatting.ts         # Run header processing
```

**Why This Works:**
- ✅ **Co-location**: Table logic with table component
- ✅ **Discoverability**: "Modify table indicators" → `table/trend-indicators.ts`
- ✅ **Clear purpose**: `calculations/` indicates "core computation engine" not "random pure functions"
- ✅ **Related files together**: Component + hook + logic all in same subdirectory

**Example 2: Tier Stats Logic → Purpose-Based**
```bash
# ❌ CURRENT: Type-based
tier-stats/
├── config/
├── table/
└── logic/                              # What's the PURPOSE of these files?
    ├── column-reorder.ts               # → Used by: config
    ├── field-percentile-calculation.ts # → Used by: calculations
    ├── tier-stats-aggregation-options.ts # → Used by: config
    ├── tier-stats-calculator.ts        # → Core calculation engine
    ├── tier-stats-data.ts              # → Core data processing
    └── tier-stats-sort.ts              # → Used by: table

# ✅ BETTER: Purpose-based
tier-stats/
├── tier-stats-display.tsx
├── use-tier-stats.ts
│
├── config/
│   ├── tier-stats-config-panel.tsx
│   ├── use-tier-stats-config.tsx
│   ├── column-reorder.ts               # Config feature logic
│   └── tier-stats-aggregation-options.ts # Config feature logic
│
├── table/
│   ├── tier-stats-table.tsx
│   ├── use-tier-stats-table.ts
│   └── tier-stats-sort.ts              # Table feature logic
│
└── calculations/                        # Core calculation engine
    ├── tier-stats-calculator.ts
    ├── tier-stats-data.ts
    └── field-percentile-calculation.ts
```

## Current State Analysis

### Logic Directories to Eliminate

**Count**: 5 logic directories, ~35 implementation files total

1. **`src/features/analysis/tier-trends/logic/`** (9 implementation files)
   - VIOLATION: 10-file threshold not hit, but violates purpose-based organization
   - Files serve specific features (table, filters, mobile) but scattered in generic directory

2. **`src/features/analysis/tier-stats/logic/`** (6 implementation files)
   - Files tied to specific features: config, table, calculations
   - Directory name doesn't indicate purpose

3. **`src/features/analysis/deaths-radar/logic/`** (~2-3 files)
   - Small feature with unnecessary separation

4. **`src/features/analysis/time-series/logic/`** (~3-5 files)
   - Reusable component with logic separated from usage

5. **`src/features/data-tracking/logic/`** (~10-15 files)
   - Needs investigation to determine purpose and consumers

### Shared Directory to Organize

**`src/features/analysis/shared/`** (4 implementation files)
- CURRENT: Flat dumping ground
  ```
  shared/
  ├── chart-formatters.ts
  ├── data-parser.ts
  ├── field-utils.ts
  └── run-type-filter.ts
  ```

- PROBLEM: What's the relationship between these files? What PURPOSE do they serve?

- SOLUTION: Group by purpose
  ```
  shared/
  ├── formatting/           # Purpose: formatting across charts
  │   └── chart-formatters.ts
  ├── parsing/              # Purpose: data parsing utilities
  │   └── data-parser.ts
  └── filtering/            # Purpose: filtering utilities
      ├── field-utils.ts
      └── run-type-filter.ts
  ```

### Utils Directory to Eliminate

**`src/features/data-tracking/utils/`** (30+ implementation files)

**MAJOR VIOLATION**:
- 30+ files in single directory (3x the 10-file threshold!)
- Generic "utils" name (anti-pattern)
- CSV-related files NOT in CSV feature directory
- Search-related files scattered instead of being in a reusable component

**Example CSV files in wrong location:**
```bash
# ❌ CURRENT: CSV files in data-tracking/utils/
data-tracking/
└── utils/
    ├── csv-helpers.ts
    ├── csv-parser.ts
    └── csv-persistence.ts

# ✅ TARGET: CSV files with CSV import feature
data-import/
└── csv-import/
    ├── csv-import-dialog.tsx
    ├── use-csv-import.ts
    ├── csv-helpers.ts          # Co-located!
    ├── csv-parser.ts           # Co-located!
    └── csv-persistence.ts      # Co-located!
```

## Target State

### Tier Trends Reorganization

**BEFORE:**
```bash
tier-trends/
├── filters/ (4 files)
├── table/ (3 files)
├── mobile/ (3 files)
└── logic/ (9 files)      # Generic dumping ground
```

**AFTER:**
```bash
tier-trends/
├── tier-trends-analysis.tsx
├── use-tier-trends-view-state.ts
│
├── filters/
│   ├── tier-trends-filters.tsx
│   ├── field-search.tsx
│   ├── use-field-filter.ts
│   ├── field-type-detection.ts         # Moved from logic/
│   └── tier-trends-ui-options.ts       # Moved from logic/
│
├── table/
│   ├── tier-trends-table.tsx
│   ├── virtualized-trends-table.tsx
│   ├── column-header-renderer.ts
│   ├── trend-indicators.ts             # Moved from logic/
│   ├── trend-value-formatting.ts       # Moved from logic/
│   └── tier-trends-display.ts          # Moved from logic/
│
├── mobile/
│   ├── tier-trends-mobile-card.tsx
│   ├── use-tier-trends-mobile.ts
│   └── tier-trends-mobile-utils.ts
│
└── calculations/                        # Renamed from logic/, clear purpose
    ├── tier-trends-calculations.ts
    ├── aggregation-strategies.ts
    ├── hourly-rate-calculations.ts
    └── run-header-formatting.ts
```

**Changes:**
- ❌ DELETE: `logic/` directory
- ✅ CREATE: `calculations/` directory (purpose: core calculation engine)
- ✅ MOVE: Feature-specific logic to feature subdirectories (table, filters, mobile)
- ✅ RENAME: Generic "logic" → specific "calculations" (indicates PURPOSE)

**File Movements:**
1. `logic/field-type-detection.ts` → `filters/field-type-detection.ts` (used by filters)
2. `logic/tier-trends-ui-options.ts` → `filters/tier-trends-ui-options.ts` (used by filters)
3. `logic/trend-indicators.ts` → `table/trend-indicators.ts` (used by table, mobile)
4. `logic/trend-value-formatting.ts` → `table/trend-value-formatting.ts` (used by table, mobile)
5. `logic/tier-trends-display.ts` → `table/tier-trends-display.ts` (used by table)
6. `logic/tier-trends-calculations.ts` → `calculations/tier-trends-calculations.ts` (core engine)
7. `logic/aggregation-strategies.ts` → `calculations/aggregation-strategies.ts` (core engine)
8. `logic/hourly-rate-calculations.ts` → `calculations/hourly-rate-calculations.ts` (core engine)
9. `logic/run-header-formatting.ts` → `calculations/run-header-formatting.ts` (core engine)

### Tier Stats Reorganization

**BEFORE:**
```bash
tier-stats/
├── config/ (2 files)
├── table/ (2 files)
└── logic/ (6 files)
```

**AFTER:**
```bash
tier-stats/
├── tier-stats-display.tsx
├── use-tier-stats.ts
│
├── config/
│   ├── tier-stats-config-panel.tsx
│   ├── use-tier-stats-config.tsx
│   ├── column-reorder.ts               # Moved from logic/
│   └── tier-stats-aggregation-options.ts # Moved from logic/
│
├── table/
│   ├── tier-stats-table.tsx
│   ├── use-tier-stats-table.ts
│   └── tier-stats-sort.ts              # Moved from logic/
│
└── calculations/                        # Renamed from logic/
    ├── tier-stats-calculator.ts
    ├── tier-stats-data.ts
    └── field-percentile-calculation.ts
```

**File Movements:**
1. `logic/column-reorder.ts` → `config/column-reorder.ts` (used by config)
2. `logic/tier-stats-aggregation-options.ts` → `config/tier-stats-aggregation-options.ts` (used by config)
3. `logic/tier-stats-sort.ts` → `table/tier-stats-sort.ts` (used by table)
4. `logic/tier-stats-calculator.ts` → `calculations/tier-stats-calculator.ts` (core engine)
5. `logic/tier-stats-data.ts` → `calculations/tier-stats-data.ts` (core engine)
6. `logic/field-percentile-calculation.ts` → `calculations/field-percentile-calculation.ts` (core engine)

### Deaths Radar Reorganization

**Investigation Required:** Determine current structure and logic file consumers.

**Principle:** If deaths-radar is small (3-5 files), keep logic co-located WITHOUT subdirectories:
```bash
deaths-radar/
├── deaths-radar-chart.tsx
├── use-deaths-radar.ts
├── deaths-radar-calculations.ts    # No subdirectory needed for small feature
└── deaths-radar-scaling.ts
```

### Time Series Reorganization

**Investigation Required:** Determine current structure and logic file consumers.

**Principle:** Time series is a reusable component - organize internally by purpose, not by type.

### Data Tracking Utils Elimination

**Investigation Required:** Map all 30+ files to their consumers and purposes.

**Expected Groupings:**
1. **CSV-related files** → Move to `data-import/csv-import/`
2. **Field search/filter files** → Extract to shared search component
3. **Run type files** → Evaluate if specific to a feature or truly shared
4. **Date/string formatters** → Move to `src/shared/formatting/` if cross-feature
5. **Field discovery/mapping** → Move to data import feature

### Analysis Shared Reorganization

**BEFORE:**
```bash
shared/
├── chart-formatters.ts
├── data-parser.ts
├── field-utils.ts
└── run-type-filter.ts
```

**AFTER:**
```bash
shared/
├── formatting/
│   └── chart-formatters.ts
├── parsing/
│   └── data-parser.ts
└── filtering/
    ├── field-utils.ts
    └── run-type-filter.ts
```

**NOTE:** If any of these files are only used by ONE feature, move them to that feature instead of keeping them in shared.

## Benefits of Reorganization

### Immediate Benefits
1. **Improved Discoverability**: Logic co-located with features that use it
2. **Clearer Relationships**: Can see which logic belongs to which feature
3. **Reduced Navigation**: Don't need to jump between `table/` and `logic/` directories
4. **Pattern Consistency**: No more "type vs purpose" confusion
5. **Self-Documenting Structure**: Directory names indicate PURPOSE, not PURITY

### Long-Term Benefits
1. **Easier Refactoring**: Related files already together when extracting components
2. **Clearer Boundaries**: Feature boundaries visible in directory structure
3. **Better AI Understanding**: AI can navigate by purpose, not by file type
4. **Prevents Drift**: No more "where does this pure function go?" confusion
5. **Scalability**: Pattern works for small and large features

### Architectural Improvements
1. **Eliminates False Dichotomy**: "Pure vs impure" is replaced by "what PURPOSE does it serve?"
2. **Reinforces Co-location**: All related code together, regardless of technical purity
3. **Purpose-Driven Organization**: Every directory name answers "what is this FOR?"
4. **Consistent Principles**: Same organization approach for all file types

## AI Instruction Updates Required

### Current Violations in `.ruler/04-engineering-standards.md`

**PROBLEM:** Current example shows `logic/` directory as acceptable:
```bash
# Line 127-130 in current file:
└── logic/                      # Pure business logic
    ├── tier-trends-display.ts
    ├── tier-trends-ui-options.ts
    └── tier-trends-calculations.ts
```

**This example CONTRADICTS the principle of organizing by purpose, not by type!**

### Required Changes to `.ruler/04-engineering-standards.md`

**Update Section: "Directory Organization Examples"**

**REPLACE:**
```bash
└── logic/                      # Pure business logic
    ├── tier-trends-display.ts
    ├── tier-trends-ui-options.ts
    └── tier-trends-calculations.ts
```

**WITH:**
```bash
├── filters/
│   ├── tier-trends-filters.tsx
│   ├── field-search.tsx
│   ├── use-field-filter.ts
│   └── tier-trends-ui-options.ts    # Logic co-located with filter feature
│
├── table/
│   ├── tier-trends-table.tsx
│   ├── virtualized-trends-table.tsx
│   └── tier-trends-display.ts       # Logic co-located with table feature
│
└── calculations/                     # NOT "logic" - specific purpose!
    └── tier-trends-calculations.ts  # Core calculation engine
```

**ADD New Anti-Pattern Section:**

```markdown
### Anti-Patterns to Avoid

**FORBIDDEN PATTERNS:**

- ❌ **Type-based separation** at feature level (components/, hooks/, logic/)
  - **Including `logic/` directories** - this is type-based organization!
  - Pure functions are STILL part of features - co-locate with consumers

- ❌ **Generic dumping grounds** (utils/, helpers/, misc/, common/, logic/)
  - Exception: If you can name it by PURPOSE (e.g., `calculations/`, `formatting/`, `parsing/`)
  - But even then, prefer co-locating with the feature that uses it

- ❌ **Organizing by purity instead of purpose**
  - Question: "Is this pure?" → Put in logic/ ❌
  - Correct: "What does this serve?" → Put with that feature ✅
```

**ADD Clarification to "Shared Code Guidelines":**

```markdown
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
```

### Required Changes to `.claude/agents/architecture-review.md`

**ADD to "Critical Refactorings (MANDATORY - Must Fix)" section:**

```markdown
6. **Logic Directory Violations (NEW)**
   - `logic/` directories are TYPE-based organization (organizing by purity)
   - Pure functions still serve specific features - co-locate with consumers
   - Acceptable alternatives:
     - Co-locate with feature: `table/trend-indicators.ts` (preferred)
     - Purpose-named directory: `calculations/` (only if truly shared calculation engine)
   - NEVER use generic `logic/` as dumping ground for "pure functions"
```

**UPDATE file organization example to match updated standards (same changes as above)**

## Implementation Tasks

### Phase 1: Investigation & Mapping (2-4 hours)

**Task 1.1: Map Tier Trends Logic Files to Consumers**
- [ ] For each file in `tier-trends/logic/`, find all imports using Grep
- [ ] Document which features/components consume each file
- [ ] Identify files that are:
  - Used by single feature (table, filters, mobile) → co-locate
  - Used by multiple features → keep in shared calculation engine
- [ ] Create file movement plan

**Task 1.2: Map Tier Stats Logic Files to Consumers**
- [ ] For each file in `tier-stats/logic/`, find all imports using Grep
- [ ] Document which features/components consume each file
- [ ] Create file movement plan

**Task 1.3: Investigate Deaths Radar & Time Series**
- [ ] Find current structure of deaths-radar and time-series features
- [ ] Document logic file consumers
- [ ] Determine if subdirectories needed (based on size)
- [ ] Create file movement plan

**Task 1.4: Map Data Tracking Utils Files**
- [ ] List all 30+ files in `data-tracking/utils/`
- [ ] Group by purpose/domain (CSV, search, run-type, formatting, etc.)
- [ ] For each group, find consumers and determine target location
- [ ] Identify candidates for:
  - Move to specific feature (e.g., CSV → data-import)
  - Move to shared (if cross-feature)
  - Extract to reusable component (e.g., search functionality)
- [ ] Create comprehensive file movement plan

**Task 1.5: Analyze Analysis Shared Directory**
- [ ] For each file in `analysis/shared/`, find all consumers
- [ ] Determine if truly shared (2+ features) or should move to single feature
- [ ] Plan subdirectory groupings by purpose

### Phase 2: Update AI Instructions (1-2 hours)

**Task 2.1: Update Engineering Standards**
- [ ] Modify `.ruler/04-engineering-standards.md` directory example
- [ ] Remove `logic/` directory from "good" example
- [ ] Add `logic/` to anti-patterns section
- [ ] Add clarification about organizing by purpose vs purity
- [ ] Update shared code guidelines with purpose-based organization

**Task 2.2: Update Architecture Review Agent**
- [ ] Add `logic/` directories to critical violations in `.claude/agents/architecture-review.md`
- [ ] Update file organization examples to match updated standards
- [ ] Add detection logic for `logic/`, `utils/`, `helpers/` directories
- [ ] Add guidance on purpose-based naming alternatives

### Phase 3: Tier Trends Reorganization (2-3 hours)

**Task 3.1: Create Calculations Directory**
- [ ] Create `tier-trends/calculations/` directory
- [ ] Move core calculation files from `logic/` to `calculations/`:
  - `tier-trends-calculations.ts`
  - `aggregation-strategies.ts`
  - `hourly-rate-calculations.ts`
  - `run-header-formatting.ts`

**Task 3.2: Move Filter-Specific Logic**
- [ ] Move `logic/field-type-detection.ts` → `filters/field-type-detection.ts`
- [ ] Move `logic/tier-trends-ui-options.ts` → `filters/tier-trends-ui-options.ts`
- [ ] Update imports in filter components

**Task 3.3: Move Table-Specific Logic**
- [ ] Move `logic/trend-indicators.ts` → `table/trend-indicators.ts`
- [ ] Move `logic/trend-value-formatting.ts` → `table/trend-value-formatting.ts`
- [ ] Move `logic/tier-trends-display.ts` → `table/tier-trends-display.ts`
- [ ] Update imports in table components

**Task 3.4: Update All Imports**
- [ ] Use Grep to find all imports from `tier-trends/logic/`
- [ ] Update imports to new locations (calculations, filters, table)
- [ ] Update internal imports within moved files
- [ ] Run `npm run build` to verify no broken imports

**Task 3.5: Delete Logic Directory**
- [ ] Verify `logic/` directory is empty
- [ ] Delete `logic/` directory
- [ ] Run full verification suite

### Phase 4: Tier Stats Reorganization (1-2 hours)

**Task 4.1: Create Calculations Directory & Move Core Files**
- [ ] Create `tier-stats/calculations/` directory
- [ ] Move core files:
  - `logic/tier-stats-calculator.ts` → `calculations/tier-stats-calculator.ts`
  - `logic/tier-stats-data.ts` → `calculations/tier-stats-data.ts`
  - `logic/field-percentile-calculation.ts` → `calculations/field-percentile-calculation.ts`

**Task 4.2: Move Feature-Specific Logic**
- [ ] Move `logic/column-reorder.ts` → `config/column-reorder.ts`
- [ ] Move `logic/tier-stats-aggregation-options.ts` → `config/tier-stats-aggregation-options.ts`
- [ ] Move `logic/tier-stats-sort.ts` → `table/tier-stats-sort.ts`

**Task 4.3: Update Imports & Delete Directory**
- [ ] Update all imports from `tier-stats/logic/`
- [ ] Update internal imports within moved files
- [ ] Run `npm run build`
- [ ] Delete empty `logic/` directory
- [ ] Run verification suite

### Phase 5: Deaths Radar & Time Series (1-2 hours)

**Task 5.1: Deaths Radar Reorganization**
- [ ] Investigate current structure (if not already done in Phase 1)
- [ ] Execute reorganization based on investigation findings
- [ ] If small feature: co-locate logic WITHOUT subdirectories
- [ ] If larger: create purpose-named subdirectories
- [ ] Update imports, delete `logic/` directory

**Task 5.2: Time Series Reorganization**
- [ ] Investigate current structure (if not already done in Phase 1)
- [ ] Execute reorganization based on investigation findings
- [ ] Organize by purpose (e.g., `parsing/`, `rendering/`, `calculations/`)
- [ ] Update imports, delete `logic/` directory

**Task 5.3: Data Tracking Logic (if exists)**
- [ ] Investigate `data-tracking/logic/` directory
- [ ] Map files to consumers and determine target locations
- [ ] Move files to appropriate features
- [ ] Update imports, delete directory

### Phase 6: Data Tracking Utils Elimination (4-6 hours)

**WARNING:** This is the largest and most complex reorganization. Take breaks, work in batches.

**Task 6.1: CSV Files Migration**
- [ ] Move CSV-related files to `data-import/csv-import/`:
  - `utils/csv-helpers.ts`
  - `utils/csv-parser.ts`
  - `utils/csv-persistence.ts`
- [ ] Update imports in CSV import components
- [ ] Run tests for CSV import feature

**Task 6.2: Search/Filter Files**
- [ ] Identify search and filter utility files
- [ ] Determine if:
  - Feature-specific → move to that feature
  - Reusable → extract to shared search component
- [ ] Execute moves based on decision
- [ ] Update imports

**Task 6.3: Run Type Files**
- [ ] Group run-type related files:
  - `run-type-defaults.ts`
  - `run-type-detection.ts`
  - `run-type-display.ts`
  - `run-type-selector-options.ts`
- [ ] Find consumers
- [ ] Determine target: specific feature OR `data-tracking/run-types/`
- [ ] Move files and update imports

**Task 6.4: Field-Related Files**
- [ ] Group field utility files:
  - `field-discovery.ts`
  - `field-filter.ts`
  - `field-name-mapping.ts`
  - `field-search.ts`
  - `field-similarity.ts`
  - `internal-field-config.ts`
- [ ] Find consumers
- [ ] Determine if:
  - Used by data import → move to `data-import/`
  - Used by multiple features → create `data-tracking/fields/` subdirectory
- [ ] Move files and update imports

**Task 6.5: Formatting Files**
- [ ] Identify formatting files:
  - `date-formatters.ts`
  - `string-formatters.ts`
- [ ] Find consumers
- [ ] If cross-feature usage → move to `src/shared/formatting/`
- [ ] If feature-specific → move to that feature
- [ ] Update imports

**Task 6.6: Remaining Utils Files**
- [ ] Process remaining files in `utils/`:
  - `data-migrations.ts`
  - `duplicate-detection.ts`
  - `tournament-tier-parsing.ts`
  - (any others discovered)
- [ ] For each file, find consumers and determine purpose
- [ ] Move to appropriate location based on purpose
- [ ] Update imports

**Task 6.7: Delete Utils Directory**
- [ ] Verify `utils/` directory is empty
- [ ] Delete `utils/` directory
- [ ] Run full build and test suite
- [ ] Manual testing of affected features

### Phase 7: Analysis Shared Reorganization (1 hour)

**Task 7.1: Evaluate Each Shared File**
- [ ] For `chart-formatters.ts`: Find all consumers
  - If 1 feature → move to that feature
  - If 2+ features → keep in shared, create `formatting/` subdirectory
- [ ] Repeat for `data-parser.ts`, `field-utils.ts`, `run-type-filter.ts`

**Task 7.2: Reorganize or Relocate**
- [ ] If files stay in shared: create purpose-based subdirectories
  - `shared/formatting/`
  - `shared/parsing/`
  - `shared/filtering/`
- [ ] If files move to single feature: relocate and update imports
- [ ] Update imports across all consumers
- [ ] Run verification

### Phase 8: Verification & Documentation (1-2 hours)

**Task 8.1: Comprehensive Testing**
- [ ] Run `npm run build` - must pass
- [ ] Run `npm run test` - must pass
- [ ] Run `npm run type-check` - must pass
- [ ] Run `npm run lint` - must pass
- [ ] Manual testing of ALL affected features:
  - Tier Trends analysis page
  - Tier Stats analysis page
  - Deaths Radar page
  - Time Series charts
  - Data import (CSV and manual)
  - Any features using data-tracking utils

**Task 8.2: Verify No Logic Directories Remain**
- [ ] Run: `find src/features -type d -name "logic"`
- [ ] Result should be empty
- [ ] If any remain, investigate and eliminate

**Task 8.3: Verify No Oversized Utils Directories**
- [ ] Run: `find src/features -type d -name "utils"`
- [ ] For each result, count implementation files
- [ ] Flag if >10 files or generic purpose
- [ ] Reorganize if needed

**Task 8.4: Documentation Updates**
- [ ] Update SUMMARY.md with completion
- [ ] Create migration summary documenting:
  - Files moved
  - Directory structure changes
  - Import updates performed
  - Testing results
  - Lessons learned

## Migration Rules

### Universal Rules (Apply to ALL reorganizations)

1. **NO LOGIC CHANGES**: Only move files and update imports - ZERO behavior changes
2. **Move Tests With Implementation**: `*.test.ts` files move with their source files
3. **Update Imports Systematically**: External consumers first, then internal cross-references
4. **Verify After Each Phase**: Run build + tests after completing each phase
5. **Co-locate by Purpose**: Put files where they're USED, not where they're "pure"

### Specific Rules for This Migration

**Rule 1: Eliminate "logic" as a directory name**
- Exception: Only if renamed to purpose-specific name (e.g., `calculations/`)
- Even then, prefer co-location with consumer when possible

**Rule 2: Co-locate single-purpose logic**
- If logic file used ONLY by one feature → move to that feature's subdirectory
- Example: `trend-indicators.ts` used only by table → `table/trend-indicators.ts`

**Rule 3: Create purpose-named directories for shared logic**
- If logic used by multiple features within same domain → create purpose-named directory
- ✅ GOOD: `calculations/`, `formatting/`, `parsing/`, `validation/`
- ❌ BAD: `logic/`, `utils/`, `helpers/`, `common/`

**Rule 4: Question "shared" directories**
- Before keeping file in `shared/`, verify it's truly used by 2+ features
- If only 1 consumer → move to that feature
- If 2+ consumers → organize by purpose within shared

**Rule 5: Organize shared by purpose, not by type**
- Even within `shared/` directory, create subdirectories by PURPOSE
- ✅ GOOD: `shared/formatting/`, `shared/filtering/`
- ❌ BAD: `shared/utils/`, `shared/helpers/`

### Decision Framework for File Placement

**When moving a logic file, ask:**

1. **"How many features consume this file?"**
   - 1 feature → Co-locate with that feature
   - 2+ features → Evaluate for shared

2. **"What is the PURPOSE of this file?"**
   - Specific purpose (formatting, validation, calculation) → Purpose-named directory
   - Generic utility → Investigate deeper, find specific purpose

3. **"Which component/feature DIRECTLY uses this?"**
   - Direct usage by component → Co-locate in same subdirectory
   - Used by multiple components in same feature → Feature-level file or purpose subdirectory

4. **"Is this truly shared or prematurely extracted?"**
   - Used by 2+ features NOW → Shared
   - Might be used someday → NOT shared, keep in feature

**Example Application:**

```typescript
// File: trend-indicators.ts
// Consumers: tier-trends-table.tsx, tier-trends-mobile-card.tsx

// Q1: How many features? → 2 components, same feature (tier-trends)
// Q2: What's the purpose? → Display trend indicators for table/mobile
// Q3: Which components use it? → table component, mobile component (both in tier-trends)
// Q4: Is it shared? → No, only used within tier-trends feature

// DECISION: Co-locate with primary consumer (table/)
// LOCATION: tier-trends/table/trend-indicators.ts
// JUSTIFICATION: Table is primary consumer, mobile can import from table
```

## Success Criteria

### Required Outcomes
- [ ] ZERO `logic/` directories exist in `src/features/` (except if renamed to purpose-specific)
- [ ] ZERO directories with 10+ implementation files remain unorganized
- [ ] All logic files co-located with their consumers OR in purpose-named directories
- [ ] `data-tracking/utils/` directory eliminated
- [ ] `analysis/shared/` organized by purpose (if files remain there)
- [ ] AI instructions updated to prevent future `logic/` directory creation
- [ ] All tests passing
- [ ] All features functioning identically to before migration

### Quality Indicators
- [ ] Can navigate from feature to its logic without leaving feature directory
- [ ] Directory names indicate PURPOSE, never just "logic", "utils", "helpers"
- [ ] Related files (component + hook + logic) co-located in same subdirectory
- [ ] Shared directories organized by purpose, not by type
- [ ] No generic dumping ground directories remain

### Documentation Deliverables
- [ ] Updated AI instruction files (`.ruler/04-engineering-standards.md`, `.claude/agents/architecture-review.md`)
- [ ] Migration summary documenting all file movements
- [ ] Updated examples showing purpose-based organization
- [ ] Clear anti-patterns list including `logic/` directories

## Notes & Considerations

### Why This Matters

**Developer Experience:**
- Faster feature navigation (all related code together)
- Easier debugging (component and logic in same place)
- Clearer mental model (organized by what, not by how)

**AI Agent Performance:**
- Better context understanding (purpose-based structure)
- Improved file discovery (semantic navigation)
- Clearer relationships (co-located dependencies)

**Long-Term Maintenance:**
- Prevents entropy (no more "where does this go?" confusion)
- Scalable pattern (works for small and large features)
- Self-documenting (directory names explain themselves)

### Common Pitfalls to Avoid

1. **Don't create purpose directories prematurely**
   - Wait until 3+ files share the purpose
   - For 1-2 files, keep at feature root level

2. **Don't organize shared by type**
   - Even in `shared/`, use purpose-based subdirectories
   - Avoid: `shared/utils/`, `shared/helpers/`

3. **Don't move files without updating internal imports**
   - When moving `a.ts` to new location, check if it imports other files
   - Update its imports to reference correct relative paths

4. **Don't batch-move without testing**
   - Move files in logical groups (e.g., all filter-related)
   - Test after each group before moving to next

### Future Improvements

After completing this migration, consider:

1. **Extract Reusable Components**
   - Search functionality (field-search utilities)
   - Filter components (if used across features)
   - Formatting utilities (if truly cross-feature)

2. **Evaluate Remaining Shared Directories**
   - Ensure all files in `shared/` are used by 2+ features
   - Consider moving single-consumer files to their features

3. **Create Shared UI Component Library**
   - Extract common UI patterns
   - Create proper public API for shared components
   - Document usage patterns

## Related Documents

- **Parent PRD**: [PRD Enhanced File Structure Organization](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md)
- **Previous Migration**: [09-analysis-shared-migration.md](09-analysis-shared-migration.md)
- **AI Instructions**: `.ruler/04-engineering-standards.md`, `.claude/agents/architecture-review.md`
- **Architecture Analysis**: [file-organization-analysis.md](../file-organization-analysis.md)
