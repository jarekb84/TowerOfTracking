# End-to-End Testing PRD

## 1. Executive Summary

Implement comprehensive end-to-end (E2E) testing using Playwright to validate critical user workflows in the Tower of Tracking application. The E2E test suite will serve as a safety net for upcoming large-scale file reorganization, ensuring that refactoring 187+ files from type-based to feature-based organization doesn't break user-facing functionality.

## 2. Problem Statement

Current unit tests only validate isolated functions with expected data formats. We lack automated testing that:
- Validates the complete user experience from browser interaction to data persistence
- Tests real-world data import scenarios using production-exported data
- Ensures localStorage persistence works correctly (data round-trips through localStorage on page refresh)
- Ensures all analytics pages render correctly with imported data
- Verifies the application works end-to-end as users would actually use it
- Provides confidence for large-scale code refactoring and file reorganization

## 3. Goals & Objectives

### Primary Goals
- Implement automated E2E tests that simulate real user interactions
- Validate core application workflows work correctly with production-like data
- Ensure all analytics pages function properly after data import
- Prevent regressions in critical user paths
- Enable confident large-scale file reorganization through comprehensive test coverage

### Success Criteria
- E2E tests run successfully in pre-commit hook via `integration-precheck`
- Tests use actual production export files as test data
- All major user workflows are covered with smoke tests
- Clear test reports indicate pass/fail status
- Seed project (bulk import test) consistently produces valid localStorage files
- Seed project verifies localStorage persistence via page refresh
- Main project tests use seededPage fixture without re-running bulk import
- Clear distinction between seed failures and feature test failures

## 4. Implementation Context

### Why Implement E2E Tests Now?

**Primary Goal**: Safety net for upcoming file reorganization

**Current State**: The codebase has 187+ files in `src/features/data-tracking/` organized by **type** (components/, hooks/, logic/, utils/) rather than by **feature/concept**. This creates poor discoverability and unclear boundaries.

**Planned Reorganization**: Moving to feature-based organization following `docs/file-organization-analysis.md` principles:
- Group by feature/concept (tier-trends/, tier-stats/, data-import/, game-runs/)
- Colocate related files (component + hook + logic + types together)
- Create subdirectories for sub-features (filters/, table/, mobile/)

**Risk**: Large-scale file movement could break import paths or runtime behavior

**Mitigation**: E2E tests verify functionality remains intact after refactoring

**Benefit**: Confidence to reorganize aggressively without fear of breaking user flows

**Key Point**: These E2E tests are being implemented NOW, before file reorganization, to provide confidence that our refactoring maintains all user-facing functionality.

## 5. Technical Requirements

### 5.1 Testing Framework

**Framework**: Playwright (`@playwright/test`)

**Justification**:
- Modern, reliable API
- Excellent debugging tools (screenshots, videos, traces)
- Supports project dependencies (critical for seed → main execution flow)
- Strong cross-browser support
- Headless and headed modes

### 5.2 Test Architecture: Two-Project Model

We use Playwright's multi-project feature to model test execution as two sequential phases:

#### Project A: "seed" (Bulk Import Test - Also Seeds State)

**Purpose**: Test the bulk import feature AND generate seed data for other tests

**Test File**: `e2e/features/data-import/bulk-import.spec.ts`

**Why This Naming?**
- This IS the bulk import feature test, it just happens to also seed state for other tests
- Avoids duplicate bulk import testing in Project B
- Clear naming: feature-based, not infrastructure-based naming like "seed.import.spec.ts"

**Test Behavior**:
1. Launches browser, navigates to bulk import UI
2. Reads and pastes tab-delimited CSV data from `fixtures/bulk-import-data.csv`
3. Submits import, waits for completion
4. **Verifies**: Success message appears
5. **Verifies**: UI shows imported runs count/summary
6. **CRITICAL - Page Refresh**: Reloads the page
7. **Verifies After Refresh**: Navigates to farming runs table
8. **Verifies After Refresh**: Data appears correctly (localStorage round-trip successful)
9. Extracts browser's `localStorage` to disk:
   - One file per localStorage key (`seed/<keyName>.seeddata`)
   - Preserves raw format (JSON stays JSON, tab-delimited stays tab-delimited)
   - No transformation/consolidation that could lose data fidelity
