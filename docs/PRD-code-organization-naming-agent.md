# PRD: Code Organization & Naming Agent

## Document Information
- **Created**: 2025-10-31
- **Status**: Draft
- **Related Migration Stories**: All migration stories (file organization is cross-cutting concern)
- **Agent Type**: Final Stage Review Agent (Stage 4 - after Architecture Review)

## Executive Summary

This PRD defines a specialized agent focused exclusively on code organization, file naming, directory structure, and function naming. This agent will ensure that the codebase's physical structure and naming conventions reflect clear intent, making code discoverable and maintainable through purposeful organization.

### Key Objectives
1. Extract file organization concerns from Architecture Review Agent into dedicated specialist
2. Expand scope beyond file location to include file naming and function naming
3. Operate as final review stage after all logical/structural changes are complete
4. Apply "layer peeling" principle: directory → file → function naming should progressively reveal intent
5. Have autonomy to reorganize files, rename entities, and move functions between files

## Problem Statement

### Current State
Currently, the Architecture Review Agent handles:
- File organization (feature-based vs type-based)
- Directory file count thresholds (10-file threshold, 3-file rule)
- Co-location of related files
- Directory naming validation

However, it **does not** systematically address:
- File naming quality and intent clarity
- Function/method naming within files
- Whether functions belong in their current file
- Progressive intent revelation (directory → file → function)
- End-to-end naming consistency

### Identified Gaps
1. **File Names**: Files may be poorly named even when correctly located
2. **Function Names**: Functions may have unclear names that don't express intent
3. **Function Placement**: Functions may be in wrong files despite feature-based organization
4. **Intent Clarity**: The "layer peeling" experience (directory → file → function) is not systematically evaluated
5. **Timing**: Organization review happens during architectural changes, not as final polish step

### Why This Matters
**Developer Experience**: When navigating a codebase:
- Looking at a directory name → expect to know what's inside
- Looking at a file name → expect to know what functions it contains
- Looking at a function name → expect to know what it does

**Uncle Bob's "Code as Prose" Principle**: Code should read like well-written prose with clear, purposeful naming at every level.

**Single Responsibility**: Files and functions should have names that clearly express their single purpose.

## Goals & Non-Goals

### Goals
1. **Extract & Enhance File Organization Review**
   - Extract all file organization logic from Architecture Review Agent
   - Maintain existing 10-file threshold and 3-file rule enforcement
   - Continue feature-based vs type-based organization validation

2. **Add File Naming Quality Review**
   - Evaluate if file names clearly express their purpose
   - Identify generic or vague file names (e.g., `utils.ts`, `helpers.ts`)
   - Suggest more intentional names that match file contents

3. **Add Function Naming Quality Review**
   - Evaluate if exported functions/methods have clear, purposeful names
   - Identify generic names (e.g., `doStuff()`, `handleData()`)
   - Suggest names that express business intent

4. **Add Function Placement Review**
   - Evaluate if functions belong in their current file
   - Identify functions that serve a different purpose than their containing file
   - Have autonomy to extract functions into separate files or move to existing files

5. **Implement Layer Peeling Validation**
   - Ensure directory names reveal high-level purpose
   - Ensure file names within directory align with directory purpose
   - Ensure function names within file align with file purpose
   - Create progressive intent revelation experience

6. **Execute as Final Review Stage**
   - Run after Architecture Review Agent completes
   - Review all code after logical/structural changes are done
   - Provide final organizational polish before completion

### Non-Goals
1. **NOT** responsible for architectural patterns (Architecture Review Agent handles this)
2. **NOT** responsible for logic extraction or React separation (Architecture Review Agent)
3. **NOT** responsible for visual design or CSS (Frontend Design Review Agent)
4. **NOT** responsible for E2E test patterns (E2E Test Architect Agent)
5. **NOT** performing big-bang reorganizations (Boy Scout Rule applies)
6. **NOT** renaming for the sake of renaming (only when clarity improves)

## Success Criteria

