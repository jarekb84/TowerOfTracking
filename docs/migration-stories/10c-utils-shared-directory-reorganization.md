# Migration Story 10c: Utils & Shared Directory Reorganization

## Parent PRD Reference
- **Main PRD**: [PRD Enhanced File Structure Organization](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md)
- **Previous Migration**: [10b-logic-directory-elimination.md](10b-logic-directory-elimination.md)
- **File Organization Analysis**: [file-organization-analysis.md](../file-organization-analysis.md)

## Executive Summary

**Problem**: Following the successful elimination of `logic/` directories (Migration 10b), two significant organizational anti-patterns remain:
1. **Data Tracking Utils Directory** (~30+ files) - A generic "dumping ground" that violates purpose-based organization
2. **Analysis Shared Directory** (4 files) - Flat structure without purpose-based subdirectories

**Solution**: Complete the purpose-based reorganization by:
- Eliminating the `data-tracking/utils/` directory through strategic file relocation
- Organizing `analysis/shared/` by purpose (formatting/, parsing/, filtering/)
- Applying the same "organize by PURPOSE, not by TYPE" principle established in Migration 10b

**Scope**:
- ~30+ files in `data-tracking/utils/` to be relocated
- 4 files in `analysis/shared/` to be reorganized
- Cross-feature import updates
- Comprehensive testing of affected features

## Context & Relationship to Migration 10b

### What Migration 10b Accomplished

Migration 10b successfully:
- ✅ Eliminated ALL `logic/` directories (6 total)
- ✅ Established `calculations/` pattern for core engines
- ✅ Updated AI instructions to prevent future `logic/` directories
- ✅ Reorganized ~40+ files into purpose-based locations
- ✅ Applied principle: "Pure functions are STILL part of features"

### Why This Follow-Up Migration is Needed

Migration 10b intentionally deferred Phase 6 and Phase 7 because:
1. **Scope Management**: 30+ utils files warranted separate focused effort
2. **Risk Mitigation**: Testing and validation easier in smaller batches
3. **Review Quality**: Smaller PRs enable better code review
4. **Pattern Validation**: Prove the approach with logic directories first

**This migration completes the work** by applying the same proven principles to the remaining organizational anti-patterns.

## Current State Analysis

### Data Tracking Utils Directory (MAJOR VIOLATION)

**Location**: `src/features/data-tracking/utils/`
**Problem**: 30+ implementation files in single directory (3x the 10-file threshold!)
**Violation Type**: Generic "utils" dumping ground (type-based, not purpose-based)

**File Groups Identified:**