10. Verifies seed files written successfully

**Why Page Refresh is CRITICAL**:
Page refresh verification catches a specific class of bugs where data persists to runtime application state but does NOT persist correctly to localStorage. The refresh → navigate → verify flow ensures data truly persists through localStorage serialization/deserialization.

**Configuration**:
- Playwright config: `name: 'seed'`, `testMatch: /bulk-import\.spec\.ts/`
- Generated seed files are gitignored (runtime artifacts, not committed)

#### Project B: "main" (Feature Tests)

**Purpose**: Test all other features using pre-seeded state

**Dependencies**: Depends on "seed" project via Playwright's `dependencies` field
- Only runs if seed project succeeds
- If seed fails, main tests don't run (clear failure isolation)

**Test Coverage**:
- Single game run add (manual entry from clean state)
- Bulk export (requires seeded data)
- Game runs table (tab switching, row expansion, filtering with large dataset)
- Analytics pages (smoke tests - verify rendering and basic interactions)

**Configuration**:
- Playwright config: `name: 'main'`, `testIgnore: /bulk-import\.spec\.ts/`, `dependencies: ['seed']`
- Most tests use shared `seededPage` fixture
- Exception: `single-run-add.spec.ts` starts with clean state (no seededPage) to test standalone add functionality

**Execution Flow**:
1. Playwright runs `seed` → bulk import test + localStorage extraction to disk
2. If seed succeeds → Playwright runs `main` → all other feature tests
3. If seed fails → full Playwright diagnostics, main tests are skipped

**Benefits of Two-Project Model**:
- Deterministic ordering without forcing test sequence
- Clear separation: data seeding vs. feature testing
- No duplicate bulk import tests
- Fast test execution (seed once, test many times)
- Realistic data flow (uses actual UI import, not mock data injection)

### 5.3 Shared Fixture Strategy

**Fixture File**: `e2e/helpers/fixtures.ts`

**Purpose**: Provide consistent hydrated application state to all main project tests

**Fixture Behavior** (`seededPage`):
1. Launch new browser page
2. Read seed files from disk (localStorage key/value pairs written by seed project)
3. Navigate to app origin (`page.goto(baseURL)`) to enable localStorage access
4. Rehydrate localStorage via `page.evaluate()` for each key/value pair
5. Reload page to apply state
6. Navigate to desired route (e.g., `/runs` or `/charts/tier-stats`)

**Usage in Tests**:
```typescript
test('renders tier stats table', async ({ seededPage }) => {
  await seededPage.goto('/charts/tier-stats');
  // Test has full data context, no manual seeding needed
});
```

**Benefits**:
- Tests get real import path data (not mocked)
- No duplicate import UI logic in every test
- Consistent app state across all tests
- Fast test execution (no repeated imports)
- Tests focus on feature behavior, not setup

### 5.4 Test Environment Setup

#### Directory Structure

```
e2e/
├── seed/                               # Gitignored seed data (runtime artifacts)
│   ├── gameRunsData.seeddata           # Generated by bulk import test
│   └── appSettings.seeddata            # Generated by bulk import test
├── fixtures/
│   ├── bulk-import-data.csv           # App export format (tab-delimited CSV)
│   ├── farming-run.txt                # Game export format (field\tvalue rows)
│   ├── tournament-run.txt             # Game export format (field\tvalue rows)
│   └── milestone-run.txt              # Game export format (field\tvalue rows)
├── helpers/
│   └── fixtures.ts                    # Shared seededPage fixture
└── features/                          # Feature-based test organization
    ├── data-import/
    │   ├── bulk-import.spec.ts        # Project A (seed test)
    │   ├── single-run-add.spec.ts     # Project B (no seededPage - clean state test)
    │   └── bulk-export.spec.ts        # Project B (uses seededPage)
    ├── game-runs/
    │   └── runs-table.spec.ts         # Project B (uses seededPage)
    └── analytics/
        ├── coin-analytics.spec.ts     # Project B (uses seededPage)
        ├── cells-analytics.spec.ts    # Project B (uses seededPage)
        ├── death-analytics.spec.ts    # Project B (uses seededPage)
        ├── tier-stats.spec.ts         # Project B (uses seededPage)
        └── tier-trends.spec.ts        # Project B (uses seededPage)
```