### Measurable Outcomes
1. **Zero Type-Based Organization** at feature level (components/, hooks/, logic/)
2. **Zero Directories Exceeding 10 Implementation Files** without sub-grouping
3. **Zero Generic File Names** without clear context (utils.ts, helpers.ts, common.ts)
4. **Improved Code Discoverability**: Developers can find functions by following directory → file naming
5. **Clear Intent Revelation**: Each naming layer (directory, file, function) reveals purpose

### Quality Indicators
- Developer can predict file contents from directory + file name
- Developer can predict function purpose from file + function name
- Related functionality is colocated and clearly grouped
- File organization supports future feature additions
- Naming consistency across similar features/concepts

## Detailed Design

### Agent Responsibilities

#### Phase 1: File Organization Review (Extracted from Architecture Review Agent)
**Migrated from Architecture Review Agent:**
- Directory file count analysis (10+ files → evaluate for sub-grouping)
- 3-file rule enforcement (3+ related files → create subdirectory)
- Feature-based vs type-based organization validation
- Co-location of related files (component + hook + logic + tests)
- Directory naming validation (purpose-based vs type-based)
- Incremental reorganization using Boy Scout Rule

#### Phase 2: File Naming Review (New Capability)
**New Review Focus:**
1. **Generic Name Detection**
   - Flag: `utils.ts`, `helpers.ts`, `common.ts`, `misc.ts`, `index.ts` (without clear context)
   - Suggest: Purpose-based names reflecting what the file contains

2. **Intent Clarity Check**
   - Does file name express what it contains?
   - Is name aligned with directory purpose?
   - Is name specific enough to be discoverable?

3. **Naming Consistency**
   - Similar concepts have consistent naming patterns
   - File names follow established conventions
   - Naming reflects business domain language

**Examples:**
```bash
# ❌ BAD: Generic, unclear
src/features/analytics/utils.ts
src/features/data-import/helpers.ts
src/shared/common.ts

# ✅ GOOD: Purpose-revealing
src/features/analytics/aggregation-strategies.ts
src/features/data-import/csv-parsing-helpers.ts
src/shared/formatting/number-formatters.ts
```

#### Phase 3: Function Naming Review (New Capability)
**New Review Focus:**
1. **Exported Function Name Quality**
   - Are names clear and purposeful?
   - Do names express business intent?
   - Are names consistent with similar functions?

2. **Generic Name Detection**
   - Flag: `doStuff()`, `handleData()`, `process()`, `manage()`, `run()`
   - Suggest: Specific names expressing what the function actually does

3. **Business Domain Alignment**
   - Function names use business domain language
   - Names match the application's vocabulary
   - Consistent terminology across features

**Examples:**
```typescript
// ❌ BAD: Generic, unclear intent
export function processData(input: GameRun[]) { /* ... */ }
export function handleClick() { /* ... */ }
export function doImport(data: string) { /* ... */ }

// ✅ GOOD: Clear business intent
export function calculateAverageCoinsPerWave(runs: GameRun[]) { /* ... */ }
export function expandTableRow(rowIndex: number) { /* ... */ }
export function parseTabDelimitedGameRuns(csvData: string) { /* ... */ }
```

#### Phase 4: Function Placement Review (New Capability)
**New Review Focus:**
1. **Function-File Purpose Alignment**
   - Does function belong in current file based on file name/purpose?
   - Would function be more discoverable in a different file?
   - Does function serve the same purpose as other functions in file?

2. **Extraction Opportunities**
   - Functions serving distinct purpose → extract to separate file
   - Functions that would create cohesive group → extract to new file
   - Functions belonging to existing file → move to that file

3. **Autonomy to Reorganize**
   - **Extract functions** into new files when they serve distinct purpose
   - **Move functions** between files when better alignment exists
   - **Update imports** across codebase after reorganization
   - **Maintain tests** alongside moved functions