**1. CSV-Related Files (3 files)** - WRONG LOCATION
```
data-tracking/utils/
├── csv-helpers.ts
├── csv-parser.ts
└── csv-persistence.ts
```
- **Problem**: CSV files NOT co-located with CSV import feature
- **Target**: `data-import/csv-import/` (where they're actually used)

**2. Run Type Files (4 files)** - SHOULD BE GROUPED
```
data-tracking/utils/
├── run-type-defaults.ts
├── run-type-detection.ts
├── run-type-display.ts
└── run-type-selector-options.ts
```
- **Problem**: Related files scattered in generic utils
- **Target**: `data-tracking/run-types/` subdirectory OR move to consuming feature

**3. Field Utility Files (6 files)** - SHOULD BE GROUPED
```
data-tracking/utils/
├── field-discovery.ts
├── field-filter.ts
├── field-name-mapping.ts
├── field-search.ts
├── field-similarity.ts
└── internal-field-config.ts
```
- **Problem**: Field-related utilities not organized by purpose
- **Target**: `data-tracking/fields/` subdirectory OR `data-import/` (if primarily used there)

**4. Formatting Files (2 files)** - CROSS-FEATURE CANDIDATES
```
data-tracking/utils/
├── date-formatters.ts
└── string-formatters.ts
```
- **Problem**: Generic formatters in feature-specific directory
- **Target**: `src/shared/formatting/` (if cross-feature) OR stay in data-tracking

**5. Remaining Utility Files (3+ files)**
```
data-tracking/utils/
├── data-migrations.ts
├── duplicate-detection.ts
└── tournament-tier-parsing.ts
```
- **Analysis Needed**: Map consumers and determine purpose-based locations

### Analysis Shared Directory

**Location**: `src/features/analysis/shared/`
**Problem**: Flat structure, no purpose-based subdirectories
**Files**: 4 implementation files

**Current Structure:**
```
analysis/shared/
├── chart-formatters.ts
├── data-parser.ts
├── field-utils.ts
└── run-type-filter.ts
```

**Issues:**
1. No purpose-based organization
2. Unclear which files are truly shared (2+ consumers) vs should move to single feature
3. Missing subdirectory groupings

**Target Structure:**
```
analysis/shared/
├── formatting/              # Purpose: chart/number formatting
│   └── chart-formatters.ts
├── parsing/                 # Purpose: data parsing/transformation
│   └── data-parser.ts
└── filtering/               # Purpose: filtering utilities
    ├── field-utils.ts
    └── run-type-filter.ts
```

**OR** - If files have single consumers, move them to those features instead.

## Target State

### Data Tracking Utils Elimination

**BEFORE:**
```
data-tracking/
└── utils/ (30+ files)       # ❌ Generic dumping ground
```

**AFTER:**
```
data-tracking/
├── run-types/               # ✅ Purpose-based grouping
│   ├── run-type-defaults.ts
│   ├── run-type-detection.ts
│   ├── run-type-display.ts
│   └── run-type-selector-options.ts
│
├── fields/                  # ✅ Purpose-based grouping
│   ├── field-discovery.ts
│   ├── field-filter.ts
│   ├── field-name-mapping.ts
│   ├── field-search.ts
│   ├── field-similarity.ts
│   └── internal-field-config.ts
│
├── data-migrations.ts       # ✅ Co-located at feature root (single purpose)
├── duplicate-detection.ts   # ✅ Co-located at feature root (single purpose)
└── tournament-tier-parsing.ts # ✅ Co-located at feature root (single purpose)

data-import/csv-import/      # ✅ CSV files moved to where they're used
├── csv-import-dialog.tsx
├── use-csv-import.ts
├── csv-helpers.ts           # Moved from data-tracking/utils/
├── csv-parser.ts            # Moved from data-tracking/utils/
└── csv-persistence.ts       # Moved from data-tracking/utils/

shared/formatting/           # ✅ Cross-feature formatters (if applicable)
├── date-formatters.ts       # Moved from data-tracking/utils/ (if cross-feature)
└── string-formatters.ts     # Moved from data-tracking/utils/ (if cross-feature)
```

### Analysis Shared Reorganization

**BEFORE:**
```
analysis/shared/
├── chart-formatters.ts
├── data-parser.ts
├── field-utils.ts
└── run-type-filter.ts
```

**AFTER (Option A - Organize by Purpose):**
```
analysis/shared/
├── formatting/
│   └── chart-formatters.ts
├── parsing/
│   └── data-parser.ts
└── filtering/
    ├── field-utils.ts
    └── run-type-filter.ts
```

**AFTER (Option B - Move to Consumers if Single-Use):**
```
# If consumer analysis reveals single consumers:
# - Move chart-formatters.ts to time-series/ (if only used there)
# - Move data-parser.ts to tier-trends/ (if only used there)
# - etc.
```

## Implementation Tasks

### Phase 1: Investigation & Consumer Mapping (2-3 hours)

**Task 1.1: Map Data Tracking Utils Consumers**
- [ ] For each file in `data-tracking/utils/`, run grep to find ALL imports
- [ ] Document consumers for each file
- [ ] Categorize by usage pattern:
  - Single feature consumer → move to that feature
  - Multiple feature consumers → keep in shared with purpose-based organization
  - Cross-feature utilities → evaluate for `src/shared/`

**Task 1.2: Analyze Analysis Shared Consumers**
- [ ] For each file in `analysis/shared/`, find all consumers
- [ ] Determine if truly shared (2+ features) or single consumer
- [ ] Plan: reorganize with subdirectories OR move to single consumer

**Task 1.3: Create Detailed Movement Plan**
- [ ] Document exact source → target paths for each file
- [ ] Identify import update locations
- [ ] Estimate test impact
- [ ] Create ordered execution plan (least risky first)

### Phase 2: CSV Files Migration (1 hour)

**Task 2.1: Move CSV Files to CSV Import Feature**
- [ ] Move `data-tracking/utils/csv-helpers.ts` → `data-import/csv-import/csv-helpers.ts`
- [ ] Move `data-tracking/utils/csv-parser.ts` → `data-import/csv-import/csv-parser.ts`
- [ ] Move `data-tracking/utils/csv-persistence.ts` → `data-import/csv-import/csv-persistence.ts`
- [ ] Move corresponding test files

**Task 2.2: Update CSV Import References**
- [ ] Update imports in `data-import/csv-import/` components
- [ ] Update any cross-feature imports from `data-tracking/index.ts`
- [ ] Run CSV import tests to verify

### Phase 3: Run Type Files Reorganization (1-2 hours)

**Task 3.1: Create Run Types Subdirectory**
- [ ] Create `data-tracking/run-types/` directory
- [ ] Move run-type files from `utils/` to `run-types/`:
  - `run-type-defaults.ts`
  - `run-type-detection.ts`
  - `run-type-display.ts`
  - `run-type-selector-options.ts`
- [ ] Move corresponding test files

**Task 3.2: Update Run Type Imports**
- [ ] Find all imports using grep
- [ ] Update internal data-tracking imports
- [ ] Update cross-feature imports
- [ ] Update `data-tracking/index.ts` exports
- [ ] Run tests

### Phase 4: Field Utilities Reorganization (1-2 hours)

**Task 4.1: Analyze Field Utilities Consumers**
- [ ] Determine if primarily used by data-import OR data-tracking
- [ ] Decision: `data-tracking/fields/` OR `data-import/fields/`

**Task 4.2: Create Fields Subdirectory**
- [ ] Create target subdirectory based on consumer analysis
- [ ] Move field utility files:
  - `field-discovery.ts`
  - `field-filter.ts`
  - `field-name-mapping.ts`
  - `field-search.ts`
  - `field-similarity.ts`
  - `internal-field-config.ts`
- [ ] Move corresponding test files

**Task 4.3: Update Field Utility Imports**
- [ ] Update imports across all consumers
- [ ] Update exports in relevant index files
- [ ] Run affected tests

### Phase 5: Formatting Files Evaluation (1 hour)

**Task 5.1: Analyze Formatter Consumers**
- [ ] For `date-formatters.ts`: Find all consumers
  - If 1 feature → move to that feature
  - If 2+ features → move to `src/shared/formatting/`
  - If only data-tracking → keep in data-tracking (create `formatting/` subdir)
- [ ] Repeat for `string-formatters.ts`

**Task 5.2: Execute Formatter Relocation**
- [ ] Move formatters based on consumer analysis
- [ ] Update imports across all consumers
- [ ] Run tests

### Phase 6: Remaining Utils Files (1-2 hours)

**Task 6.1: Process Individual Files**
- [ ] `data-migrations.ts`: Analyze consumers, move to appropriate location
- [ ] `duplicate-detection.ts`: Analyze consumers, move to appropriate location
- [ ] `tournament-tier-parsing.ts`: Analyze consumers, move to appropriate location
- [ ] Any other discovered files: same process

**Task 6.2: Delete Utils Directory**
- [ ] Verify `data-tracking/utils/` is empty
- [ ] Delete empty directory
- [ ] Verify no broken imports

### Phase 7: Analysis Shared Reorganization (1 hour)

**Task 7.1: Evaluate Each Shared File**
- [ ] `chart-formatters.ts`: Consumer analysis → decision
- [ ] `data-parser.ts`: Consumer analysis → decision
- [ ] `field-utils.ts`: Consumer analysis → decision
- [ ] `run-type-filter.ts`: Consumer analysis → decision

**Task 7.2: Execute Reorganization**
- [ ] If organizing by purpose: Create subdirectories and move files
- [ ] If moving to consumers: Relocate to single-feature directories
- [ ] Update imports across all consumers
- [ ] Run tests

### Phase 8: Verification & Testing (2-3 hours)

**Task 8.1: Comprehensive Build & Test Verification**
- [ ] Run `npm run build` - must pass
- [ ] Run `npm run test` - must pass
- [ ] Run `npm run type-check` - must pass
- [ ] Run `npm run lint` - must pass

**Task 8.2: Manual Feature Testing**
- [ ] Data import (CSV and manual entry)
- [ ] All analysis pages (tier-trends, tier-stats, deaths-radar, time-series)
- [ ] Run type filtering across features
- [ ] Field discovery and mapping
- [ ] Data export functionality

**Task 8.3: Verify No Utils Violations Remain**
- [ ] Run: `find src/features -type d -name "utils"`
- [ ] For each result, count implementation files
- [ ] Flag if >10 files without sub-grouping
- [ ] Document any acceptable utils directories (with justification)

**Task 8.4: Verify Shared Organization**
- [ ] Check `analysis/shared/` has purpose-based subdirectories OR files moved to consumers
- [ ] Verify all shared files have 2+ consumers (document exceptions)
- [ ] Check no flat shared directories remain

## Migration Rules & Decision Framework

### Universal Rules (Apply to ALL Reorganizations)

1. **NO LOGIC CHANGES**: Only move files and update imports - ZERO behavior changes
2. **Move Tests With Implementation**: `*.test.ts` files move with their source files
3. **Update Imports Systematically**: External consumers first, then internal cross-references
4. **Verify After Each Phase**: Run build + tests after completing each phase
5. **Co-locate by Purpose**: Put files where they serve a PURPOSE, not where they're "pure"

### Decision Framework for Utils Files

**When relocating a utils file, ask:**

**Q1: "How many distinct features consume this file?"**
- 1 feature → Move to that feature (co-locate with consumer)
- 2-3 features within same domain → Create purpose-based subdirectory in domain
- 3+ features across domains → Evaluate for `src/shared/`

**Q2: "What is the PRIMARY PURPOSE of this file?"**
- CSV operations → `data-import/csv-import/`
- Run type operations → `data-tracking/run-types/`
- Field operations → `data-tracking/fields/` OR `data-import/fields/`
- Formatting → `shared/formatting/` OR feature-specific `formatting/`
- Generic utility → Re-examine, find specific purpose

**Q3: "Is this file part of a cohesive group?"**
- Yes, 3+ related files → Create purpose-based subdirectory
- No, standalone file → Move to feature root OR consuming feature

**Q4: "Is this truly reusable or prematurely extracted?"**
- Used by 2+ features NOW → Shared (with purpose-based organization)
- Might be used someday → NOT shared, keep in feature
- Used by 1 feature → Absolutely move to that feature

### Decision Framework for Shared Files

**For each file in `analysis/shared/`, ask:**

**Q1: "How many analysis features use this?"**
- 1 feature → Move to that feature
- 2+ features → Keep in shared, organize by purpose

**Q2: "What PURPOSE does this serve?"**
- Formatting/display → `shared/formatting/`
- Parsing/transformation → `shared/parsing/`
- Filtering/selection → `shared/filtering/`
- Multiple purposes → Consider splitting file

**Q3: "Could this be useful outside analysis domain?"**
- Yes → Evaluate moving to `src/shared/<domain>/`
- No → Keep in `analysis/shared/<purpose>/`

## Success Criteria

### Required Outcomes
- [ ] ZERO files remain in `data-tracking/utils/` directory
- [ ] `data-tracking/utils/` directory deleted
- [ ] ALL analysis/shared files organized by purpose OR moved to single consumers
- [ ] NO flat shared directories (must have purpose-based subdirectories OR be eliminated)
- [ ] NO directories with 10+ implementation files without sub-grouping
- [ ] All tests passing
- [ ] All features functioning identically to before migration

### Quality Indicators
- [ ] Can find any utility by PURPOSE, not by "it's a utility"
- [ ] Shared files have clear purpose-based organization
- [ ] CSV files co-located with CSV import feature
- [ ] Run type files grouped together
- [ ] Field utilities grouped together
- [ ] No generic "dumping ground" directories remain

### Documentation Deliverables
- [ ] Migration summary documenting all file movements
- [ ] Consumer analysis for all relocated files
- [ ] Import update summary
- [ ] Testing results and manual verification notes

## Risk Mitigation

### High-Risk Areas

**1. CSV Files (High Usage)**
- Risk: CSV import is critical user flow
- Mitigation: Test CSV import thoroughly after relocation
- Rollback: Clear git history for easy revert

**2. Field Utilities (Many Consumers)**
- Risk: Used across multiple features
- Mitigation: Comprehensive grep for all imports before moving
- Verification: Run all affected feature tests

**3. Formatters (Potential Cross-Feature)**
- Risk: May be used in unexpected places
- Mitigation: Full consumer analysis before deciding shared vs feature-specific

### Testing Strategy

**Per-Phase Testing:**
- Run tests after EACH phase completion
- Don't proceed to next phase if tests fail
- Document which tests cover each moved file

**Integration Testing:**
- Manual testing of ALL affected user flows
- Focus on CSV import, data tracking, and analysis features
- Verify no runtime errors in browser console

## Benefits of This Migration

### Immediate Benefits
1. **Improved Discoverability**: Find files by PURPOSE, not generic "utils"
2. **Clearer Organization**: Related files grouped together
3. **Better Co-location**: CSV files with CSV import, field utils with field operations
4. **Consistent Patterns**: Matches logic directory elimination principles
5. **Reduced Entropy**: Clear homes for new utilities

### Long-Term Benefits
1. **Easier Refactoring**: Related files already together
2. **Clearer Feature Boundaries**: Purpose-based organization shows domain ownership
3. **Better AI Understanding**: AI navigates by purpose, not by file type
4. **Prevents Drift**: No more "where does this utility go?" confusion
5. **Scalable Pattern**: Works for current AND future utilities

## Relationship to Parent PRD

This migration completes the file organization goals outlined in the parent PRD:
- **Parent PRD Goal**: "Organize code by business features/concepts, NEVER by file types"
- **Migration 10b**: Eliminated `logic/` directories
- **Migration 10c**: Eliminates `utils/` dumping ground and organizes `shared/` by purpose
- **Combined Impact**: Comprehensive purpose-based organization across ALL file types

## Notes & Considerations

### Why This Matters

**Developer Experience:**
- Faster utility discovery (search by purpose, not by "utils")
- Easier feature comprehension (all related files together)
- Clearer onboarding (structure explains itself)

**AI Agent Performance:**
- Better context understanding (purpose-based structure)
- Improved file discovery (semantic navigation)
- Clearer relationships (co-located dependencies)

**Long-Term Maintenance:**
- Prevents entropy (clear organization prevents drift)
- Scalable pattern (works for growing codebase)
- Self-documenting (directory names explain purpose)

### Common Pitfalls to Avoid

1. **Don't create purpose subdirectories prematurely**
   - Wait until 3+ files share the purpose
   - For 1-2 files, keep at feature root

2. **Don't assume shared without consumer analysis**
   - Verify 2+ features actually use the file
   - Move to single consumer if only 1 feature uses it

3. **Don't batch-move without testing**
   - Move files in logical groups
   - Test after each group before moving to next

4. **Don't forget internal imports**
   - When moving file A, check if it imports other files
   - Update its imports to reference correct relative paths

## Related Documents

- **Parent PRD**: [PRD Enhanced File Structure Organization](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md)
- **Previous Migration**: [10b-logic-directory-elimination.md](10b-logic-directory-elimination.md)
- **AI Instructions**: `.ruler/04-engineering-standards.md`, `.claude/agents/architecture-review.md`
- **Architecture Analysis**: [file-organization-analysis.md](../file-organization-analysis.md)
