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

    // Tabs for different run types (route-based navigation using Link components)
    this.farmingRunsTab = page.locator('a[role="tab"]:has-text("Farm")');
    this.tournamentRunsTab = page.locator('a[role="tab"]:has-text("Tournament")');
    this.milestoneRunsTab = page.locator('a[role="tab"]:has-text("Milestone")');

    // Table elements - uses role selectors for virtualized div-based table
    this.table = page.locator('[role="rowgroup"]').first();
    this.tableRows = page.locator('.virtualized-container [role="row"]');
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
   * Uses route-based navigation: /runs/farm
   */
  async switchToFarmTab() {
    await this.farmingRunsTab.click();
    await this.page.waitForURL(/\/runs\/farm/);
    await this.waitForTableLoad();
  }

  /**
   * Switch to Tournament Runs tab
   * Uses route-based navigation: /runs/tournament
   */
  async switchToTournamentTab() {
    await this.tournamentRunsTab.click();
    await this.page.waitForURL(/\/runs\/tournament/);
    await this.waitForTableLoad();
  }

  /**
   * Switch to Milestone Runs tab
   * Uses route-based navigation: /runs/milestone
   */
  async switchToMilestoneTab() {
    await this.milestoneRunsTab.click();
    await this.page.waitForURL(/\/runs\/milestone/);
    await this.waitForTableLoad();
  }

  /**
   * Get count of visible table rows
   */
  async getTableRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * Get the first table row
   */
  async getFirstRow(): Promise<Locator> {
    return this.tableRows.first();
  }

  /**
   * Get a specific table row by index (0-based)
   */
  async getTableRow(index: number): Promise<Locator> {
    return this.tableRows.nth(index);
  }

  /**
   * Expand a specific row to show detailed data
   * Clicks the row's grid cells area (not expanded content)
   */
  async expandRow(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    // Click on the grid cells area (first child div with class 'grid')
    const gridArea = row.locator('.grid').first();
    await gridArea.click();
    // Wait a moment for expansion animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Collapse a specific row
   * Clicks the grid cells area to collapse (expanded content has stopPropagation)
   */
  async collapseRow(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    // Click on the grid cells area, not the expanded content
    const gridArea = row.locator('.grid').first();
    await gridArea.click();
    // Wait a moment for collapse animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Get the text content of a specific field from an expanded row's details
   *
   * Example field names: "Real Time", "Game Time", "Tier", "Wave", "Killed By"
   * These match the labels shown in the expanded row details
   *
   * @param rowIndex - The row index (0-based)
   * @param fieldName - The exact label text of the field to retrieve (e.g., "Real Time")
   * @returns The text value of the field, or null if row is collapsed or field not found
   */
  async getExpandedRowFieldValue(rowIndex: number, fieldName: string): Promise<string | null> {
    // In virtualized table, expanded content is within the same row div
    const row = this.tableRows.nth(rowIndex);

    // Check if row exists
    const count = await row.count();
    if (count === 0) return null;

    try {
      // Find the label element with exact text match using text= selector
      // This finds the div that directly contains the field name
      const labelElement = row.locator(`text="${fieldName}"`).first();

      // Check if label exists (indicating row is expanded)
      const labelVisible = await labelElement.isVisible({ timeout: 1000 }).catch(() => false);
      if (!labelVisible) return null;

      // The value is the next sibling element after the label
      // Structure: <div><div>Label</div><div>Value</div></div>
      const valueElement = labelElement.locator('xpath=following-sibling::*[1]');

      const value = await valueElement.textContent({ timeout: 1000 });
      return value?.trim() ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Verify table has at least minCount rows
   */
  async verifyMinimumRows(minCount: number) {
    const count = await this.getTableRowCount();
    if (count < minCount) {
      throw new Error(`Expected at least ${minCount} rows, but found ${count}`);
    }
  }
}