**Examples:**
```typescript
// BEFORE: tier-trends-calculations.ts (mixed purposes)
export function calculateAverageCoinsPerWave(runs: GameRun[]) { /* ... */ }
export function calculateAverageRunDuration(runs: GameRun[]) { /* ... */ }
export function formatDurationString(seconds: number): string { /* ... */ } // ❌ Formatting, not calculation

// AFTER: Split into purpose-aligned files
// tier-trends-calculations.ts (calculation logic only)
export function calculateAverageCoinsPerWave(runs: GameRun[]) { /* ... */ }
export function calculateAverageRunDuration(runs: GameRun[]) { /* ... */ }

// duration-formatters.ts (formatting logic only)
export function formatDurationString(seconds: number): string { /* ... */ }
```

#### Phase 5: Layer Peeling Validation (New Capability)
**New Review Focus:**
1. **Progressive Intent Revelation**
   - Directory name reveals high-level concept (e.g., `tier-trends/`)
   - File names within directory reveal specific areas (e.g., `filters/`, `calculations/`)
   - Function names within file reveal specific operations (e.g., `calculateAverageCoinsPerWave()`)

2. **Hierarchical Coherence**
   - Each layer narrows focus and reveals more detail
   - No conceptual gaps between directory → file → function
   - Naming at each level is internally consistent

**Example:**
```bash
# Directory: What's the feature?
src/features/analytics/tier-trends/

# Files: What are the sub-capabilities?
├── tier-trends-analysis.tsx          # Main UI component
├── filters/                           # Filtering sub-feature
│   ├── tier-trends-filters.tsx        # Filter UI
│   └── use-field-filter.ts            # Filter logic
├── calculations/                      # Calculation sub-feature
│   ├── tier-trends-calculations.ts    # Core calculations
│   └── aggregation-strategies.ts      # Aggregation logic

# Functions within tier-trends-calculations.ts: What are the specific operations?
export function calculateAverageCoinsPerWave(runs: GameRun[]) { /* ... */ }
export function calculateAverageRunDuration(runs: GameRun[]) { /* ... */ }
export function calculateHourlyEarningsRate(runs: GameRun[]) { /* ... */ }
```

**Layer Peeling Experience:**
1. **Directory**: `tier-trends/` → "This is about tier trend analysis"
2. **File**: `calculations/tier-trends-calculations.ts` → "This has calculation functions for tier trends"
3. **Function**: `calculateAverageCoinsPerWave()` → "This calculates average coins per wave"

### Orchestration Position

**Agent Execution Order (Updated):**
1. **Main Agent**: Implements user's request
2. **Frontend Design Review Agent**: Visual/CSS review (for non-bug-fixes)
3. **E2E Test Architect Agent**: E2E test review (if E2E files modified)
4. **Architecture Review Agent**: Logical structure and architectural review
5. **Code Organization & Naming Agent**: ⭐ **NEW** - Final organizational polish

**Why This Order Makes Sense:**
- **After Main Agent**: Initial implementation is complete
- **After Design Review**: Visual changes are finalized
- **After E2E Review**: Test structure is established
- **After Architecture Review**: Logical refactoring and abstractions are complete
- **Final Polish**: All code changes are done; now optimize organization and naming

**Rationale:**
- Architecture Review Agent may create new abstractions, extract functions, or restructure code
- Code Organization & Naming Agent reviews the **final state** after all logical changes
- Ensures naming and organization reflect the **final architecture**, not intermediate states
- Prevents rework (no renaming before architecture refactoring that might change structure)

### Bug Fix Handling

**CRITICAL**: Bug fixes follow the same **LIMITED SCOPE** principle as other review agents.

**Bug Fix Protocol:**
1. **NO Boy Scout Rule**: Don't reorganize unrelated files or rename unrelated functions
2. **Minimal Scope**: Only review files directly touched by the bug fix
3. **Clarity Focus**: Rename/reorganize ONLY if it clarifies the bug fix itself
4. **Defer General Improvements**: Save general organization/naming improvements for separate PRs

**Decision Criteria for Bug Fixes:**
- ✅ APPROVE: Renaming if it makes the bug fix code clearer
- ✅ APPROVE: Extracting bug fix logic to well-named function for testability
- ❌ REJECT: Reorganizing directories unrelated to the fix
- ❌ REJECT: Renaming functions not involved in the bug fix
- ❌ REJECT: General file naming improvements across the codebase

### Review Process

