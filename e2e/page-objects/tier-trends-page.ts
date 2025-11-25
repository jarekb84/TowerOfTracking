import { Page, Locator } from '@playwright/test';

/**
 * Tier Trends Page Object Model
 *
 * Encapsulates interactions with the Tier Trends page (/charts/tier-trends):
 * - Table rendering verification
 * - Filter controls (field search, time period selection)
 * - Table data presence
 * - Mobile view support
 */
export class TierTrendsPage {
  readonly page: Page;

  // Table elements
  readonly table: Locator;
  readonly tableRows: Locator;

  // Filter controls - adjust based on actual implementation
  readonly fieldSearchInput: Locator;

  constructor(page: Page) {
    this.page = page;

    // Table elements - may be virtualized table
    this.table = page.locator('table').first().or(page.locator('[role="table"]'));
    this.tableRows = page.locator('tbody tr, [role="row"]');

    // Field search input - adjust selector based on actual implementation
    this.fieldSearchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
  }

  /**
   * Navigate to tier trends page
   * Uses route-based navigation: /charts/tier-trends
   */
  async goto() {
    await this.page.goto('/charts/tier-trends');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to finish loading
   * Encapsulates URL waiting and content visibility checks
   */
  async waitForPageLoad() {
    // Wait for correct URL (route-based navigation)
    await this.page.waitForURL(/\/charts\/tier-trends/, { timeout: 30000 });
    // Wait for the chart container to be visible
    const chartContainer = this.page.locator('.chart-container');
    await chartContainer.waitFor({ state: 'visible', timeout: 30000 });
    // Small delay for data population
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for table to finish loading
   */
  async waitForTableLoad() {
    // Wait for table to be visible
    await this.table.waitFor({ state: 'visible', timeout: 10000 });
    // Wait for at least one row (may take time with large datasets)
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 10000 });
    // Small delay for data population
    await this.page.waitForTimeout(500);
  }

  /**
   * Get count of visible rows in table
   */
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * Select a tier from the tier filter
   * @param tier The tier number to select (e.g., 11, 12)
   */
  async selectTier(tier: number) {
    const tierButton = this.page.locator(`button:has-text("${tier}")`).first();
    await tierButton.click();
    // Wait for table to update
    await this.page.waitForTimeout(800);
  }

  /**
   * Search for a field by name
   * @param fieldName The field name to search for
   */
  async searchField(fieldName: string) {
    await this.fieldSearchInput.fill(fieldName);
    // Wait for debounce and table update
    await this.page.waitForTimeout(800);
  }

  /**
   * Clear field search
   */
  async clearSearch() {
    await this.fieldSearchInput.clear();
    await this.page.waitForTimeout(800);
    await this.waitForTableLoad();
  }

  /**
   * Click a time period filter button
   * @param period The period text (e.g., "Weekly", "Monthly", "Run")
   */
  async selectTimePeriod(period: string) {
    const periodButton = this.page.locator(`button:has-text("${period}")`).first();
    await periodButton.click();
    await this.waitForTableLoad();
  }

  /**
   * Verify table has data
   */
  async hasTableData(): Promise<boolean> {
    const rowCount = await this.getRowCount();
    return rowCount > 0;
  }

  /**
   * Verify column header exists
   * @param headerText The expected header text
   */
  async hasColumnHeader(headerText: string): Promise<boolean> {
    const header = this.page.locator(`th:has-text("${headerText}"), [role="columnheader"]:has-text("${headerText}")`);
    return await header.isVisible();
  }

  /**
   * Get cell value from table
   * @param rowIndex Row index (0-based)
   * @param columnIndex Column index (0-based)
   */
  async getCellValue(rowIndex: number, columnIndex: number): Promise<string | null> {
    const cell = this.page.locator(`tbody tr:nth-child(${rowIndex + 1}) td:nth-child(${columnIndex + 1}), [role="row"]:nth-child(${rowIndex + 1}) [role="cell"]:nth-child(${columnIndex + 1})`);

    if (await cell.isVisible()) {
      return await cell.textContent();
    }

    return null;
  }

  /**
   * Get the last N values from a specific field row
   * @param fieldName The field name to search for (e.g., "Coins Earned")
   * @param count Number of values to retrieve (e.g., 4)
   * @returns Array of values from the last N columns, or null if field not found
   */
  async getFieldLastNValues(fieldName: string, count: number): Promise<string[] | null> {
    // Find the row containing the field name
    const fieldRow = this.page.locator(`tbody tr:has(td:has-text("${fieldName}"))`).first();

    if (!(await fieldRow.isVisible())) {
      return null;
    }

    // Get all cells in the row
    const cells = fieldRow.locator('td');
    const cellCount = await cells.count();

    if (cellCount < count + 1) {
      // Not enough columns (need at least field name + N value columns)
      return null;
    }

    // Get the last N cells (excluding the field name column)
    const values: string[] = [];
    for (let i = cellCount - count; i < cellCount; i++) {
      const cell = cells.nth(i);
      const text = await cell.textContent();
      values.push(text ? text.trim() : '');
    }

    return values;
  }

  /**
   * Check if mobile view is active (for responsive testing)
   */
  async isMobileView(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    if (!viewport) return false;
    return viewport.width < 768; // Standard mobile breakpoint
  }
}
