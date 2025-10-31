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
    this.farmingRunsTab = page.locator('button:has-text("Farm Runs")');
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
  async switchToFarmTab() {
    await this.farmingRunsTab.click();
    await this.waitForTableLoad();
  }

  /**
   * Switch to Tournament Runs tab
   */
  async switchToTournamentTab() {
    await this.tournamentRunsTab.click();
    await this.waitForTableLoad();
  }

  /**
   * Switch to Milestone Runs tab
   */
  async switchToMilestoneTab() {
    await this.milestoneRunsTab.click();
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
   * Clicks the expand button in the first column
   */
  async expandRow(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    const expandButton = row.locator('td:first-child button').first();
    await expandButton.click();
    // Wait a moment for expansion animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Collapse a specific row
   * Clicks the collapse button (same button, different icon state)
   */
  async collapseRow(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    const collapseButton = row.locator('td:first-child button').first();
    await collapseButton.click();
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
    // The expanded row is the next tr after the main row
    // For row 0, the expanded content is in tbody tr[1]
    const expandedRowIndex = (rowIndex * 2) + 1;
    const expandedRow = this.page.locator('tbody tr').nth(expandedRowIndex);

    // Check if expanded content exists and is visible (don't wait - return null immediately if not)
    const count = await expandedRow.count();
    if (count === 0) return null;

    const isVisible = await expandedRow.isVisible({ timeout: 1000 }).catch(() => false);
    if (!isVisible) return null;

    // Find the field by its label text
    // Fields are rendered in divs with format: <label text><value>
    // We look for a div containing the field name, then get its value
    const fieldContainer = expandedRow.locator('div.flex.items-center', {
      has: this.page.locator(`text="${fieldName}"`)
    }).first();

    try {
      // The value is typically in a span after the label
      const value = await fieldContainer.textContent({ timeout: 1000 });
      if (!value) return null;

      // Extract just the value part (remove the label)
      // Format is usually "LabelValue" so we strip the label
      return value.replace(fieldName, '').trim();
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