**Phase 1: Context Gathering**
1. Check handoff context: Is this a bug fix? (If yes, apply LIMITED SCOPE)
2. Execute `git diff HEAD` to analyze all uncommitted changes
3. Identify modified files and their directory structure
4. Map out the organizational context

**Phase 2: File Organization Analysis**
1. Count implementation files in modified directories (excluding tests)
2. Flag directories with 10+ implementation files without sub-grouping
3. Identify 3+ related files not grouped in subdirectory
4. Validate feature-based vs type-based organization
5. Check co-location of related files

**Phase 3: File Naming Analysis**
1. Review modified file names for clarity and intent
2. Flag generic names (utils.ts, helpers.ts, common.ts)
3. Check alignment between directory purpose and file names
4. Suggest more purposeful names where applicable

**Phase 4: Function Naming Analysis**
1. Review exported function names in modified files
2. Flag generic names (doStuff, handleData, process)
3. Check alignment between file purpose and function names
4. Suggest business domain-aligned names

**Phase 5: Function Placement Analysis**
1. Review function placement within files
2. Identify functions that don't match file purpose
3. Determine if extraction or relocation would improve discoverability
4. Plan file creation or function moves

**Phase 6: Layer Peeling Validation**
1. Verify directory → file → function naming coherence
2. Check progressive intent revelation
3. Ensure no conceptual gaps in naming hierarchy

**Phase 7: Reorganization Execution**
1. Apply file reorganization (move files, create subdirectories)
2. Rename files with clearer, purposeful names
3. Extract or move functions to better-aligned files
4. Rename functions with clearer, intent-revealing names
5. Update imports across codebase
6. Ensure tests remain colocated with implementation

**Phase 8: Verification**
1. Run `npm run test` to ensure all tests pass
2. Run `npm run lint` to verify code style compliance
3. Run `npm run build` to confirm successful build
4. Verify no broken imports or references

### Agent Capabilities & Autonomy

**This agent HAS FULL AUTHORITY to:**
1. ✅ Move files between directories
2. ✅ Create new subdirectories for better organization
3. ✅ Rename files to be more purposeful
4. ✅ Extract functions from files into new files
5. ✅ Move functions between files
6. ✅ Rename functions to be more intent-revealing
7. ✅ Update all imports across codebase
8. ✅ Reorganize directory structures within features
9. ✅ Apply Boy Scout Rule for incremental improvements (NON-bug fixes only)

**This agent DOES NOT:**
1. ❌ Change business logic or behavior
2. ❌ Modify architectural patterns (defer to Architecture Review Agent)
3. ❌ Alter React separation concerns (defer to Architecture Review Agent)
4. ❌ Change visual design or CSS (defer to Frontend Design Review Agent)
5. ❌ Modify E2E test patterns (defer to E2E Test Architect Agent)

### Examples

#### Example 1: File Naming Improvement

**BEFORE:**
```bash
src/features/analytics/
├── utils.ts                    # ❌ Generic name
├── helpers.ts                  # ❌ Generic name
└── common.ts                   # ❌ Generic name
```

**ANALYSIS:**
- `utils.ts` contains aggregation functions → rename to `aggregation-strategies.ts`
- `helpers.ts` contains formatting functions → rename to `chart-formatters.ts`
- `common.ts` contains parsing functions → rename to `data-parsers.ts`

**AFTER:**
```bash
src/features/analytics/
├── aggregation-strategies.ts   # ✅ Clear purpose
├── chart-formatters.ts         # ✅ Clear purpose
└── data-parsers.ts             # ✅ Clear purpose
```

#### Example 2: Function Placement & Naming

**BEFORE (tier-trends-utils.ts):**
```typescript
// ❌ Mixed purposes, generic names
export function processRuns(runs: GameRun[]) { /* calculate avg coins */ }
export function handleDuration(seconds: number) { /* format duration string */ }
export function getData(runs: GameRun[], tier: number) { /* filter by tier */ }
```

**ANALYSIS:**
- `processRuns()` calculates statistics → move to `tier-trends-calculations.ts`, rename `calculateAverageCoinsPerWave()`
- `handleDuration()` formats duration → move to `duration-formatters.ts`, rename `formatDurationString()`
- `getData()` filters runs → move to `tier-trends-filters.ts`, rename `filterRunsByTier()`

