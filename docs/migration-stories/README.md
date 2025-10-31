# File Organization Migration Stories

This directory contains a series of migration stories for reorganizing the TowerOfTracking codebase from a type-based structure (components/, hooks/, logic/, utils/) to a feature-based structure.

## Parent Documentation

- **Main PRD**: [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md)
- **Analysis**: [File Organization Analysis & Recommendations](../file-organization-analysis.md)

## Migration Overview

The migration is split into **10 incremental stories** to be executed **sequentially**. Each story focuses on a single feature or sub-feature, moving files from scattered type-based directories into cohesive feature-based structures.

### Why Sequential?

- **Safety**: One feature at a time reduces risk of breaking changes
- **Learning**: Early migrations inform later ones
- **Discovery**: Shared code patterns emerge as features are migrated
- **Testing**: Each story can be fully tested before proceeding

### Estimated Timeline

- **Small stories** (data-import, data-export, deaths-radar): 2-4 hours each
- **Medium stories** (settings, tier-stats, time-series): 4-8 hours each
- **Large stories** (game-runs, tier-trends): 8-12 hours each
- **Cleanup story**: 4-8 hours (depends on findings)
- **Total**: ~40-80 hours (spread over multiple days/weeks)

## Story Execution Order

### Phase 1: Small Isolated Features (Stories 1-3)

**Goal**: Establish migration patterns and build confidence

| Story | Feature | Files | Complexity | Dependencies |
|-------|---------|-------|------------|--------------|
| 01 | Data Import | ~14 | Low | None |
| 02 | Data Export | ~8 | Low | None |
| 03 | Settings | ~13 | Low | None |

**Rationale**: These features have minimal cross-dependencies and clear boundaries. Good warm-up migrations.

### Phase 2: Complex Table Feature (Story 4)

**Goal**: Handle the largest single feature with internal complexity

| Story | Feature | Files | Complexity | Dependencies |
|-------|---------|-------|------------|--------------|
| 04 | Game Runs | ~28 | High | Settings (column config) |

**Rationale**: Game runs table is partially organized but flat. Demonstrates sub-feature extraction from monolithic directory.

### Phase 3: Analysis Features (Stories 5-8)

**Goal**: Migrate all analysis/visualization features

| Story | Feature | Files | Complexity | Dependencies |
|-------|---------|-------|------------|--------------|
| 05 | Analysis - Tier Trends | ~22 | High | Settings |
| 06 | Analysis - Tier Stats | ~18 | Medium | Settings |
| 07 | Analysis - Deaths Radar | ~3-5 | Low | None |
| 08 | Analysis - Time Series | ~5-10 | Medium | None |

**Rationale**: These are the canonical examples of why type-based organization fails (tier-trends: 22 files across 4 directories).

### Phase 4: Shared Code Extraction (Story 9)

**Goal**: Identify and consolidate truly shared utilities

| Story | Feature | Files | Complexity | Dependencies |
|-------|---------|-------|------------|--------------|
| 09 | Analysis - Shared | ~8-12 | Medium | Requires Phase 3 complete |

**Rationale**: Can only identify truly shared code after seeing what each feature actually uses.

### Phase 5: Cleanup and Verification (Story 10)

**Goal**: Remove old structure, verify all migrations, finalize shared code organization

| Story | Feature | Files | Complexity | Dependencies |
|-------|---------|-------|------------|--------------|
| 10 | Cleanup & Verification | Variable | Medium | Requires all above complete |

**Rationale**: Final pass to handle missed files, orphaned code, and verify entire application.

## Migration Stories

1. **[01-data-import-migration.md](01-data-import-migration.md)** - Data Import feature
2. **[02-data-export-migration.md](02-data-export-migration.md)** - Data Export feature
3. **[03-settings-migration.md](03-settings-migration.md)** - Settings feature
4. **[04-game-runs-migration.md](04-game-runs-migration.md)** - Game Runs table feature
5. **[05-analysis-tier-trends-migration.md](05-analysis-tier-trends-migration.md)** - Tier Trends analysis
6. **[06-analysis-tier-stats-migration.md](06-analysis-tier-stats-migration.md)** - Tier Stats table
7. **[07-analysis-deaths-radar-migration.md](07-analysis-deaths-radar-migration.md)** - Deaths Radar chart
8. **[08-analysis-time-series-migration.md](08-analysis-time-series-migration.md)** - Time Series charts
9. **[09-analysis-shared-migration.md](09-analysis-shared-migration.md)** - Shared analysis utilities
10. **[10-cleanup-and-verification.md](10-cleanup-and-verification.md)** - Final cleanup

