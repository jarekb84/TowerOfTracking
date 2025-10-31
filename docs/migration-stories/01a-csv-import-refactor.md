# Migration Story 01a: CSV Import Component Refactoring

## Parent Story
See [Migration Story 01: Data Import Feature Reorganization](./01-data-import-migration.md) for the file reorganization that preceded this refactoring work.

## Story Overview

**Component**: CSV Import (`src/features/data-import/csv-import/csv-import.tsx`)
**Goal**: Reduce file size and complexity by extracting logic and sub-components
**Trigger**: Linting error for max-lines rule after file was moved in Migration Story 01
**Current State**: ~550+ lines (exceeds max-lines limit)
**Target State**: <200 lines per file through component extraction and logic separation

## Problem Statement

The `csv-import.tsx` file was created before the max-lines linting rule was enforced. During Migration Story 01, the file was moved without modification (per migration rules: NO logic changes). Now that it's in the new location, we need to refactor it to comply with coding standards while improving maintainability.

## Current Issues

1. **File Size**: Exceeds max-lines limit (currently has eslint-disable override)
2. **Mixed Concerns**: UI, state management, and business logic in single file
3. **Component Complexity**: Single component handling multiple responsibilities
4. **Testability**: Difficult to unit test individual pieces

## Refactoring Strategy

Apply React Separation Doctrine:
- Extract presentation sub-components (`.tsx` files)
- Extract state management to custom hook (`use-csv-import.ts`)
- Extract business logic to pure functions (`.ts` files)
- Generate comprehensive unit tests for all extracted logic

### Proposed Structure (Feature-Based Organization)

```
src/features/data-import/csv-import/
├── csv-import.tsx                      # Main entry point (<100 lines)
├── use-csv-import.ts                   # State orchestration hook
├── use-csv-import.test.tsx             # Hook tests
│
├── input/                              # Input & Upload Capability (3 files)
│   ├── csv-input-section.tsx          # Textarea + paste/upload buttons
│   ├── csv-file-upload.ts             # File upload logic
│   └── csv-file-upload.test.ts
│
├── delimiter/                          # Delimiter Selection (3 files)
│   ├── delimiter-controls.tsx         # Delimiter radio buttons + custom input
│   ├── delimiter-utils.ts             # Delimiter string conversion logic
│   └── delimiter-utils.test.ts
│
├── field-mapping/                      # Field Mapping Display (4 files)
│   ├── field-mapping-report.tsx       # Field mapping visualization card
│   ├── field-mapping-table.tsx        # Mapped fields table
│   ├── field-mapping-logic.ts         # Mapping display formatting
│   └── field-mapping-logic.test.ts
│
├── preview/                            # Data Preview Display (3 files)
│   ├── import-preview.tsx             # Sample runs preview card
│   ├── preview-formatting.ts          # Preview data formatting
│   └── preview-formatting.test.ts
│
├── validation/                         # Import Validation & Status (3 files)
│   ├── import-status-card.tsx         # Success/error counts display
│   ├── validation-logic.ts            # Parse result validation
│   └── validation-logic.test.ts
│
└── duplicates/                         # Duplicate Detection (3 files)
    ├── duplicate-resolution-ui.tsx    # Duplicate resolution controls
    ├── duplicate-handling.ts          # Duplicate detection orchestration
    └── duplicate-handling.test.ts
```

**Rationale for Feature-Based Structure**:

