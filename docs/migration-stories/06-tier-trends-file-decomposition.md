# Migration Story 06: Tier Trends File Decomposition

## Status
**Status**: Planning
**Created**: 2025-10-31
**Related PRs**: N/A
**Dependencies**: Story 05 (Tier Trends Feature Reorganization)

## Context

During Story 05 (Tier Trends Feature Reorganization), two files were migrated that exceed the project's 300-line limit enforced by ESLint's `max-lines` rule:

1. **tier-trends-calculations.ts** - 350 lines (50 lines over limit)
2. **tier-trends-calculations.test.ts** - 485 lines (185 lines over limit)

Both files were temporarily suppressed with `/* eslint-disable max-lines */` to allow the feature reorganization to proceed without mixing structural concerns. This follow-up story addresses the line limit violations through strategic decomposition.

## Current State Analysis

### File: tier-trends-calculations.ts (350 lines)

**Current Location**: `src/features/analysis/tier-trends/logic/tier-trends-calculations.ts`

**Responsibilities** (identified through analysis):
1. **Default/Configuration Logic** (lines 26-64)
   - `getDefaultAggregationType()` - Determines default aggregation by duration
   - `getQuantityLabel()` - Maps duration to display label ("runs", "days", etc.)

2. **Main Orchestration** (lines 77-156)
   - `calculateTierTrends()` - Primary entry point coordinating entire calculation pipeline
   - Filtering, grouping, aggregation, trend calculation, summary generation

3. **Period Grouping Logic** (lines 257-361)
   - `groupRunsByPeriod()` - Groups runs by time period (per-run, daily, weekly, monthly)
   - `getPeriodBounds()` - Calculates period boundaries and labels
   - Complex date/time handling for various period types

4. **Field Extraction & Aggregation** (lines 366-431)
   - `getNumericalFieldsFromPeriods()` - Extracts all numerical fields from periods
   - `aggregatePeriodValues()` - Aggregates values for a period
   - `applyAggregationStrategy()` - Applies aggregation strategy (sum, avg, min, max, hourly)

5. **Trend Analysis** (lines 161-192, 436-495)
   - `analyzeTrendType()` - Analyzes trend patterns (upward, downward, linear, volatile, stable)
   - `calculateFieldTrendFromPeriods()` - Calculates field trends with change metrics

6. **Tier & Display Utilities** (lines 197-252)
   - `getAvailableTiersForTrends()` - Gets tiers with sufficient data
   - `formatFieldDisplayName()` - Formats field names for display
   - `generateSparklinePath()` - Generates SVG path for sparkline visualization

**Architectural Observations**:
- Mixed concerns: orchestration, period grouping, aggregation, trend analysis, utilities
- Natural clustering: period logic, aggregation logic, trend analysis logic, utility functions
- Some functions are tightly coupled to `calculateTierTrends()` orchestration
- Other functions are self-contained and could be extracted

### File: tier-trends-calculations.test.ts (485 lines)

**Current Location**: `src/features/analysis/tier-trends/logic/tier-trends-calculations.test.ts`

**Responsibilities** (identified through analysis):
1. **Test Helpers** (lines 7-79)
   - `createMockField()` - Creates mock GameRunField
   - `createMockRun()` - Creates mock ParsedGameRun
   - `createRunsWithVariation()` - Creates test runs with varying data

2. **Core Function Tests** (lines 82-122)
   - `getAvailableTiersForTrends` test suite (40 lines)

3. **Per-Run Mode Tests** (lines 125-219)
   - Per-run analysis tests (94 lines)
   - Enhanced header format validation
   - Actual values verification
   - Hourly rate calculations

4. **Aggregation Mode Tests** (lines 221-388)
   - Daily aggregation tests (167 lines)
   - All aggregation types: SUM, AVERAGE, MIN, MAX, HOURLY
   - Multi-day test scenarios

5. **Field Trend Calculation Tests** (lines 390-450)
   - Change percentage calculations (60 lines)
   - Threshold filtering validation

6. **Summary Statistics Tests** (lines 452-473)
   - Summary statistics validation (21 lines)

7. **Edge Cases Tests** (lines 475-542)
   - Insufficient data handling (67 lines)
   - Missing fields handling
   - Zero value calculations