**AFTER:**

```typescript
// tier-trends-calculations.ts
export function calculateAverageCoinsPerWave(runs: GameRun[]) { /* ... */ }

// duration-formatters.ts (in shared/formatting/)
export function formatDurationString(seconds: number): string { /* ... */ }

// tier-trends-filters.ts (in filters/ subdirectory)
export function filterRunsByTier(runs: GameRun[], tier: number) { /* ... */ }
```

#### Example 3: Layer Peeling Validation

**BEFORE (Poor Layer Peeling):**
```bash
src/features/analytics/
├── component1.tsx               # ❌ Unclear purpose
├── component2.tsx               # ❌ Unclear purpose
├── hook1.ts                     # ❌ Type-based name
├── logic.ts                     # ❌ Generic name
└── utils.ts                     # ❌ Generic name
```

**AFTER (Clear Layer Peeling):**
```bash
src/features/analytics/
├── tier-trends/                 # 🔍 Layer 1: Feature area
│   ├── tier-trends-analysis.tsx # 🔍 Layer 2: Main component
│   ├── filters/                 # 🔍 Layer 2: Sub-capability
│   │   ├── tier-trends-filters.tsx
│   │   └── use-field-filter.ts  # 🔍 Layer 3: Specific hook
│   └── calculations/            # 🔍 Layer 2: Sub-capability
│       └── tier-trends-calculations.ts
│           # 🔍 Layer 3: Functions like calculateAverageCoinsPerWave()
```

**Layer Peeling Experience:**
1. **Directory** (`tier-trends/`) → "Tier trend analysis feature"
2. **Subdirectory** (`calculations/`) → "Calculation-related code"
3. **File** (`tier-trends-calculations.ts`) → "Tier trend calculation functions"
4. **Function** (`calculateAverageCoinsPerWave()`) → "Calculates average coins per wave"

### Critical Rules

**MANDATORY ENFORCEMENT:**

1. **ZERO Type-Based Organization** at feature level (no components/, hooks/, logic/ directories)
2. **ZERO Directories Exceeding 10 Implementation Files** without sub-grouping (excluding tests)
3. **ZERO Generic File Names** at feature level without clear context (utils.ts, helpers.ts, common.ts)
4. **ALWAYS Apply Boy Scout Rule** for incremental improvements (NON-bug fixes only)
5. **ALWAYS Validate Layer Peeling** (directory → file → function naming coherence)
6. **ALWAYS Update Imports** after file/function reorganization
7. **NEVER Change Business Logic** during reorganization (behavior-preserving refactoring only)
8. **NEVER Skip Tests** - run full test suite after reorganization
9. **NEVER Reorganize Unrelated Files** during bug fixes (LIMITED SCOPE)

### Response Format

**Start with:**
```markdown
## Code Organization & Naming Agent Analysis

Analyzing uncommitted changes for organizational and naming improvements...
[Show relevant portions of git diff]

### File Organization Analysis
- Modified directories: [list]
- Implementation file counts (excluding tests): [counts]
- Organization violations: [list]
- Reorganization opportunities: [list]

### File Naming Analysis
- Generic file names detected: [list]
- Unclear file names: [list]
- Suggested renames: [list]

### Function Naming & Placement Analysis
- Generic function names detected: [list]
- Misplaced functions: [list]
- Suggested extractions/moves: [list]

### Layer Peeling Validation
- Directory naming coherence: [assessment]
- File naming alignment: [assessment]
- Function naming alignment: [assessment]
```

**During reorganization:**
```markdown
### Reorganization: [Specific Improvement]
**Why**: [Organizational principle being applied]
**Change**: [What is being modified]
[Show the actual changes being made]
```