## Universal Migration Rules

All stories follow these rules:

### DO ✅

- **Investigate first**: Understand current structure before moving files
- **Move files only**: No logic changes, no refactoring, no "improvements"
- **Keep file names**: Preserve exact names (exceptions documented per-story)
- **Colocate tests**: Test files move alongside source files
- **Update imports systematically**: Use Grep to find all imports, update in batches
- **Run tests frequently**: After each batch of import updates
- **One PR per story**: All changes atomic and revertible

### DON'T ❌

- **Don't change logic**: Even "obvious" improvements - resist the urge
- **Don't rename files**: Unless explicitly documented in story (e.g., tier-trends.ts → tier-trends-calculations.ts)
- **Don't skip investigation**: Especially for deaths-radar and time-series stories
- **Don't assume file locations**: Use Grep to verify before moving
- **Don't mix stories**: Complete one story fully before starting next
- **Don't skip verification**: Manual testing required for each story

## Common Tools and Commands

### Finding Files

```bash
# Find files by name pattern
Glob "**/*tier-trends*"

# Search for imports
Grep -r "from '@/features/data-tracking/components/tier-trends" src/

# Find all imports of a specific file
Grep -r "import.*tier-trends-analysis" src/
```

### Moving Files

```bash
# Create directory structure
mkdir -p src/features/analysis/tier-trends/filters

# Move files (update imports separately)
mv src/features/data-tracking/components/tier-trends-filters.tsx \
   src/features/analysis/tier-trends/filters/tier-trends-filters.tsx
```

### Verification

```bash
# Build check
npm run build

# Test check
npm run test

# Type check
npm run type-check

# Lint check (if available)
npm run lint
```

## Tracking Progress

Create a checklist as you execute stories:

- [ ] Story 01: Data Import ⏱️ Started: _____ ✅ Completed: _____
- [ ] Story 02: Data Export ⏱️ Started: _____ ✅ Completed: _____
- [ ] Story 03: Settings ⏱️ Started: _____ ✅ Completed: _____
- [ ] Story 04: Game Runs ⏱️ Started: _____ ✅ Completed: _____
- [ ] Story 05: Tier Trends ⏱️ Started: _____ ✅ Completed: _____
- [ ] Story 06: Tier Stats ⏱️ Started: _____ ✅ Completed: _____
- [ ] Story 07: Deaths Radar ⏱️ Started: _____ ✅ Completed: _____
- [ ] Story 08: Time Series ⏱️ Started: _____ ✅ Completed: _____
- [ ] Story 09: Shared Utilities ⏱️ Started: _____ ✅ Completed: _____
- [ ] Story 10: Cleanup ⏱️ Started: _____ ✅ Completed: _____

## Post-Migration

After all stories are complete:

1. ✅ All features migrated to new structure
2. ✅ Old directories removed
3. ✅ Documentation updated
4. ✅ Full application tested
5. 📝 Migration summary created
6. 🎉 Celebrate!

## Questions or Issues?

If you encounter issues during migration:

1. **Document the issue** in the story file
2. **Don't force it** - if something seems wrong, investigate
3. **Ask for help** - reference parent PRD or file-organization-analysis.md
4. **Update the story** - if you discover missing information, add it for future reference

## Benefits of This Approach

- **Reduced cognitive load**: Developers find related files together
- **Improved onboarding**: New developers understand architecture from file structure
- **Better IDE support**: "Find in folder" becomes more useful
- **Easier testing**: Test files colocated with source
- **Natural evolution**: Structure supports organic growth

## Success Metrics

After migration completion, measure:

- **Average files per directory**: Target <10 implementation files (excluding tests)
- **Developer satisfaction**: Survey team on new structure usability
- **Onboarding time**: How long for new developers to understand codebase
- **Feature development velocity**: Time to implement new features in new structure