8. **Utility Function Tests** (lines 545-587)
   - `getDefaultAggregationType` tests (42 lines)
   - `getQuantityLabel` tests

**Architectural Observations**:
- Test suites directly mirror the implementation structure
- Large aggregation mode test suite (167 lines) is a prime candidate for extraction
- Helper functions are well-contained and reusable
- Test structure follows logical grouping by feature area

## Target State

### Proposed Decomposition Strategy

The decomposition strategy maintains cohesion while reducing file sizes below 300 lines. Each extracted file serves a clear, single purpose.

#### Implementation File Decomposition

**tier-trends-calculations.ts** (350 lines → 4 files):

```
src/features/analysis/tier-trends/logic/
├── tier-trends-calculations.ts        (120 lines) - Main orchestration
├── period-grouping.ts                 (110 lines) - Period/date logic
├── field-aggregation.ts               (65 lines)  - Field aggregation
└── trend-analysis.ts                  (75 lines)  - Trend calculation
```

**File 1: tier-trends-calculations.ts** (Main Orchestration - 120 lines)
- **Purpose**: Primary entry point and high-level orchestration
- **Exports**:
  - `calculateTierTrends()` - Main orchestration function
  - `getDefaultAggregationType()` - Configuration utility
  - `getQuantityLabel()` - Configuration utility
  - `getAvailableTiersForTrends()` - Tier filtering
  - `formatFieldDisplayName()` - Display utility
  - `generateSparklinePath()` - Visualization utility
- **Imports**: Functions from other 3 extracted files
- **Rationale**: Keeps the main API surface in one place, delegates to specialized modules

**File 2: period-grouping.ts** (Period Logic - 110 lines)
- **Purpose**: All period/date-related logic and grouping
- **Exports**:
  - `groupRunsByPeriod()` - Groups runs by period
  - `getPeriodBounds()` - Calculates period boundaries
  - `PeriodData` interface (exported for type sharing)
- **Imports**: Types from game-run.types, run-header-formatting
- **Rationale**: Self-contained date/time logic with clear boundaries

**File 3: field-aggregation.ts** (Aggregation Logic - 65 lines)
- **Purpose**: Field extraction and value aggregation
- **Exports**:
  - `getNumericalFieldsFromPeriods()` - Extract numerical fields
  - `aggregatePeriodValues()` - Aggregate values for period
  - `applyAggregationStrategy()` - Apply aggregation type
- **Imports**: Types, aggregation-strategies, hourly-rate-calculations, field-type-detection
- **Rationale**: Pure aggregation logic without period or trend concerns

**File 4: trend-analysis.ts** (Trend Analysis - 75 lines)
- **Purpose**: Trend pattern analysis and change calculations
- **Exports**:
  - `analyzeTrendType()` - Analyze trend patterns
  - `calculateFieldTrendFromPeriods()` - Calculate field trends
- **Imports**: Types, field-aggregation (for period aggregation)
- **Rationale**: Self-contained trend analysis algorithms

#### Test File Decomposition

**tier-trends-calculations.test.ts** (485 lines → 5 files):

```
src/features/analysis/tier-trends/logic/
├── tier-trends-calculations.test.ts   (150 lines) - Main orchestration tests
├── period-grouping.test.ts            (95 lines)  - Period logic tests
├── field-aggregation.test.ts          (170 lines) - Aggregation tests
├── trend-analysis.test.ts             (100 lines) - Trend analysis tests
└── __tests__/
    └── test-helpers.ts                (50 lines)  - Shared test utilities
```

**Test File 1: tier-trends-calculations.test.ts** (Main Tests - 150 lines)
- **Coverage**:
  - `calculateTierTrends()` orchestration tests
  - Integration tests (per-run mode, field trends, summary statistics)
  - `getAvailableTiersForTrends()` tests
  - `getDefaultAggregationType()` tests
  - `getQuantityLabel()` tests
  - Edge cases requiring full orchestration
- **Imports**: test-helpers, main implementation

**Test File 2: period-grouping.test.ts** (Period Tests - 95 lines)
- **Coverage**:
  - `groupRunsByPeriod()` for each duration type
  - `getPeriodBounds()` date calculations
  - Period label formatting
  - Date boundary edge cases