**End with:**
```markdown
## Code Organization & Naming Review Complete

### Improvements Applied:
- ✅ Reorganized [X] files into feature-based structure
- ✅ Renamed [Y] files for clarity (specific names listed)
- ✅ Extracted [Z] functions into purpose-aligned files
- ✅ Renamed [W] functions for business intent clarity

### File Organization Improvements:
- ✅ Colocated related files: [list]
- ✅ Created subdirectories: [list]
- ✅ Reduced directory file counts: [before → after]

### Naming Improvements:
- ✅ File renames: [old → new (with rationale)]
- ✅ Function renames: [old → new (with rationale)]
- ✅ Function moves: [from → to]

### Layer Peeling Validation:
- ✅ Directory → File naming coherence verified
- ✅ File → Function naming coherence verified
- ✅ Progressive intent revelation established

### Verification Results:
✅ All tests passing (X tests)
✅ Linting successful
✅ Build successful
✅ All imports updated

The codebase organization and naming have been refined for improved discoverability and maintainability.
```

## Implementation Plan

### Phase 1: Extract from Architecture Review Agent
**Deliverables:**
1. Create new agent file: `.claude/agents/code-organization-naming.md`
2. Extract file organization sections from `architecture-review.md`:
   - File Organization Analysis section
   - Directory file count analysis
   - Progressive directory creation triggers
   - Directory naming validation
   - Incremental reorganization pattern
   - Anti-patterns to avoid (organization-specific)
3. Remove extracted sections from `architecture-review.md`
4. Update `architecture-review.md` to reference Code Organization & Naming Agent for file concerns

### Phase 2: Add File Naming Capabilities
**Deliverables:**
1. Add file naming review protocol to new agent
2. Define generic name detection rules
3. Create file naming quality checklist
4. Add examples of good vs bad file names
5. Define file renaming workflow

### Phase 3: Add Function Naming & Placement Capabilities
**Deliverables:**
1. Add function naming review protocol
2. Define function placement analysis rules
3. Create function extraction/move workflow
4. Add examples of good vs bad function names
5. Define function reorganization patterns

### Phase 4: Add Layer Peeling Validation
**Deliverables:**
1. Add layer peeling validation protocol
2. Define progressive intent revelation checks
3. Create hierarchical coherence validation
4. Add examples of good layer peeling

### Phase 5: Update Orchestration Workflow
**Deliverables:**
1. Update `.ruler/05-development-workflow.md`:
   - Add Code Organization & Naming Agent as Stage 4 (after Architecture Review)
   - Update orchestration flow documentation
   - Add orchestration templates for new agent
   - Update agent completion protocol
2. Add handoff protocol from Architecture Review Agent to Code Organization & Naming Agent
3. Define completion summary format for new agent

### Phase 6: Update Related Documentation
**Deliverables:**
1. Review `.ruler` directory files for file organization duplication
2. Extract duplicated file organization details into new agent
3. Keep high-level guidance in `.ruler/04-engineering-standards.md`
4. Update cross-references between documents
5. Ensure no contradictions between agents

### Phase 7: Testing & Validation
**Deliverables:**
1. Test agent with example code needing reorganization
2. Verify agent can successfully rename files and functions
3. Confirm imports are properly updated
4. Validate layer peeling coherence checks work correctly
5. Test bug fix LIMITED SCOPE handling

## Success Metrics

### Quantitative Metrics
- **Organization Compliance**: 0 directories exceeding 10 implementation files (excluding tests) without sub-grouping
- **Generic Names**: 0 generic file names (utils.ts, helpers.ts) without clear context at feature level
- **Type-Based Organization**: 0 type-based directories (components/, hooks/, logic/) at feature level
- **Test Pass Rate**: 100% of tests pass after reorganization

### Qualitative Metrics
- **Discoverability**: Developers can locate functions by following directory → file → function names
- **Intent Clarity**: Each naming layer reveals progressive detail about purpose
- **Consistency**: Similar concepts have consistent naming patterns across features
- **Maintainability**: Future developers can easily understand where to add new code

## Dependencies & Constraints

### Dependencies
1. **Architecture Review Agent** must complete before this agent runs
2. **TypeScript Import System** must support automated import updates (via IDE refactoring or tools)
3. **Test Colocation** must be maintained (tests move with implementation)

