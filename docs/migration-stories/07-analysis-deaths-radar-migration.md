# Migration Story 07: Analysis - Deaths Radar Chart Feature Reorganization

## Parent PRD
See [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md) for complete context and organizational principles.

## Story Overview

**Feature**: Analysis / Deaths Radar Chart
**Goal**: Reorganize the deaths radar chart feature into a cohesive feature-based structure.
**Scope**: File movement and import statement updates ONLY - no logic changes or refactoring.

## Current State

**IMPORTANT**: This migration requires investigation first - actual file locations may differ from parent PRD assumptions.

Expected files (location TBD):
```
src/features/data-tracking/components/ (?)
└── deaths-radar-chart.tsx

src/features/data-tracking/hooks/ (?)
└── (hooks for deaths radar, if any)

src/features/data-tracking/logic/ or utils/ (?)
└── (business logic for radar calculations, if any)
```

**Total**: Estimated **3-5 files** (exact count TBD after investigation)

## Investigation Tasks (FIRST)

Before moving files, investigate current structure:

1. **Find the main component**:
   ```bash
   # Search for deaths radar files
   Grep -i "deaths.*radar" -r src/
   Grep -i "DeathsRadar" -r src/
   ```

2. **Identify related files**:
   - Find imports within deaths radar component
   - Find hooks specific to deaths radar
   - Find logic/calculation files for radar data
   - Find any radar-specific utilities

3. **Map dependencies**:
   - What does deaths radar import from other features?
   - What imports deaths radar (pages, other components)?
   - Are there shared utilities that should stay in shared/?

## Target State (Tentative)

```
src/features/analysis/deaths-radar/
├── deaths-radar-chart.tsx               # Main component
├── deaths-radar-chart.test.tsx          # Component tests (if exist)
├── use-deaths-radar-data.ts             # Data hook (if exists)
├── use-deaths-radar-data.test.tsx       # Hook tests (if exist)
│
└── logic/                               # Pure business logic (if exists)
    ├── radar-calculations.ts            # Radar data calculations
    ├── radar-calculations.test.ts
    ├── death-cause-aggregation.ts       # Death cause aggregation logic
    └── death-cause-aggregation.test.ts
```

**Note**: Actual structure depends on investigation findings. May be simpler (single component) or more complex (with hooks and logic).

## Benefits

- **Isolated feature**: Deaths radar code in one place
- **Easy to find**: All radar-related files together
- **Room to grow**: Structure allows adding radar variants, filters, or controls
- **Clear separation**: Radar logic separate from other analysis features

## Implementation Tasks (After Investigation)

### 1. Document Current State

After investigation, document:
- Exact file locations
- File count
- Dependencies (imports and importers)
- Any shared utilities that should stay shared

### 2. Create Directory Structure

```bash
mkdir -p src/features/analysis/deaths-radar
mkdir -p src/features/analysis/deaths-radar/logic  # If logic files exist
```

### 3. Move Files

**Strategy depends on investigation findings**. Likely moves:

Move from `src/features/data-tracking/components/`:
- `deaths-radar-chart.tsx` → root of `deaths-radar/`
- Related component files → root of `deaths-radar/`

Move from `src/features/data-tracking/hooks/` (if applicable):
- `use-deaths-radar-*.ts` → root of `deaths-radar/`

Move from `src/features/data-tracking/logic/` or `utils/` (if applicable):
- Radar calculation files → `logic/` subdirectory

### 4. Update Import Statements

**From**:
```typescript
import { DeathsRadarChart } from '@/features/data-tracking/components/deaths-radar-chart'
```

**To**:
```typescript
import { DeathsRadarChart } from '@/features/analysis/deaths-radar/deaths-radar-chart'
```

**Tools**:
- Use `Grep` to find all `deaths-radar` or `DeathsRadar` imports
- Update systematically
- Run tests after updates

### 5. Update Barrel Exports (if applicable)

```typescript
// src/features/analysis/deaths-radar/index.ts
export * from './deaths-radar-chart'
// Add other exports as needed
```

### 6. Verification

- [ ] Run `npm run build` to ensure no import errors
- [ ] Run `npm run test` to verify all tests pass
- [ ] Run `npm run type-check` to verify TypeScript compilation
- [ ] Manually test deaths radar chart in application
- [ ] Verify radar rendering with test data
- [ ] Test any interactive features (tier toggles, etc.)

## Migration Rules

**CRITICAL**:
- **Investigate FIRST** - understand current structure before moving
- **NO logic changes** - only file movement and import updates
- **NO refactoring** - resist the urge to "improve" code while moving
- **NO renaming** - keep all file names exactly as they are
- **Tests stay with implementation** - test files move alongside source files
- **One PR** - all changes in a single atomic commit for easy revert if needed

## Special Considerations

### Potential Scenarios

**Scenario 1: Simple (Single Component)**
- If deaths radar is just one component file with no hooks/logic
- Move to `deaths-radar/deaths-radar-chart.tsx`
- No subdirectories needed yet
- Structure allows future growth

**Scenario 2: Moderate (Component + Hook)**
- Component + data hook
- Both files at root of `deaths-radar/`
- No subdirectories needed yet

**Scenario 3: Complex (Component + Hook + Logic)**
- Component at root
- Hook at root
- Logic files in `logic/` subdirectory

**Scenario 4: Shared Utilities**
- If radar uses aggregation/calculation utilities shared with other analysis features
- Consider leaving those in `src/features/analysis/shared/`
- Only move radar-specific logic

### Decision Points

During investigation, decide:

1. **Shared vs. Feature-Specific**:
   - Is this logic truly specific to deaths radar?
   - Or is it general aggregation logic used by multiple features?
   - If shared, leave in (or move to) `analysis/shared/`

2. **Subdirectory Threshold**:
   - If <3 files total, keep flat in `deaths-radar/`
   - If 3+ logic files, create `logic/` subdirectory
   - Follow 10-file threshold principle

## Notes

- This is the smallest analysis feature (likely 3-5 files)
- May be simplest migration in analysis sequence
- Good warm-up before time-series migration
- Investigation phase is critical - don't assume file locations

## Success Criteria

- [ ] Investigation complete - all deaths radar files identified
- [ ] All deaths radar files moved to new location
- [ ] Zero import errors after migration
- [ ] All tests passing
- [ ] Application builds successfully
- [ ] Deaths radar chart functionality works identically to before
- [ ] No logic or behavior changes introduced
- [ ] Developer can find all deaths radar code in one feature directory