**Key Points**:
- `bulk-import.spec.ts` lives in `features/data-import/` (feature-based location)
- Configured as Project A in Playwright config via `testMatch` pattern
- Feature-based organization follows same principles as `src/features/`
- Tests colocated by feature domain, NOT by test type

#### Fixture Files Detail

**bulk-import-data.csv**:
- Format: Tab-delimited CSV (how YOUR APP exports data for re-import)
- Content: Full dataset with multiple game runs
- Used by: Seed project (bulk import test)

**farming-run.txt, tournament-run.txt, milestone-run.txt**:
- Format: Tab-delimited text (how THE GAME exports individual battle history stats)
- Structure: ~50-60 rows of `field_name\tfield_value` format
- Used by: Single-run-add test in main project

**Note on Milestone Runs**:
Milestone runs have identical data structure to farming runs (just different module/lab configuration). Include a lower weight count example to show variety in test data.

#### Configuration Requirements

**Playwright Configuration** (`playwright.config.ts`):
```typescript
export default defineConfig({
  testDir: './e2e',

  projects: [
    {
      name: 'seed',
      testMatch: /bulk-import\.spec\.ts/,
    },
    {
      name: 'main',
      testIgnore: /bulk-import\.spec\.ts/,
      dependencies: ['seed'],
    },
  ],

  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

**Vitest Configuration Update** (`vitest.config.ts`):
```typescript
export default defineConfig({
  test: {
    // Exclude E2E tests from Vitest
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',  // ← Add this to prevent Vitest from running Playwright tests
    ],
  },
});
```

**Critical**: Ensure Vitest and Playwright test files are completely isolated:
- Vitest runs unit/integration tests (`.test.ts`, `.test.tsx` in `src/`)
- Playwright runs E2E tests (`.spec.ts` in `e2e/`)
- No overlap or accidental cross-execution

## 6. Test Scenarios

### Philosophy: Smoke Testing, Not Exhaustive Coverage

**Goal**: Verify pages render correctly and basic interactions work.

**NOT Goal**: Test every feature permutation, edge case, or UI variant.

**Approach**:
- Verify critical user paths load and display data
- Test basic interactions (tab switching, filter changing, aggregation selection)
- Ensure charts/tables mount and are interactive
- Catch major breakages, not minor edge cases

### 6.1 Project A: Bulk Import Test (Seeds State)

**Test File**: `e2e/features/data-import/bulk-import.spec.ts`

**Purpose**: Test bulk import feature AND generate seed data for other tests

**Test Steps**:
1. Navigate to app root
2. Click "Import Data" or navigate to bulk import screen
3. Read `fixtures/bulk-import-data.csv` content
4. Paste content into textarea
5. Click "Import" button
6. Wait for import completion

**Assertions (Pre-Refresh)**:
- Success message appears
- UI shows imported runs count or summary

**Page Refresh Verification (CRITICAL)**:
7. Reload the page (`page.reload()`)
8. Navigate to farming runs table (`/runs`)

**Assertions (Post-Refresh)**:
- Farming runs table renders
- Data appears correctly (verify row count, sample values)
- **This verifies**: Data persisted to localStorage, not just runtime state

**Seed Data Extraction**:
9. Read all `localStorage` keys and values
10. Write each key/value to separate file: `seed/<keyName>.seeddata`
11. Preserve raw format (no JSON consolidation)

**Verification**:
- Seed files exist on disk
- Seed directory contains expected keys

**Why This Test Structure?**:
- Tests the actual bulk import user flow
- Catches localStorage persistence bugs via page refresh
- Generates realistic seed data from real import path
- No duplicate bulk import test needed in Project B

### 6.2 Project B: Data Import Tests

#### Test: Single Game Run Add

**Test File**: `e2e/features/data-import/single-run-add.spec.ts`

**Purpose**: Verify manual single-run entry works for all three run types

**Setup**: Starts with clean state (no seeded data - testing standalone add functionality)

**Test Steps**:
1. Navigate to app root (empty state)
2. Click "Add Game Run" button
3. Paste farming run data from `fixtures/farming-run.txt`
4. Submit the form
5. Verify success notification appears
6. Click "Add Game Run" button again
7. Paste tournament run data from `fixtures/tournament-run.txt`
8. Submit the form
9. Verify success notification appears
10. Click "Add Game Run" button again
11. Paste milestone run data from `fixtures/milestone-run.txt`
12. Submit the form
13. Verify success notification appears

**Assertions (Before Refresh)**:
- Navigate to `/runs` (Farming Runs tab)
- Verify farming runs table renders with 1 row
- Click expand icon on the farming run row
- Verify expanded details render (presence of detailed fields)
- Navigate to Tournament Runs tab
- Verify tournament runs table renders with 1 row
- Navigate to Milestone Runs tab
- Verify milestone runs table renders with 1 row

**Page Refresh Verification (CRITICAL)**:
14. Reload the page (`page.reload()`)
15. Navigate back to `/runs`

**Assertions (After Refresh)**:
- Verify farming runs table still renders with 1 row
- Navigate to Tournament Runs tab - verify 1 row
- Navigate to Milestone Runs tab - verify 1 row
- **This verifies**: Added runs persist correctly to localStorage

**Why No seededPage Fixture?**
- This test verifies standalone single-run import functionality from empty state
- Catches bugs specific to individual run addition (not bulk import)
- Includes page refresh to verify localStorage persistence for single-run adds
- Some test overlap with 6.3 is acceptable - they test different scenarios (few runs vs. many runs)

#### Test: Bulk Export

**Test File**: `e2e/features/data-import/bulk-export.spec.ts`

**Purpose**: Verify data export functionality

**Setup**: Uses `seededPage` fixture (needs data to export)

**Test Steps**:
1. Navigate to export screen
2. Click "Export Data" button
3. Download/capture exported CSV content

**Assertions**:
- Export completes successfully
- CSV format matches expected structure (tab-delimited)
- Row count matches expected (based on seed data)
- Sample data values are correct

### 6.3 Project B: Game Runs Table Tests (using seededPage)

**Test File**: `e2e/features/game-runs/runs-table.spec.ts`

**Purpose**: Verify runs table displays data and supports basic interactions with larger dataset

**Setup**: Uses `seededPage` fixture (hundreds of runs from bulk import)

**Relationship to 6.2**: While there is some overlap with the single-run-add test (both verify tab switching and row expansion), these tests serve different purposes:
- **6.2 (Single Run Add)**: Tests add functionality from empty state with 3 runs total
- **6.3 (Runs Table)**: Tests table behavior with large dataset (hundreds of runs)
- Both include basic interaction verification, which is acceptable for these separate features

#### Test: Tab Switching

**Test Steps**:
1. Navigate to `/runs` (default: farming runs)
2. Verify farming runs table renders with data
3. Click "Tournament Runs" tab
4. Verify tournament runs table renders with data
5. Click "Milestone Runs" tab
6. Verify milestone runs table renders with data

**Assertions**:
- Each tab displays table with rows
- Tab switching updates table content
- No errors or broken layouts

#### Test: Row Expansion

**Test Steps**:
1. On farming runs table, click expand icon on first row
2. Verify expanded row shows detailed run information
3. Click collapse icon
4. Verify row collapses

**Assertions**:
- Expand/collapse behavior works
- Detailed fields render in expanded view
- Specific fields are visible (verify presence of key data fields)

### 6.4 Project B: Analytics Page Tests (using seededPage)

**Philosophy**: Smoke tests - verify page loads, chart/table renders, basic interaction works.

#### Test: Coin Analytics

**Test File**: `e2e/features/analytics/coin-analytics.spec.ts`

**Test Steps**:
1. Navigate to `/charts/coins`
2. Verify chart renders (chart container visible, series data present)
3. Click "Weekly" view button
4. Verify chart updates (different data points or axis labels)

**Assertions**:
- Chart container is visible
- Chart has data points (e.g., SVG elements exist)
- View switching updates chart

#### Test: Cells Analytics

**Test File**: `e2e/features/analytics/cells-analytics.spec.ts`

**Test Steps**:
1. Navigate to `/charts/cells`
2. Verify chart renders
3. Click "Monthly" view button
4. Verify chart updates

**Assertions**:
- Chart container is visible
- Chart has data points
- View switching works

#### Test: Death Analytics

**Test File**: `e2e/features/analytics/death-analytics.spec.ts`

**Test Steps**:
1. Navigate to `/charts/deaths`
2. Verify radar chart renders
3. Toggle tier visibility (e.g., show/hide Tier 12) OR toggle tournament filter
4. Verify chart updates

**Assertions**:
- Radar chart container is visible
- Chart has data series
- Filter interaction updates chart

#### Test: Tier Stats

**Test File**: `e2e/features/analytics/tier-stats.spec.ts`

**Test Steps**:
1. Navigate to `/charts/tier-stats`
2. Verify table renders with data (rows and columns present)
3. Click "Aggregation" dropdown
4. Select "P75" (75th percentile)
5. Verify table updates

**Assertions**:
- Table renders with rows
- Column headers are visible
- Aggregation switching updates table values

#### Test: Tier Trends

**Test File**: `e2e/features/analytics/tier-trends.spec.ts`

**Test Steps**:
1. Navigate to `/charts/tier-trends`
2. Verify table renders with rows and columns
3. Click "Duration (Weekly)" filter or similar interactive control
4. Verify results update (table re-renders with new data)

**Assertions**:
- Table renders with data rows
- Filter controls are visible
- Interaction updates table content

### 6.5 Assertions Strategy

#### Table Views

**Approach**: Use DOM assertions
- Verify table element exists and is visible
- Check row count (minimum expected rows based on seed data)
- Verify specific cell values (sample checks, not exhaustive)
- Test column header text
- Verify sort/filter interactions change table state

**Example**:
```typescript
await expect(page.locator('table')).toBeVisible();
await expect(page.locator('tbody tr')).toHaveCount({ minimum: 5 });
```

#### Chart Views

**DO NOT Use**:
- Pixel/snapshot diffs (too brittle with font rendering, antialiasing, minor style changes)

**DO Use - Semantic Assertions**:
- Chart container is visible
- Expected series/legend labels render (check text content)
- Expected number of data points exist (e.g., count SVG `rect` elements for bar charts)
- Hover behavior works:
  - Simulate hover over data point
  - Assert tooltip appears
  - Verify tooltip shows expected value/label

**Example**:
```typescript
await expect(page.locator('[data-testid="chart-container"]')).toBeVisible();
await expect(page.locator('svg rect')).toHaveCount({ minimum: 10 });

