# Migration Story 11B: Game Run Types File Decomposition

## Parent Context

**Related PRD**: [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md)

**Migration Philosophy**: Fight entropy by co-locating type definitions with the features that own them, rather than creating centralized type files that become catch-all dumping grounds.

## Problem Statement

### Current Anti-Pattern

The file [src/shared/types/game-run.types.ts](../../src/shared/types/game-run.types.ts) has become a **centralized type dumping ground** with ~200 lines of type definitions that violate feature-based co-location principles:

**Statistics** (as of analysis):
- **130 files** import from this single file
- **~87 non-test files** reference these types
- Contains types from multiple distinct domains:
  - Core game data structures (`ParsedGameRun`, `GameRunField`, `RawGameRunData`)
  - CSV parsing/export configuration (`CsvDelimiter`, `CsvParseConfig`, `CsvParseResult`)
  - Tier trends analysis filters (`TrendsDuration`, `TrendsAggregation`, `TierTrendsFilters`)
  - Tier trends data structures (`FieldTrendData`, `ComparisonColumn`, `TierTrendsData`)
  - Duration/number parsing utilities (`DurationUnit`, `NumberSuffix`)
  - Field mapping reports (`FieldMappingReport`)

### Why This Is a Code Smell

**Type-Based Organization Violation**:
- Equivalent to having `components/`, `hooks/`, `logic/` directories at the feature level
- Groups code by **file type** (types) instead of **business domain** (feature/concept)
- Creates false sense of organization while scattering related concerns

**Co-Location Principle Violation**:
- Types are separated from the code that creates/uses them
- 87 files importing from a single location creates tight coupling
- Hard to understand which types belong to which features
- Difficult to refactor features independently

**Ownership Ambiguity**:
- Who owns `TrendsDuration`? The tier-trends feature.
- Who owns `CsvDelimiter`? The CSV import/export features.
- Who owns `ParsedGameRun`? Potentially shared across multiple features.
- All mixed together with no clear ownership boundaries.

**Examples of Misplaced Types**:

```typescript
// ❌ BAD: Tier trends types in global file
export enum TrendsDuration {
  PER_RUN = 'per-run',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// Used ONLY in: src/features/analysis/tier-trends/
// Should live IN that feature directory
```

```typescript
// ❌ BAD: CSV import types in global file
export type CsvDelimiter = 'tab' | 'comma' | 'semicolon' | 'custom';

export interface CsvParseConfig {
  delimiter?: string;
  supportedFields: string[];
}

// Used ONLY in: src/features/data-import/csv-import/
// Should live IN that feature directory
```

```typescript
// ✅ MAYBE OK: Core shared type
export interface ParsedGameRun {
  id: string;
  timestamp: Date;
  fields: Record<string, GameRunField>;
  // ...
}

// Used across: data-import, game-runs, analysis features
// Legitimate candidate for shared/types/ (if truly cross-feature)
```

## Goals

### Primary Goals

1. **Decompose Centralized Types File**: Break up [game-run.types.ts](../../src/shared/types/game-run.types.ts) into feature-owned type definitions
2. **Co-locate Types with Features**: Move type definitions to the features that own/create them
3. **Identify Truly Shared Types**: Determine which types (if any) are legitimately used across 3+ features
4. **Update 130 Import References**: Systematically update all import statements across the codebase
5. **Update AI Instructions**: Prevent future type-based organization anti-patterns

### Secondary Goals

6. **Simplify Type Discovery**: Make it obvious where to find type definitions (in feature that uses them)
7. **Improve Feature Independence**: Allow features to be modified without affecting unrelated types
8. **Document Type Ownership**: Clear ownership boundaries for all type definitions

## Investigation Phase (REQUIRED FIRST)

### Step 1: Audit Type Usage

For **each type** in [game-run.types.ts](../../src/shared/types/game-run.types.ts), determine:

**A. Ownership Analysis**:
- Which feature(s) **create/build** instances of this type?
- Which feature(s) **consume/use** this type?
- How many distinct features reference this type?

**B. Classification**:
- **Feature-Owned**: Used by single feature → move to that feature
- **Shared Across 2 Features**: Consider extraction, but may stay in feature
- **Truly Shared (3+ Features)**: Legitimate candidate for `shared/types/`
- **Ambiguous Ownership**: Requires design decision

