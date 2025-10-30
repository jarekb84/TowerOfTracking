import { Page, Locator } from '@playwright/test';
import { AppPage } from './app-page';

/**
 * Game Runs Page Object Model
 *
 * Encapsulates interactions with the Game Runs page (/runs):
 * - Tab switching (Farming, Tournament, Milestone)
 * - Table interactions (rows, expansion, filtering)
 * - Search and filter controls
 *
 * NOTE: Navigation TO the runs page is handled by AppPage (Farm Runs nav link).
 * This POM focuses on interactions WITHIN the runs page once you're there.
 */
export class GameRunsPage {
  readonly page: Page;
  readonly appPage: AppPage;

  // Tab navigation
  readonly farmingRunsTab: Locator;
  readonly tournamentRunsTab: Locator;
  readonly milestoneRunsTab: Locator;

  // Table elements
  readonly table: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appPage = new AppPage(page);

    // Tabs for different run types
    this.farmingRunsTab = page.locator('button:has-text("Farming Runs")');
    this.tournamentRunsTab = page.locator('button:has-text("Tournament Runs")');
    this.milestoneRunsTab = page.locator('button:has-text("Milestone Runs")');

    // Table elements
    this.table = page.locator('table');
    this.tableRows = page.locator('tbody tr');
  }

  /**
   * Navigate to Game Runs page via sidebar navigation
   * Uses AppPage Farm Runs link to navigate
   */
  async goto() {
    // First ensure we're on the app (needed if starting fresh)
    await this.appPage.goto();
    // Click Farm Runs in sidebar
    await this.appPage.navigateToFarmRuns();
  }

  /**
   * Wait for page to load and table to be visible
   */
  async waitForTableLoad() {
    await this.table.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Switch to Farming Runs tab
   */
  async clickFarmingRunsTab() {
    await this.farmingRunsTab.click();
    await this.waitForTableLoad();
  }

  /**
   * Switch to Tournament Runs tab
   */
  async clickTournamentRunsTab() {
    await this.tournamentRunsTab.click();
    await this.waitForTableLoad();
  }

  /**
   * Switch to Milestone Runs tab
   */
  async clickMilestoneRunsTab() {
    await this.milestoneRunsTab.click();
    await this.waitForTableLoad();
  }

  /**
   * Get count of visible table rows
   */
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * Click expand icon on a specific row (0-indexed)
   */
  async expandRow(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    const expandButton = row.locator('button[aria-label*="expand"], button:has-text("▶")');
    await expandButton.click();
  }

  /**
   * Verify table has at least minCount rows
   */
  async verifyMinimumRows(minCount: number) {
    const count = await this.getRowCount();
    if (count < minCount) {
      throw new Error(`Expected at least ${minCount} rows, but found ${count}`);
    }
  }
}