// Test hover interaction
await page.hover('svg rect:first-child');
await expect(page.locator('.tooltip')).toBeVisible();
await expect(page.locator('.tooltip')).toContainText('Tier 1');
```

**Goal**: "Chart mounted, is interactive, shows correct data values" NOT "every pixel matches reference screenshot"

## 7. Pre-commit Hook Integration

### Integration with `integration-precheck`

**Current Pre-commit Flow** (`.husky/pre-commit`):
```bash
npm run integration-precheck
```

**Update `integration-precheck` Script** (`package.json`):
```json
{
  "scripts": {
    "integration-precheck": "npm run lint && npm run test && npx playwright test"
  }
}
```

**Execution Order** (Fail Fast):
1. **Lint**: ESLint with prune suppressions
2. **Unit Tests**: Vitest runs all unit/integration tests
3. **E2E Tests**: Playwright runs seed project, then main project

**Benefits**:
- Catches cheap failures first (lint, then unit tests)
- E2E tests only run if lint and unit tests pass
- Same command works locally and in CI
- Pre-commit hook may slow down commits, but ensures quality

**CI/CD Integration**:
No special GitHub Actions configuration needed. CI runs the same `integration-precheck` command. Optionally, CI can:
- Install Playwright browsers: `npx playwright install --with-deps`
- Upload HTML report/traces/screenshots on failure as artifacts
- Serve production build (`npm run build && npx serve -s dist`) instead of dev server

## 8. Implementation Plan

### Phase 1: Foundation
1. Install Playwright: `npm install -D @playwright/test`
2. Create E2E directory structure: `e2e/features/`, `e2e/fixtures/`, `e2e/helpers/`, `e2e/seed/`
3. Configure `playwright.config.ts` with two-project setup
4. Update `vitest.config.ts` to exclude `e2e/` directory
5. Update `.gitignore` to exclude `e2e/seed/` directory
6. Update `integration-precheck` script to include `npx playwright test`

### Phase 2: Fixtures & Test Data
1. Add `bulk-import-data.csv` to `fixtures/` (app export format, tab-delimited CSV)
2. Add `farming-run.txt`, `tournament-run.txt`, `milestone-run.txt` to `fixtures/` (game export format)
3. Verify fixtures are committed to repository

### Phase 3: Seed Project (Bulk Import Test)
1. Implement `bulk-import.spec.ts`:
   - Navigate to bulk import UI
   - Paste CSV data
   - Submit and verify success
   - **Page refresh verification**
   - Navigate to farming runs table
   - Verify data appears correctly
2. Implement localStorage extraction:
   - Read all localStorage keys/values
   - Write each key to separate `.seeddata` file
3. Test seed project in isolation: `npx playwright test --project=seed`
4. Verify seed files generated in `e2e/seed/`

### Phase 4: Shared Fixture
1. Create `e2e/helpers/fixtures.ts`
2. Implement `seededPage` fixture:
   - Launch page
   - Read seed files from disk
   - Rehydrate localStorage via `page.evaluate()`
   - Navigate to app
3. Test fixture in isolation (create simple test that uses seededPage)

### Phase 5: Feature Tests (Main Project)
1. Implement data-import tests:
   - `single-run-add.spec.ts`
   - `bulk-export.spec.ts`
2. Implement game-runs tests:
   - `runs-table.spec.ts` (tab switching, row expansion)
3. Implement analytics tests:
   - `coin-analytics.spec.ts`
   - `cells-analytics.spec.ts`
   - `death-analytics.spec.ts`
   - `tier-stats.spec.ts`
   - `tier-trends.spec.ts`
4. All tests use `seededPage` fixture

### Phase 6: Integration & Verification
1. Run full test suite: `npx playwright test`
   - Verify seed project runs first
   - Verify main project runs after seed succeeds
2. Test pre-commit hook: stage changes, attempt commit
   - Verify `integration-precheck` runs lint → unit → E2E
3. Verify seed failure blocks main project:
   - Temporarily break seed test
   - Confirm main tests are skipped
4. Document test patterns and fixture usage in README or test documentation

## 9. Success Metrics

- **Test Coverage**: All critical user paths covered with smoke tests
- **Reliability**: Seed project consistently succeeds and generates valid localStorage files
- **Clarity**: Clear distinction between seed failures and feature test failures in reports
- **Integration**: E2E tests run successfully in pre-commit hook and CI
- **Confidence**: Developers feel confident making file organization changes with E2E safety net

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Seed project (bulk import) fails intermittently | Full Playwright diagnostics with video recording on failure, investigate timing issues |
| Data persists to runtime state but not localStorage | Page refresh verification in seed test catches this specific bug class |
| localStorage format changes break tests | Version seed data format, regenerate seed files when schema changes, document format |
| Tests too slow in pre-commit hook | Run lint/unit tests first (fail fast), consider parallel E2E execution after validation |
| Seed data becomes stale over time | Use actual production export, refresh fixtures periodically as app evolves |
| Chart assertions too brittle | Use semantic assertions (element count, labels, interactions), NOT pixel snapshots |
| Flaky tests due to timing issues | Use Playwright's built-in wait strategies, avoid hard-coded delays, increase timeouts if needed |
| Test maintenance burden | Use shared fixtures to centralize setup, follow DRY principles, document patterns clearly |

## 11. Future Enhancements

- **Parallel Execution**: Enable parallel execution of main project tests after confirming localStorage isolation between browser contexts
- **Multiple Seed Scenarios**: Create different seed states (empty, partial data, full data) for different test contexts
- **Visual Regression**: Add visual regression testing for static UI elements (not charts) using Playwright's screenshot comparison
- **Accessibility Testing**: Integrate Playwright's accessibility testing tools (axe-core)
- **Performance Benchmarking**: Capture and track page load times, render times during E2E tests
- **Mobile Testing**: Add mobile viewport tests for responsive behavior
- **API-Level Seeding**: Investigate faster seeding via direct localStorage injection (bypass UI) if tests become too slow

## 12. Appendix: Sample Test Implementation

### Example 1: Bulk Import Test (Project A)

```typescript
// e2e/features/data-import/bulk-import.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