**C. Usage Pattern**:
- Is this type a **data structure** (created by one feature, consumed by others)?
- Is this type a **configuration** (used only within one feature)?
- Is this type a **constant/enum** (referenced across features)?

### Step 2: Create Type Ownership Matrix

Document findings in a table:

| Type Name | Current Location | Features Using | Owner Feature | Classification | Target Location |
|-----------|-----------------|----------------|---------------|----------------|-----------------|
| `ParsedGameRun` | game-run.types.ts | data-import, game-runs, analysis (4 features) | data-import | Truly Shared | `shared/types/game-run.types.ts` |
| `TrendsDuration` | game-run.types.ts | analysis/tier-trends | tier-trends | Feature-Owned | `features/analysis/tier-trends/types.ts` |
| `CsvDelimiter` | game-run.types.ts | data-import/csv-import | csv-import | Feature-Owned | `features/data-import/csv-import/types.ts` |
| ... | ... | ... | ... | ... | ... |

### Step 3: Identify Import Hotspots

**Run analysis**:
```bash
# For each type, find all importers
grep -r "TrendsDuration" src/ --include="*.ts" --include="*.tsx" | grep -v ".test." | wc -l
grep -r "CsvDelimiter" src/ --include="*.ts" --include="*.tsx" | grep -v ".test." | wc -l
grep -r "ParsedGameRun" src/ --include="*.ts" --include="*.tsx" | grep -v ".test." | wc -l
```

**Expected Findings**:
- Feature-specific types: 1-10 files (all in same feature)
- Truly shared types: 20+ files (across multiple features)

## Target State

### Desired File Structure

```
src/
├── shared/
│   └── types/
│       └── game-run.types.ts           # ONLY truly shared types (3+ features)
│           ├── ParsedGameRun           # Core game run interface
│           ├── GameRunField            # Field structure
│           ├── RawGameRunData          # Raw clipboard data
│           └── (2-5 other truly shared types)
│
├── features/
│   ├── data-import/
│   │   └── csv-import/
│   │       ├── types.ts                # CSV import-specific types
│   │       │   ├── CsvDelimiter
│   │       │   ├── CsvParseConfig
│   │       │   ├── CsvParseResult
│   │       │   └── FieldMappingReport
│   │       └── ...
│   │
│   ├── data-export/
│   │   └── csv-export/
│   │       ├── types.ts                # CSV export-specific types
│   │       │   └── (any CSV export-specific types)
│   │       └── ...
│   │
│   ├── game-runs/
│   │   ├── types.ts                    # Game runs table-specific types
│   │   │   └── GameRunFilters         # If only used by this feature
│   │   └── ...
│   │
│   └── analysis/
│       └── tier-trends/
│           ├── types.ts                # Tier trends-specific types
│           │   ├── TrendsDuration
│           │   ├── TrendsAggregation
│           │   ├── TierTrendsFilters
│           │   ├── FieldTrendData
│           │   ├── ComparisonColumn
│           │   └── TierTrendsData
│           └── ...
```

### Type Organization Rules

**Feature-Owned Types** (Default):
- **When**: Type is used by single feature OR created/owned by single feature
- **Location**: `features/<feature>/types.ts` or alongside implementation
- **Example**: `TrendsDuration` → `features/analysis/tier-trends/types.ts`

**Shared Within Feature Domain** (2 features):
- **When**: Type is shared between 2 related sub-features
- **Location**: `features/<domain>/shared/types.ts`
- **Example**: If shared across tier-trends and tier-stats

**Truly Shared Types** (3+ features):
- **When**: Type is used across 3+ distinct features
- **Location**: `shared/types/<domain>.types.ts`
- **Example**: `ParsedGameRun` used by data-import, game-runs, analysis

**Co-located Types** (Specific component/hook):
- **When**: Type is used only by single file or tightly coupled files
- **Location**: Same file as implementation OR adjacent `<file>.types.ts`
- **Example**: Component-specific prop types

### Type Definition Guidelines

**When NOT to Create Separate Types File**:
- Type is used by single component → define in same file
- Type is simple prop interface → define inline
- Type is tightly coupled to implementation → keep together

**When TO Create Types File**:
- 3+ related types for a feature/concept
- Types are referenced by multiple files within feature
- Types represent core data structures

**Naming Convention**:
- Feature types: `features/<feature>/types.ts` (simple)
- Shared types: `shared/types/<domain>.types.ts` (scoped)
- Component types: `<component-name>.types.ts` (if separate)