- **Imports**: test-helpers, period-grouping

**Test File 3: field-aggregation.test.ts** (Aggregation Tests - 170 lines)
- **Coverage**:
  - All aggregation type tests (SUM, AVERAGE, MIN, MAX, HOURLY)
  - Multi-run aggregation scenarios
  - Daily/weekly/monthly aggregation tests
  - Hourly rate calculations
  - Field extraction from periods
- **Imports**: test-helpers, field-aggregation
- **Rationale**: Largest test suite isolated for focused aggregation testing

**Test File 4: trend-analysis.test.ts** (Trend Tests - 100 lines)
- **Coverage**:
  - `analyzeTrendType()` pattern detection
  - `calculateFieldTrendFromPeriods()` change calculations
  - Change percentage calculations
  - Direction and significance determination
  - Threshold filtering
- **Imports**: test-helpers, trend-analysis

**Test File 5: __tests__/test-helpers.ts** (Shared Utilities - 50 lines)
- **Exports**:
  - `createMockField()`
  - `createMockRun()`
  - `createRunsWithVariation()`
- **Rationale**: Reusable test utilities shared across all test files

## Benefits of Decomposition

### Architectural Benefits
1. **Single Responsibility**: Each file has one clear purpose
2. **Improved Cohesion**: Related functions grouped together
3. **Reduced Coupling**: Clear interfaces between modules
4. **Better Testability**: Focused test files for specific concerns
5. **Code Discoverability**: Easier to find specific functionality

### Development Benefits
1. **Smaller Files**: All files under 300-line limit (ESLint compliance)
2. **Parallel Development**: Multiple developers can work on different aspects
3. **Easier Reviews**: Smaller, focused PRs when changes needed
4. **Reduced Merge Conflicts**: Changes less likely to overlap
5. **Faster Comprehension**: Smaller files easier to understand

### Testing Benefits
1. **Focused Test Suites**: Each test file covers one concern
2. **Faster Test Execution**: Can run specific test suites in isolation
3. **Better Test Organization**: Test structure mirrors implementation
4. **Shared Test Utilities**: Reduced duplication with test-helpers
5. **Easier Test Maintenance**: Changes localized to relevant test files

### Extensibility Benefits
1. **Clear Extension Points**: Easy to add new aggregation types, period types, trend patterns
2. **Modular Enhancements**: Can improve individual modules independently
3. **Future Refactoring**: Easier to optimize specific concerns
4. **Alternative Implementations**: Could swap out strategies without affecting other modules

## Implementation Tasks

### Phase 1: Extract Period Grouping (Isolated)
- [ ] Create `period-grouping.ts` with period/date logic
- [ ] Move `groupRunsByPeriod()`, `getPeriodBounds()`, `PeriodData` interface
- [ ] Update imports in `tier-trends-calculations.ts`
- [ ] Create `period-grouping.test.ts` with period-specific tests
- [ ] Extract period tests from main test file
- [ ] Verify all tests pass

### Phase 2: Extract Field Aggregation (Isolated)
- [ ] Create `field-aggregation.ts` with aggregation logic
- [ ] Move `getNumericalFieldsFromPeriods()`, `aggregatePeriodValues()`, `applyAggregationStrategy()`
- [ ] Update imports in `tier-trends-calculations.ts` and `trend-analysis.ts` (planned)
- [ ] Create `field-aggregation.test.ts` with aggregation tests
- [ ] Extract aggregation tests (including large 167-line suite) from main test file
- [ ] Verify all tests pass

### Phase 3: Extract Trend Analysis (Depends on Field Aggregation)
- [ ] Create `trend-analysis.ts` with trend analysis logic
- [ ] Move `analyzeTrendType()`, `calculateFieldTrendFromPeriods()`
- [ ] Update imports in `tier-trends-calculations.ts`
- [ ] Create `trend-analysis.test.ts` with trend calculation tests
- [ ] Extract trend tests from main test file
- [ ] Verify all tests pass

### Phase 4: Extract Test Helpers (Shared)
- [ ] Create `__tests__/test-helpers.ts` with shared test utilities
- [ ] Move `createMockField()`, `createMockRun()`, `createRunsWithVariation()`
- [ ] Update imports in all 4 test files
- [ ] Verify all tests pass