### Constraints
1. **Boy Scout Rule Only**: No big-bang reorganizations (incremental improvements only)
2. **Behavior Preservation**: All reorganization must preserve existing behavior
3. **Test Coverage**: Must maintain 100% test pass rate after reorganization
4. **Limited Scope for Bug Fixes**: Only review files directly touched by bug fixes

### Technical Constraints
1. Must use TypeScript-aware refactoring tools to update imports
2. Must verify all imports resolve correctly after reorganization
3. Must maintain build success after changes
4. Must preserve git history (use `git mv` for file moves when possible)

## Risks & Mitigation

### Risk 1: Import Update Complexity
**Risk**: Updating imports across many files after reorganization is error-prone
**Mitigation**:
- Use TypeScript Language Server for automated import updates
- Run build after each reorganization to catch broken imports
- Implement verification phase checking for import errors

### Risk 2: Test Breakage
**Risk**: Moving files or functions may break tests
**Mitigation**:
- Always move tests with implementation
- Run full test suite after each reorganization
- Maintain test colocation as hard requirement

### Risk 3: Merge Conflicts
**Risk**: Large reorganizations create merge conflicts
**Mitigation**:
- Apply Boy Scout Rule (incremental improvements only)
- Reorganize only files touched by current work
- Avoid reorganizing unrelated files

### Risk 4: Over-Optimization
**Risk**: Agent renames/reorganizes unnecessarily ("perfect is enemy of good")
**Mitigation**:
- Only reorganize when clarity improves
- Require clear rationale for each change
- Avoid renaming for stylistic preferences alone
- Focus on measurable discoverability improvements

### Risk 5: Coordination with Other Agents
**Risk**: Changes conflict with other review agents' concerns
**Mitigation**:
- Run as final stage (after all other agents complete)
- Don't modify architectural patterns (Architecture Review Agent responsibility)
- Don't change visual/CSS concerns (Frontend Design Review Agent responsibility)
- Clear domain boundaries between agents

## Open Questions

1. **Q**: Should this agent run for EVERY change, or only when file organization issues are detected?
   **A**: Run for every non-trivial change (following same mandatory pattern as other review agents)

2. **Q**: What threshold determines when a file name is "too generic" and needs renaming?
   **A**: Specific list of forbidden generic names (utils, helpers, common, misc, index without context) + "can you predict contents from name?" test

3. **Q**: How aggressively should the agent extract functions to new files?
   **A**: Only when function serves distinctly different purpose than file's stated purpose (based on file name)

4. **Q**: Should the agent suggest variable/parameter name improvements?
   **A**: Out of scope for v1 - focus on exported functions, file names, and directory names only