test('bulk import loads data and persists to localStorage', async ({ page }) => {
  // Navigate to app
  await page.goto('/');

  // Navigate to bulk import screen
  await page.click('text=Import Data');

  // Read fixture data
  const fixtureData = await fs.readFile(
    path.join(__dirname, '../../fixtures/bulk-import-data.csv'),
    'utf-8'
  );

  // Paste into textarea
  await page.locator('textarea').fill(fixtureData);
  await page.click('button:text("Import")');

  // Verify success
  await expect(page.locator('.success-message')).toBeVisible();

  // CRITICAL: Page refresh to verify localStorage persistence
  await page.reload();

  // Navigate to farming runs table
  await page.goto('/runs');

  // Verify data appears after refresh (localStorage round-trip successful)
  await expect(page.locator('table')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount({ minimum: 1 });

  // Extract localStorage to disk for other tests
  const localStorageData = await page.evaluate(() => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    return data;
  });

  // Write each key to separate file
  const seedDir = path.join(__dirname, '../../seed');
  await fs.mkdir(seedDir, { recursive: true });

  for (const [key, value] of Object.entries(localStorageData)) {
    await fs.writeFile(
      path.join(seedDir, `${key}.seeddata`),
      value,
      'utf-8'
    );
  }

  // Verify seed files written
  const seedFiles = await fs.readdir(seedDir);
  expect(seedFiles.length).toBeGreaterThan(0);
});
```

### Example 2: Shared Fixture

```typescript
// e2e/helpers/fixtures.ts
import { test as base } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