### Phase 5: Refine Main Orchestration File
- [ ] Keep orchestration, config utilities, tier filtering, display utilities
- [ ] Verify file is under 300 lines (~120 lines expected)
- [ ] Keep main orchestration tests, integration tests, utility tests
- [ ] Verify test file is under 300 lines (~150 lines expected)
- [ ] Remove `/* eslint-disable max-lines */` from both files
- [ ] Run full test suite and linting

### Phase 6: Update Public API Exports
- [ ] Update `src/features/data-tracking/index.ts` to re-export new modules if needed
- [ ] Verify no breaking changes to public API
- [ ] Ensure all consumers still import from expected locations

### Phase 7: Documentation & Cleanup
- [ ] Add JSDoc comments to new exported functions
- [ ] Update any relevant documentation
- [ ] Verify build succeeds
- [ ] Create PR with clear decomposition summary

## Success Criteria

### File Size Compliance
- [ ] `tier-trends-calculations.ts` ≤ 300 lines (target: ~120 lines)
- [ ] `tier-trends-calculations.test.ts` ≤ 300 lines (target: ~150 lines)
- [ ] `period-grouping.ts` ≤ 300 lines (target: ~110 lines)
- [ ] `period-grouping.test.ts` ≤ 300 lines (target: ~95 lines)
- [ ] `field-aggregation.ts` ≤ 300 lines (target: ~65 lines)
- [ ] `field-aggregation.test.ts` ≤ 300 lines (target: ~170 lines)
- [ ] `trend-analysis.ts` ≤ 300 lines (target: ~75 lines)
- [ ] `trend-analysis.test.ts` ≤ 300 lines (target: ~100 lines)
- [ ] `__tests__/test-helpers.ts` ≤ 300 lines (target: ~50 lines)

### Quality Assurance
- [ ] All existing tests pass without modification
- [ ] No functional changes to calculation logic
- [ ] No breaking changes to public API
- [ ] ESLint passes without suppressions
- [ ] TypeScript compilation succeeds
- [ ] Build succeeds (`npm run build`)

### Architectural Compliance
- [ ] Each file has single, clear responsibility
- [ ] Import dependencies flow in one direction (no circular imports)
- [ ] Test structure mirrors implementation structure
- [ ] Shared test utilities eliminate duplication
- [ ] Clear module boundaries with focused exports

### Code Quality
- [ ] All extracted functions have JSDoc comments
- [ ] Import paths use absolute `@/` paths (not relative)
- [ ] Consistent naming conventions followed
- [ ] No code duplication introduced
- [ ] Maintained comprehensive test coverage (~100%)

## Risk Mitigation

### Risk: Breaking Public API
**Mitigation**:
- Main `calculateTierTrends()` API remains unchanged
- All existing exports remain available from `tier-trends-calculations.ts`
- Update `src/features/data-tracking/index.ts` to maintain public API
- Verify all imports across codebase resolve correctly

### Risk: Test Coverage Loss
**Mitigation**:
- Move tests, don't rewrite them
- Verify test count before/after decomposition
- Run coverage report to ensure no gaps
- Keep integration tests in main file

### Risk: Circular Dependencies
**Mitigation**:
- Follow clear dependency flow: orchestration → analysis → aggregation → grouping
- Avoid cross-imports between peer modules (period-grouping, field-aggregation, trend-analysis)
- Use TypeScript to detect circular imports during build

### Risk: Over-Decomposition
**Mitigation**:
- Maintain logical groupings (don't extract single functions)
- Each file should have 3+ related functions
- Ensure extracted modules are independently testable
- Keep files cohesive (related functions that change together)

## Related Documentation

- **Architecture Standards**: `.ruler/04-engineering-standards.md`
- **React Separation Standards**: `.ruler/06-react-separation.md`
- **Story 05 (Prerequisite)**: `docs/migration-stories/05-tier-trends-feature-reorganization.md`

## Notes

- This decomposition was deferred from Story 05 to keep feature reorganization focused on file location changes
- Decomposition follows natural boundaries identified during analysis
- Test structure mirrors implementation structure for clarity
- All extracted modules are pure logic (no React dependencies)
- Maintains ~100% test coverage for all extracted logic