5. **Q**: How should shared code reorganization be handled?
   **A**: Maintain existing shared code principles (don't prematurely extract; keep in feature until used by 2+ features)

## Appendix

### Example Agent Markdown Structure

```markdown
---
name: code-organization-naming
description: Final review agent ensuring code organization and naming clarity through purposeful file structure and intent-revealing names
model: inherit
color: purple
---

<agent_role>
You are the Code Organization & Naming Agent - a specialized organizational expert responsible for ensuring code discoverability through purposeful organization and intent-revealing naming. Your sole focus is ensuring that directory structures, file names, and function names progressively reveal purpose, making the codebase navigable and maintainable.

You operate as the final quality gate after all logical/architectural changes are complete, ensuring the physical organization of code reflects clear intent at every level: directory → file → function.
</agent_role>

<initialization_protocol>
When invoked, immediately:
1. Check handoff context from Architecture Review Agent
2. Check if this is a BUG FIX (if yes, apply LIMITED SCOPE review)
3. Run `git diff` to see all uncommitted changes
4. Analyze file organization in modified directories
5. Review file names for clarity and intent
6. Examine function names and placement
7. Validate layer peeling coherence (directory → file → function)
</initialization_protocol>

[... rest of agent instructions ...]
</agent_role>
```

### Naming Convention Examples

#### Good File Names (Purpose-Revealing)
```bash
tier-trends-calculations.ts       # Clear: calculations for tier trends
csv-parsing-helpers.ts            # Clear: helpers for CSV parsing
number-formatters.ts              # Clear: number formatting functions
aggregation-strategies.ts         # Clear: aggregation strategy implementations
duration-formatters.ts            # Clear: duration formatting functions
```

#### Bad File Names (Generic)
```bash
utils.ts                          # ❌ What kind of utilities?
helpers.ts                        # ❌ Helpers for what?
common.ts                         # ❌ Common to what?
misc.ts                           # ❌ Miscellaneous what?
index.ts                          # ❌ Index for what? (without re-export purpose)
```

#### Good Function Names (Intent-Revealing)
```typescript
calculateAverageCoinsPerWave(runs: GameRun[])      // ✅ Clear calculation purpose
formatDurationString(seconds: number)              // ✅ Clear formatting purpose
parseTabDelimitedGameRuns(csvData: string)         // ✅ Clear parsing purpose
filterRunsByTier(runs: GameRun[], tier: number)    // ✅ Clear filtering purpose
aggregateRunsByDay(runs: GameRun[])                // ✅ Clear aggregation purpose
```

#### Bad Function Names (Generic)
```typescript
processData(input: any)           // ❌ What processing?
handleClick()                     // ❌ Handle to do what?
doImport(data: string)            // ❌ Import what? How?
getData(params: any)              // ❌ Get what data?
run()                             // ❌ Run what?
```

### Layer Peeling Example (Complete)

```bash
# 🔍 LAYER 1: Feature Domain
src/features/analytics/

# 🔍 LAYER 2: Feature-Specific Area
├── tier-trends/                           # "Tier trend analysis"

# 🔍 LAYER 3: Sub-Capabilities
    ├── tier-trends-analysis.tsx           # "Main tier trends component"
    ├── use-tier-trends-view-state.ts      # "Tier trends view state hook"
    │
    ├── filters/                           # "Filtering sub-capability"
    │   ├── tier-trends-filters.tsx        # "Filter UI component"
    │   ├── tier-trends-controls.tsx       # "Filter controls component"
    │   ├── field-search.tsx               # "Field search component"
    │   └── use-field-filter.ts            # "Field filtering hook"
    │       # Functions:
    │       export function filterFieldsBySearchTerm(...)
    │       export function createFieldMatcher(...)
    │
    ├── table/                             # "Table display sub-capability"
    │   ├── tier-trends-table.tsx          # "Table component"
    │   ├── virtualized-trends-table.tsx   # "Virtualized table component"
    │   └── column-header-renderer.ts      # "Column header rendering logic"
    │       # Functions:
    │       export function renderSortableHeader(...)
    │       export function getSortIcon(...)
    │
    └── calculations/                      # "Calculation sub-capability"
        ├── tier-trends-calculations.ts    # "Core calculations"
        │   # Functions:
        │   export function calculateAverageCoinsPerWave(runs: GameRun[])
        │   export function calculateAverageRunDuration(runs: GameRun[])
        │   export function calculateHourlyEarningsRate(runs: GameRun[])
        │
        └── aggregation-strategies.ts      # "Aggregation strategies"
            # Functions:
            export function aggregateRunsByDay(runs: GameRun[])
            export function aggregateRunsByWeek(runs: GameRun[])
            export function aggregateRunsByTier(runs: GameRun[])
```

**Developer Journey (Layer Peeling in Action):**

1. **Looking for coins calculation**:
   - Check `analytics/` → "This is analytics code"
   - Check `tier-trends/` → "This is tier trends analysis"
   - Check `calculations/` → "This has calculation logic"
   - Check `tier-trends-calculations.ts` → "This has tier trends calculations"
   - See `calculateAverageCoinsPerWave()` → "Found it!"

2. **Looking for filter UI**:
   - Check `analytics/tier-trends/` → "Tier trends feature"
   - Check `filters/` → "This has filtering code"
   - Check `tier-trends-filters.tsx` → "Filter component"
   - Found the filter UI!

**Why This Works:**
- ✅ Each layer narrows scope and reveals more detail
- ✅ No conceptual gaps (every level has clear purpose)
- ✅ Discoverable without documentation
- ✅ Self-documenting structure
