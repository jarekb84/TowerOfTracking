import { test, expect } from '../../fixtures/seeded-page';
import { AppPage } from '../../page-objects/app-page';
import { GameRunsPage } from '../../page-objects/game-runs-page';

/**
 * Game Runs Table E2E Tests
 *
 * Tests the main game runs table functionality including:
 * - Tab navigation (Farm, Tournament, Milestone)
 * - Table data loading and display
 * - Row expansion for detailed data view
 * - Data persistence across page reloads
 *
 * Uses seededPage fixture which loads localStorage from seed files.
 */

test.describe('Game Runs Table', () => {
  test('loads and displays farm runs with all tabs functional', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const gameRunsPage = new GameRunsPage(seededPage);

    // Navigate to Farm Runs (via nav bar)
    await appPage.goto();
    await appPage.navigateToFarmRuns();

    // Verify Farm Runs tab is active and table loads
    await gameRunsPage.waitForTableLoad();
    const farmRowCount = await gameRunsPage.getTableRowCount();
    expect(farmRowCount).toBeGreaterThan(0);

    // Test Tournament Runs tab
    await gameRunsPage.switchToTournamentTab();
    await gameRunsPage.waitForTableLoad();
    const tournamentRowCount = await gameRunsPage.getTableRowCount();
    expect(tournamentRowCount).toBeGreaterThan(0);

    // Test Milestone Runs tab
    await gameRunsPage.switchToMilestoneTab();
    await gameRunsPage.waitForTableLoad();
    const milestoneRowCount = await gameRunsPage.getTableRowCount();
    expect(milestoneRowCount).toBeGreaterThan(0);

    // Switch back to Farm Runs for row expansion test
    await gameRunsPage.switchToFarmTab();
    await gameRunsPage.waitForTableLoad();
  });

  test('expands rows to show detailed data', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const gameRunsPage = new GameRunsPage(seededPage);

    // Navigate to Farm Runs
    await appPage.goto();
    await appPage.navigateToFarmRuns();
    await gameRunsPage.waitForTableLoad();

    // Expand first row
    await gameRunsPage.expandRow(0);

    // Verify specific field values are visible in expanded content
    // This confirms the row expanded and shows the actual game data
    const realTime = await gameRunsPage.getExpandedRowFieldValue(0, 'Real Time');
    const tier = await gameRunsPage.getExpandedRowFieldValue(0, 'Tier');
    const wave = await gameRunsPage.getExpandedRowFieldValue(0, 'Wave');

    // Assert that we got real data
    expect(realTime).toBe('12h 44m 28s')
    expect(tier).toBe('11')
    expect(wave).toBe('9.7K')

    // Collapse row
    await gameRunsPage.collapseRow(0);

    // Verify field is no longer accessible (row collapsed)
    const realTimeAfterCollapse = await gameRunsPage.getExpandedRowFieldValue(0, 'Real Time');
    expect(realTimeAfterCollapse).toBeNull();
  });

  test('persists data across page reloads', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const gameRunsPage = new GameRunsPage(seededPage);

    // Navigate to Farm Runs and get initial row count
    await appPage.goto();
    await appPage.navigateToFarmRuns();
    await gameRunsPage.waitForTableLoad();
    const initialRowCount = await gameRunsPage.getTableRowCount();
    expect(initialRowCount).toBeGreaterThan(0);

    // Reload page
    await seededPage.reload();
    await gameRunsPage.waitForTableLoad();

    // Verify data persists
    const reloadedRowCount = await gameRunsPage.getTableRowCount();
    expect(reloadedRowCount).toBe(initialRowCount);
  });

  test('displays correct run counts for each tab', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const gameRunsPage = new GameRunsPage(seededPage);

    await appPage.goto();
    await appPage.navigateToFarmRuns();

    // Collect run counts for all tabs
    const counts = {
      farm: 0,
      tournament: 0,
      milestone: 0,
    };

    // Farm runs
    await gameRunsPage.switchToFarmTab();
    await gameRunsPage.waitForTableLoad();
    counts.farm = await gameRunsPage.getTableRowCount();

    // Tournament runs
    await gameRunsPage.switchToTournamentTab();
    await gameRunsPage.waitForTableLoad();
    counts.tournament = await gameRunsPage.getTableRowCount();

    // Milestone runs
    await gameRunsPage.switchToMilestoneTab();
    await gameRunsPage.waitForTableLoad();
    counts.milestone = await gameRunsPage.getTableRowCount();

    // Verify all tabs have data
    expect(counts.farm).toBeGreaterThan(0);
    expect(counts.tournament).toBeGreaterThan(0);
    expect(counts.milestone).toBeGreaterThan(0);
  });
});