## Implementation Tasks

### Phase 1: Type Ownership Analysis

**Tasks**:
1. [ ] Create Type Ownership Matrix (see Investigation Phase)
2. [ ] Classify each type in [game-run.types.ts](../../src/shared/types/game-run.types.ts)
3. [ ] Identify truly shared types (used by 3+ features)
4. [ ] Document ownership decisions and rationale

**Deliverable**: Type Ownership Matrix document

### Phase 2: Create Feature Types Files

**For each feature with types to migrate**:

1. [ ] Create `types.ts` in feature directory (if doesn't exist)
2. [ ] Move feature-owned types from [game-run.types.ts](../../src/shared/types/game-run.types.ts)
3. [ ] Add JSDoc comments documenting type ownership
4. [ ] Create barrel export if needed

**Example**:
```typescript
// src/features/analysis/tier-trends/types.ts

/**
 * Tier Trends Analysis Type Definitions
 *
 * These types are owned by the tier-trends feature and should only be
 * imported by components within this feature or features directly using
 * tier trends functionality.
 */

/**
 * Duration options for tier trends analysis
 */
export enum TrendsDuration {
  PER_RUN = 'per-run',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * Aggregation methods for combining run data within time periods
 */
export enum TrendsAggregation {
  SUM = 'sum',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  HOURLY = 'hourly'
}

// ... other tier-trends types
```

### Phase 3: Update Shared Types File

**Tasks**:
1. [ ] Identify truly shared types (3+ features)
2. [ ] Keep only shared types in `shared/types/game-run.types.ts`
3. [ ] Add clear documentation about what belongs here
4. [ ] Add JSDoc comments for each shared type

**Example Reduced File**:
```typescript
// src/shared/types/game-run.types.ts

/**
 * Core Game Run Type Definitions
 *
 * ONLY types that are used across 3+ distinct features should live here.
 * Feature-specific types should be co-located with their owning feature.
 *
 * Current shared types:
 * - ParsedGameRun: Used by data-import, game-runs, analysis features
 * - GameRunField: Core field structure used throughout
 * - RawGameRunData: Used by data-import and game-runs
 */

// Raw data structure as pasted from clipboard
export type RawGameRunData = Record<string, string>;

// Main game run interface with enhanced field structure
export interface ParsedGameRun {
  id: string;
  timestamp: Date;
  fields: Record<string, GameRunField>;

  // Cached computed properties for performance
  readonly tier: number;
  readonly wave: number;
  readonly coinsEarned: number;
  readonly cellsEarned: number;
  readonly realTime: number;
  readonly runType: RunTypeValue;
}

// Enhanced field interface for single source of truth
export interface GameRunField {
  value: number | string | Date;
  rawValue: string;
  displayValue: string;
  originalKey: string;
  dataType: 'number' | 'duration' | 'string' | 'date';
}

// Run type enumeration (if used across features)
export enum RunType {
  FARM = 'farm',
  TOURNAMENT = 'tournament',
  MILESTONE = 'milestone'
}

export type RunTypeValue = `${RunType}`;
```

### Phase 4: Update Import Statements (Systematic)

**CRITICAL**: This affects 130 files. Must be systematic and testable.

**Process**:
1. [ ] Update imports feature-by-feature (not file-by-file)
2. [ ] Run tests after each feature migration
3. [ ] Use find-and-replace with verification

**Example Import Updates**:

```typescript
// ❌ BEFORE: Importing tier-trends types from shared
import { TrendsDuration, TrendsAggregation } from '@/shared/types/game-run.types'

// ✅ AFTER: Importing from feature
import { TrendsDuration, TrendsAggregation } from './types'
// OR
import { TrendsDuration, TrendsAggregation } from '@/features/analysis/tier-trends/types'
```

```typescript
// ❌ BEFORE: Importing CSV types from shared
import { CsvDelimiter, CsvParseConfig } from '@/shared/types/game-run.types'

// ✅ AFTER: Importing from feature
import { CsvDelimiter, CsvParseConfig } from './types'
// OR
import { CsvDelimiter, CsvParseConfig } from '@/features/data-import/csv-import/types'
```

```typescript
// ✅ STILL OK: Importing truly shared types
import { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types'
```

**Migration Order** (safest approach):
1. Start with most isolated feature (fewest cross-feature imports)
2. Update all files in that feature
3. Run tests
4. Move to next feature
5. Repeat until all features migrated

**Suggested Order**:
1. [ ] `features/data-import/csv-import/` (CSV types)
2. [ ] `features/data-export/csv-export/` (Export types)
3. [ ] `features/analysis/tier-trends/` (Tier trends types)
4. [ ] `features/game-runs/` (Game runs types)
5. [ ] Verify `shared/types/game-run.types.ts` only has truly shared types

### Phase 5: Testing and Verification

**After Each Feature Migration**:
- [ ] Run `npm run build` - verify no build errors
- [ ] Run `npm run test` - verify tests pass
- [ ] Run `npm run type-check` - verify TypeScript compilation

**After Full Migration**:
- [ ] Full build passes
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual smoke test of all features
- [ ] Verify no unused imports
- [ ] Verify no circular dependencies

### Phase 6: Update AI Instructions

**File to Update**: `.ruler/04-engineering-standards.md`

**Add New Section**: "Type Definition Co-Location"

**Content**:
```markdown
## Type Definition Co-Location

**CRITICAL**: Avoid centralized type files. Co-locate type definitions with the features that own them.

### Type Organization Anti-Patterns

**FORBIDDEN**:
- ❌ Creating catch-all `types.ts` files with types from multiple features
- ❌ Placing feature-specific types in `shared/types/` just because they're types
- ❌ Separating type definitions from implementation that creates/uses them
- ❌ Centralizing types "for convenience" without considering ownership

**Why These Are Code Smells**:
- Equivalent to `components/`, `hooks/`, `logic/` directories (type-based organization)
- Violates co-location principle (related code should be together)
- Creates false dependencies (many files importing from single location)
- Obscures ownership (unclear which feature owns which type)

### Type Co-Location Rules

**Feature-Owned Types** (Default):
- **When**: Type is created/used by single feature
- **Location**: `features/<feature>/types.ts` OR same file as implementation
- **Example**: `TrendsDuration` enum used only in tier-trends → `tier-trends/types.ts`

**Shared Within Feature Domain**:
- **When**: Type is shared between 2 sub-features of same domain
- **Location**: `features/<domain>/shared/types.ts`
- **Example**: Type shared between tier-trends and tier-stats

**Truly Shared Types** (Rare):
- **When**: Type is used across 3+ distinct features
- **Location**: `shared/types/<domain>.types.ts`
- **Example**: `ParsedGameRun` used by data-import, game-runs, analysis

**Component-Specific Types**:
- **When**: Type is used only by single component/hook
- **Location**: Same file as component OR adjacent `<component>.types.ts`
- **Example**: Component prop interfaces

### Type File Creation Guidelines

**DON'T create separate types file when**:
- Type is used by single component → define inline
- Type is simple prop interface → keep with component
- Type is tightly coupled to implementation → same file

**DO create types file when**:
- 3+ related types for a feature/concept
- Types are referenced by multiple files within feature
- Types represent core domain data structures
- Types have complex JSDoc documentation

### Type Import Patterns

**Good**:
```typescript
// Importing from owning feature
import { TrendsDuration } from './types'
import { TrendsDuration } from '@/features/analysis/tier-trends/types'

// Importing truly shared type
import { ParsedGameRun } from '@/shared/types/game-run.types'
```

**Bad**:
```typescript
// Feature-specific type in shared location
import { TrendsDuration } from '@/shared/types/game-run.types'

// All types dumped in single file
import {
  TrendsDuration,      // tier-trends feature
  CsvDelimiter,        // csv-import feature
  DeathStats,          // deaths-radar feature
} from '@/shared/types/game-run.types'
```

### Refactoring Trigger

**When touching code that imports from centralized type file**:
- [ ] Evaluate if type is feature-specific
- [ ] If yes, move type to owning feature
- [ ] Update imports in that feature
- [ ] Document remaining truly shared types

### Architecture Review Checklist

**For every PR, verify**:
- [ ] No new types added to `shared/types/` without justification (3+ features)
- [ ] Feature-specific types are co-located with feature
- [ ] Type files don't contain unrelated types from multiple features
- [ ] Type ownership is clear from file location
```

## Migration Rules

### Critical Constraints

**MANDATORY**:
- [ ] **No Behavior Changes**: This is purely structural - zero logic changes
- [ ] **Verify Before Move**: Confirm type ownership before moving
- [ ] **Test After Each Feature**: Don't batch all changes without testing
- [ ] **Document Decisions**: Record why types were classified as shared vs feature-owned
- [ ] **Update Systematically**: Feature-by-feature, not file-by-file

**FORBIDDEN**:
- ❌ Moving types without updating all imports
- ❌ Changing type definitions while moving them
- ❌ Skipping tests between feature migrations
- ❌ Guessing at type ownership without investigation

### Boy-Scout Rule Application

**When touching any file that imports from `game-run.types.ts`**:
- Evaluate if imported types are feature-specific
- Move feature-specific types to owning feature
- Update imports in current PR
- Don't reorganize unrelated types

### Rollback Plan

**If issues arise**:
1. **Partial Rollback**: Can rollback single feature migration
2. **Full Rollback**: All changes in single PR, easy to revert
3. **Verification**: Tests must pass before merging

## Success Criteria

### Primary Success Criteria

- [ ] `shared/types/game-run.types.ts` contains ONLY truly shared types (3+ features)
- [ ] All feature-specific types moved to owning features
- [ ] All 130 import references updated correctly
- [ ] Zero TypeScript compilation errors
- [ ] All tests passing (unit, integration, e2e)
- [ ] Application builds successfully
- [ ] AI instructions updated to prevent future violations

### Secondary Success Criteria

- [ ] Type ownership is obvious from file location
- [ ] Reduced coupling (files don't import from unrelated features)
- [ ] Improved feature independence (can modify feature types without affecting others)
- [ ] Developer can find type definitions intuitively
- [ ] No orphaned type definitions
- [ ] Type Ownership Matrix documented for reference

## Potential Issues and Solutions

### Issue 1: Type Used Across Many Features

**Symptom**: Type appears to be used by 5+ features

**Solution**:
1. Verify actual usage (some may be transitive imports)
2. If legitimately shared, keep in `shared/types/`
3. Document why it's truly shared

### Issue 2: Circular Dependencies

**Symptom**: Feature A imports from Feature B, which imports from Feature A

**Solution**:
1. Identify shared dependency
2. Extract to `shared/types/`
3. Both features import from shared location

### Issue 3: Ambiguous Type Ownership

**Symptom**: Type is created by Feature A but primarily used by Feature B

**Solution**:
1. Determine which feature "owns" the concept
2. Place type in owner feature
3. Other feature imports from owner
4. Document the dependency

### Issue 4: Too Many Types in Single Feature File

**Symptom**: Feature `types.ts` file exceeds 200 lines

**Solution**:
1. Split into multiple type files by sub-concept
2. Create `types/` subdirectory with multiple files
3. Example: `types/filters.types.ts`, `types/data.types.ts`

### Issue 5: Test Files Break After Migration

**Symptom**: Tests fail with import errors after moving types

**Solution**:
1. Update test imports to match new locations
2. Consider if test should be in feature directory
3. Update test factories/fixtures to import from new location

## Post-Migration Activities

### Immediate Follow-Up

1. **Monitor for Issues**: Watch for bug reports related to type errors
2. **Gather Feedback**: Ask developers about type discoverability
3. **Refine if Needed**: Small adjustments based on usage patterns
4. **Update Onboarding**: Document type organization for new developers

### Long-Term Improvements

1. **Enforce in PR Reviews**: Check for centralized type anti-patterns
2. **Architecture Agent Updates**: Ensure agent flags type violations
3. **Documentation**: Keep type organization examples up to date
4. **Periodic Audits**: Check for type file drift every quarter

## Notes

- **No Rush**: Thoroughness is critical for type migrations
- **Document Everything**: Decisions, rationale, ownership boundaries
- **Test Continuously**: After each feature migration
- **Rollback Ready**: Single PR makes rollback easy if needed
- **Future-Proof**: AI instructions prevent regression

## Estimated Effort

**Investigation Phase**: 2-3 hours
- Type ownership analysis
- Usage pattern identification
- Classification and documentation

**Implementation Phase**: 4-6 hours
- Create feature type files
- Move type definitions
- Update 130 import references
- Testing after each feature

**AI Instructions Update**: 1 hour
- Document type co-location rules
- Add to engineering standards
- Update architecture review checklist

**Total Estimated Effort**: 7-10 hours

**Suggested Approach**: Split into 2 PRs
1. **PR 1**: Investigation + Type ownership documentation
2. **PR 2**: Implementation + AI instruction updates