1. **input/**: Groups upload capability (file, clipboard, textarea input)
2. **delimiter/**: Isolates delimiter selection feature with conversion logic
3. **field-mapping/**: Contains all field mapping visualization and reporting
4. **preview/**: Focused on data preview display before import
5. **validation/**: Handles import status, errors, and success counts
6. **duplicates/**: Dedicated to duplicate detection and resolution

**Why NOT components/logic/**:
- Type-based directories obscure feature relationships
- Related files (component + logic + tests) are separated
- Harder to locate files by capability
- Violates co-location principle

**File Counts**:
- Main level: 3 files (component + hook + test)
- Each subdirectory: 3-4 files (under 10-file threshold)
- Total: ~22 files across 6 feature subdirectories
- All subdirectories use descriptive capability names, NOT file types

## Extraction Candidates (by Feature)

### Input & Upload Capability (`input/`)
**Components**:
- `csv-input-section.tsx`: Textarea, paste button, file upload button

**Logic**:
- `csv-file-upload.ts`: File selection, reading, error handling
- `csv-file-upload.test.ts`: File upload logic tests

**Responsibilities**: Collect CSV data from clipboard, file, or manual input

### Delimiter Selection (`delimiter/`)
**Components**:
- `delimiter-controls.tsx`: Radio buttons (tab/comma/semicolon/custom) + custom input field

**Logic**:
- `delimiter-utils.ts`: Convert delimiter type to string, validate custom delimiters
- `delimiter-utils.test.ts`: Delimiter conversion tests

**Responsibilities**: Configure CSV parsing delimiter

### Field Mapping Display (`field-mapping/`)
**Components**:
- `field-mapping-report.tsx`: Card displaying mapping summary (supported/unsupported counts)
- `field-mapping-table.tsx`: Table showing CSV header → camelCase field mappings

**Logic**:
- `field-mapping-logic.ts`: Format field mapping report data for display
- `field-mapping-logic.test.ts`: Field mapping display logic tests

**Responsibilities**: Visualize how CSV headers map to supported fields

### Data Preview (`preview/`)
**Components**:
- `import-preview.tsx`: Card showing first 3 sample runs with key fields

**Logic**:
- `preview-formatting.ts`: Format preview data (numbers, durations, fields)
- `preview-formatting.test.ts`: Preview formatting tests

**Responsibilities**: Show sample imported data before confirmation

### Import Validation (`validation/`)
**Components**:
- `import-status-card.tsx`: Success/failure counts, error messages display

**Logic**:
- `validation-logic.ts`: Parse result validation, error aggregation
- `validation-logic.test.ts`: Validation logic tests

**Responsibilities**: Display parsing results and validation errors

### Duplicate Detection (`duplicates/`)
**Components**:
- `duplicate-resolution-ui.tsx`: Duplicate info card with resolution controls

**Logic**:
- `duplicate-handling.ts`: Orchestrate duplicate detection, resolution logic
- `duplicate-handling.test.ts`: Duplicate handling tests

**Responsibilities**: Detect and resolve duplicate runs

### State Orchestration (Main Level)
**Hook**:
- `use-csv-import.ts`: Coordinate all capabilities, manage state flow

**Responsibilities**:
- Input data state (raw text, selected delimiter)
- Parse result state (success/failures/errors)
- Duplicate detection state (batch results, resolution choice)
- Event handlers (paste, file upload, delimiter change, import)
- Coordinate between input → parsing → validation → preview → duplicates → import

## Implementation Tasks

### Phase 1: Extract State Orchestration Hook
1. Create `use-csv-import.ts` with all state coordination
2. Create `use-csv-import.test.tsx` with comprehensive hook tests
3. Update `csv-import.tsx` to delegate to hook
4. Verify all functionality works identically

**Deliverables**:
- Main component delegates state management to hook
- Hook passes all orchestration tests
- No functional changes

### Phase 2: Extract Input & Upload Capability (`input/`)
1. Create `input/` subdirectory
2. Extract textarea + buttons to `csv-input-section.tsx`
3. Extract file upload logic to `csv-file-upload.ts` with tests
4. Update hook to use extracted input components
5. Verify paste, file upload, and manual input work

**Deliverables**:
- Input UI isolated in feature subdirectory
- File upload logic fully tested
- All input methods functional

### Phase 3: Extract Delimiter Selection (`delimiter/`)
1. Create `delimiter/` subdirectory
2. Extract delimiter controls to `delimiter-controls.tsx`
3. Extract delimiter utilities to `delimiter-utils.ts` with tests
4. Update hook to integrate delimiter selection
5. Verify all delimiter types work (tab, comma, semicolon, custom)

**Deliverables**:
- Delimiter selection isolated in feature subdirectory
- Delimiter conversion logic tested
- All delimiter types functional

### Phase 4: Extract Field Mapping Display (`field-mapping/`)
1. Create `field-mapping/` subdirectory
2. Extract field mapping card to `field-mapping-report.tsx`
3. Extract mapping table to `field-mapping-table.tsx`
4. Extract display formatting to `field-mapping-logic.ts` with tests
5. Verify field mapping visualization displays correctly

**Deliverables**:
- Field mapping UI isolated in feature subdirectory
- Display logic fully tested
- Mapping visualization functional

### Phase 5: Extract Preview & Validation (`preview/`, `validation/`)
1. Create `preview/` and `validation/` subdirectories
2. Extract preview card to `import-preview.tsx` with formatting logic
3. Extract status card to `import-status-card.tsx` with validation logic
4. Add comprehensive tests for preview and validation logic
5. Verify preview and status displays work correctly

**Deliverables**:
- Preview and validation isolated in feature subdirectories
- Display and validation logic fully tested
- Preview and status displays functional

### Phase 6: Extract Duplicate Detection (`duplicates/`)
1. Create `duplicates/` subdirectory
2. Extract duplicate UI to `duplicate-resolution-ui.tsx`
3. Extract duplicate orchestration to `duplicate-handling.ts` with tests
4. Update hook to integrate duplicate handling
5. Verify duplicate detection and resolution work

**Deliverables**:
- Duplicate handling isolated in feature subdirectory
- Duplicate logic fully tested
- Duplicate detection functional

### Phase 7: Final Verification
- [ ] Main component under 200 lines
- [ ] All subdirectory files under 200 lines
- [ ] Hook under 200 lines
- [ ] All tests passing (unit + integration)
- [ ] No functionality changes
- [ ] Remove eslint-disable override
- [ ] Verify feature-based organization (NO components/logic/ dirs)
- [ ] All subdirectories under 10 implementation files
- [ ] Related files colocated (component + logic + tests together)

## Benefits

- **Feature Discoverability**: Navigate by capability (input/, delimiter/, preview/) instead of file type
- **Co-location**: Related files (component + logic + tests) grouped by feature, not scattered
- **Maintainability**: Smaller, focused files easier to understand and modify
- **Testability**: Pure functions with 100% test coverage, tests colocated with logic
- **Reusability**: Feature-based modules can be reused or extended independently
- **Standards Compliance**: Meets max-lines linting requirements AND feature-based organization principles
- **Separation of Concerns**: Clear boundaries between capabilities (input, validation, preview, duplicates)
- **Scalability**: Each subdirectory under 10 files, clear extension points for future capabilities
- **Architectural Consistency**: Demonstrates proper feature-based refactoring pattern for other oversized components

## Migration Rules

**CRITICAL**:
- **NO logic changes** - behavior must remain identical
- **NO feature additions** - pure refactoring only
- **Comprehensive tests** - all extracted logic must have tests
- **Incremental changes** - one extraction at a time, verify after each
- **Preserve functionality** - CSV import must work identically before and after

## Success Criteria

- [ ] `csv-import.tsx` under 200 lines
- [ ] All extracted files under 200 lines
- [ ] eslint-disable override removed
- [ ] All existing tests passing
- [ ] New unit tests for extracted logic (>90% coverage)
- [ ] CSV import functionality works identically
- [ ] No regressions in user experience

## Notes

- This refactoring is a direct consequence of Migration Story 01
- File was moved "as-is" to preserve atomicity of reorganization PR
- Now that it's in the right location, we can safely refactor it
- This establishes pattern for refactoring other oversized components discovered during future migrations

## Feature-Based Organization: Why It Matters

This refactoring demonstrates the core difference between type-based and feature-based organization:

**Type-Based (ANTI-PATTERN)**:
```
csv-import/
├── components/ (7 files)     # "All components here"
├── hooks/ (1 file)            # "All hooks here"
└── logic/ (5 files)           # "All logic here"
```
**Problem**: To work on duplicate detection, you navigate:
- `components/duplicate-resolution-ui.tsx` (for UI)
- `logic/duplicate-handling.ts` (for logic)
- `logic/duplicate-handling.test.ts` (for tests)
Files are scattered across 3 directories by file type, not by what they do.

**Feature-Based (CORRECT PATTERN)**:
```
csv-import/
├── input/ (3 files)          # Everything about input/upload
├── delimiter/ (3 files)      # Everything about delimiter selection
├── preview/ (3 files)        # Everything about data preview
├── validation/ (3 files)     # Everything about validation
└── duplicates/ (3 files)     # Everything about duplicate detection
```
**Benefit**: To work on duplicate detection, you navigate:
- `duplicates/` directory
- Find component, logic, and tests together
- Clear boundary: this directory owns duplicate detection

**Key Principles Applied**:
1. **Organize by capability**: Directories named for features (input, preview), not types (components, logic)
2. **Co-locate related files**: Component + logic + tests together in feature directory
3. **10-File Threshold**: Each subdirectory has 3-4 files (well under 10-file limit)
4. **3-File Rule**: Multiple 3+ file groupings justify subdirectory creation
5. **Cohesion Test**: Every subdirectory name describes a clear capability

**Developer Experience**:
- "I need to change how delimiters work" → `delimiter/` directory
- "I need to modify the preview display" → `preview/` directory
- "I need to update duplicate resolution" → `duplicates/` directory

NO mental mapping from "what I want to do" to "what file type it is".

## Related Documentation

- Parent Migration: [01-data-import-migration.md](./01-data-import-migration.md)
- Architecture Standards: [.ruler/04-engineering-standards.md](../../.ruler/04-engineering-standards.md)
- React Separation: [.ruler/06-react-separation.md](../../.ruler/06-react-separation.md)