export const test = base.extend({
  seededPage: async ({ page }, use) => {
    // Read seed files
    const seedDir = path.join(__dirname, '../seed');
    const seedFiles = await fs.readdir(seedDir);

    // Navigate to app to enable localStorage
    await page.goto('/');

    // Rehydrate localStorage
    for (const file of seedFiles) {
      const key = file.replace('.seeddata', '');
      const value = await fs.readFile(
        path.join(seedDir, file),
        'utf-8'
      );

      await page.evaluate(
        ({ key, value }) => {
          localStorage.setItem(key, value);
        },
        { key, value }
      );
    }

    // Reload to apply state
    await page.reload();

    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### Example 3: Feature Test Using seededPage

```typescript
// e2e/features/analytics/tier-stats.spec.ts
import { test, expect } from '../../helpers/fixtures';

test('tier stats page renders and allows aggregation switching', async ({ seededPage }) => {
  // Navigate to tier stats
  await seededPage.goto('/charts/tier-stats');

  // Verify table renders with data
  await expect(seededPage.locator('table')).toBeVisible();
  await expect(seededPage.locator('tbody tr')).toHaveCount({ minimum: 1 });

  // Switch to P75 aggregation
  await seededPage.click('button:text("Aggregation")');
  await seededPage.click('text=P75');

  // Verify table updates (check that table continues to have rows)
  await expect(seededPage.locator('tbody tr').first()).toBeVisible();
});
```

These examples demonstrate:
1. **Bulk import test** with page refresh verification and seed file generation
2. **Shared fixture** that rehydrates localStorage from seed files
3. **Feature test** that uses seededPage for instant data context

Full implementation will follow these patterns across all feature test files.
