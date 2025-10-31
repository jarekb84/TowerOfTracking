# File Organization Migration - Executive Summary

## Overview

This directory contains **10 incremental migration stories** that transform the TowerOfTracking codebase from a type-based structure (components/, hooks/, logic/, utils/) to a feature-based structure (data-import/, data-export/, settings/, game-runs/, analysis/).

## Quick Stats

- **Total Stories**: 10
- **Total Files to Migrate**: ~140+ files
- **Estimated Timeline**: 40-80 hours (spread over multiple days/weeks)
- **Migration Approach**: Sequential, incremental, one feature at a time
- **Risk Level**: Low (each story is atomic and revertible)

## Why This Migration?

### Current Problems

1. **Poor discoverability**: 22 files for a single feature scattered across 4 directories
2. **Flat structure**: 38 files in `components/` with no conceptual grouping
3. **Scattered related code**: Component separated from its hook and logic
4. **Unclear boundaries**: Can't see where one feature ends and another begins

### After Migration

1. **Clear feature boundaries**: All related files together in one directory
2. **Hierarchical organization**: Sub-features grouped logically (filters/, table/, mobile/)
3. **Self-documenting structure**: Directory names reveal architecture
4. **Developer efficiency**: "Modify filter behavior" → navigate to `filters/` subdirectory

## Migration Stories at a Glance

| # | Story | Feature | Files | Complexity | Duration | Dependencies |
|---|-------|---------|-------|------------|----------|--------------|
| 01 | Data Import | data-import/ | ~14 | Low | 2-4h | None |
| 02 | Data Export | data-export/ | ~8 | Low | 2-4h | None |
| 03 | Settings | settings/ | ~13 | Low | 2-4h | None |
| 04 | Game Runs | game-runs/ | ~28 | High | 8-12h | Settings |
| 05 | Tier Trends | analysis/tier-trends/ | ~22 | High | 8-12h | Settings |
| 06 | Tier Stats | analysis/tier-stats/ | ~18 | Medium | 4-8h | Settings |
| 07 | Deaths Radar | analysis/deaths-radar/ | ~3-5 | Low | 2-4h | None |
| 08 | Time Series | analysis/time-series/ | ~5-10 | Medium | 4-8h | None |
| 09 | Shared Utilities | analysis/shared/ | ~8-12 | Medium | 4-8h | Stories 5-8 |
| 10 | Cleanup | (cleanup) | Variable | Medium | 4-8h | All above |

## Migration Phases

### Phase 1: Small Isolated Features (Stories 1-3)
**Goal**: Build confidence and establish patterns
- Data Import (Story 01)
- Data Export (Story 02)
- Settings (Story 03)

**Rationale**: Minimal cross-dependencies, clear boundaries, good warm-up

### Phase 2: Complex Table Feature (Story 4)
**Goal**: Handle largest single feature with internal complexity
- Game Runs (Story 04)

**Rationale**: 28 files in flat structure → hierarchical sub-features

### Phase 3: Analysis Features (Stories 5-8)
**Goal**: Migrate all analysis/visualization features
- Tier Trends (Story 05) - canonical example of type-based failure
- Tier Stats (Story 06)
- Deaths Radar (Story 07)
- Time Series (Story 08)

**Rationale**: These demonstrate why type-based organization fails

### Phase 4: Shared Code (Story 9)
**Goal**: Consolidate truly shared utilities
- Analysis Shared (Story 09)

**Rationale**: Can only identify shared code after features are migrated

### Phase 5: Cleanup (Story 10)
**Goal**: Remove old structure, finalize organization
- Cleanup & Verification (Story 10)

**Rationale**: Final pass to handle missed files and verify application

## Execution Rules

### DO ✅
- Investigate first (understand current structure before moving)
- Move files only (no logic changes, no refactoring)
- Keep file names (preserve exact names unless documented)
- Colocate tests (test files move with source files)
- Update imports systematically (use Grep, batch updates)
- Run tests frequently (after each import batch)
- One PR per story (atomic and revertible)

### DON'T ❌
- Don't change logic (even "obvious" improvements)
- Don't rename files (unless explicitly documented in story)
- Don't skip investigation (especially deaths-radar and time-series)
- Don't assume file locations (verify with Grep)
- Don't mix stories (complete one fully before next)
- Don't skip verification (manual testing required)

## Target Structure

```
src/features/
├── data-import/              # Story 01
│   ├── manual-entry/
│   └── csv-import/
├── data-export/              # Story 02
│   └── csv-export/
├── settings/                 # Story 03
│   ├── data-settings/
│   └── column-config/
├── game-runs/                # Story 04
│   ├── table/
│   ├── table-variants/
│   ├── table-ui/
│   ├── filters/
│   ├── fields/
│   └── card-view/
├── analysis/                 # Stories 05-09
│   ├── tier-trends/          # Story 05
│   │   ├── filters/
│   │   ├── table/
│   │   ├── mobile/
│   │   ├── empty-states/
│   │   └── logic/
│   ├── tier-stats/           # Story 06
│   │   ├── config/
│   │   ├── cells/
│   │   └── logic/
│   ├── deaths-radar/         # Story 07
│   ├── time-series/          # Story 08
│   └── shared/               # Story 09
├── navigation/               # (already exists)
└── theming/                  # (already exists)
```

## Success Metrics

After migration completion:

- ✅ Average files per directory: <10 implementation files (excluding tests)
- ✅ All features in feature-based directories
- ✅ Old type-based directories removed
- ✅ Zero import errors, all tests passing
- ✅ All features work identically to before
- ✅ Developer satisfaction improved
- ✅ Onboarding time reduced

## Getting Started

1. **Read the README**: [README.md](README.md) for detailed instructions
2. **Review parent PRD**: [PRD Enhanced File Structure Organization](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md)
3. **Start with Story 01**: [01-data-import-migration.md](01-data-import-migration.md)
4. **Execute sequentially**: Complete each story fully before moving to next
5. **Track progress**: Use checklist in README.md

## Key Principles

### File Organization
- **Group by feature/concept** (not by file type)
- **Colocate related files** (component + hook + logic together)
- **Create subdirectories at 3+ files** (when files share clear concept)
- **Evaluate at 10+ files** (mandatory sub-grouping evaluation)
- **Keep directories focused** (<10 implementation files per directory)

### Migration Strategy
- **Boy Scout Rule**: Improve structure incrementally as you touch files
- **Progressive refinement**: Natural evolution from flat to hierarchical
- **No big-bang refactoring**: Changes happen as part of feature work
- **One PR per story**: All changes atomic and revertible

## Naming Convention Note

**"Analysis" not "Analytics"**: We use "analysis" instead of "analytics" to avoid confusion with observability tools (Google Analytics, New Relic, DataDog). Our analysis feature focuses on statistical analysis and visualization of game data, not application monitoring.

## Documentation

- **[README.md](README.md)** - Comprehensive guide with execution order, tracking, and tools
- **[SUMMARY.md](SUMMARY.md)** - This file, executive overview
- **Story 01-10** - Individual migration PRDs with detailed steps

## Questions?

- Reference parent PRD for organizational principles
- Reference file-organization-analysis.md for concrete examples
- Document issues in story files for future reference
- Update stories with discoveries to help future migrations

## Post-Migration

After all stories complete:

1. ✅ All features migrated
2. ✅ Old directories removed
3. ✅ Documentation updated
4. ✅ Application fully tested
5. 📝 Migration summary created
6. 🎉 Celebrate improved codebase!
