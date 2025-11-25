import { Page, Locator } from '@playwright/test';

/**
 * Tier Stats Page Object Model
 *
 * Encapsulates interactions with the Tier Stats page (/charts/tier-stats):
 * - Table rendering verification
 * - Aggregation switching (Max, P95, P75, P50, Mean, Min)
 * - Column header verification
 * - Table data presence
 */
export class TierStatsPage {
  readonly page: Page;

  // Table elements
  readonly table: Locator;
  readonly tableRows: Locator;

  // Aggregation dropdown/buttons
  readonly aggregationDropdown: Locator;

  constructor(page: Page) {
    this.page = page;

    // Table elements
    this.table = page.locator('table').first();
    this.tableRows = page.locator('tbody tr');

    // Aggregation control - adjust selector based on actual implementation
    // May be a dropdown or button group
    this.aggregationDropdown = page.locator('button:has-text("Aggregation")').or(
      page.locator('select[name*="aggregation"]')
    );
  }

  /**
   * Navigate to tier stats page
   * Uses route-based navigation: /charts/tier-stats
   */
  async goto() {
    await this.page.goto('/charts/tier-stats');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to finish loading
   * Encapsulates URL waiting and table visibility checks
   */
  async waitForPageLoad() {
    // Wait for correct URL (route-based navigation)
    await this.page.waitForURL(/\/charts\/tier-stats/, { timeout: 30000 });
    // Wait for table to be visible
    await this.table.waitFor({ state: 'visible', timeout: 30000 });
    // Wait for at least one row
    await this.tableRows.first().waitFor({ state: 'visible' });
    // Small delay for data population
    await this.page.waitForTimeout(300);
  }

  /**
   * Get count of rows in table
   */
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * Get current aggregation type
   * Returns the currently selected aggregation (e.g., "Maximum", "P75", "Mean")
   */
  async getCurrentAggregation(): Promise<string | null> {
    // Look for the selected button in the aggregation button group (uses aria-pressed="true")
    const selectedButton = this.page.locator('button[aria-pressed="true"]').first();
    return await selectedButton.textContent();
  }

  /**
   * Switch to P75 aggregation
   */
  async switchToP75() {
    const p75Button = this.page.locator('button:has-text("P75")').first();
    await p75Button.click();
    // Wait for table to update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Switch to Maximum aggregation
   */
  async switchToMaximum() {
    const maxButton = this.page.locator('button:has-text("Maximum")').first();
    await maxButton.click();
    // Wait for table to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch aggregation method by name
   * @param aggregation The aggregation type (e.g., "P75", "Mean", "Maximum")
   */
  async switchAggregation(aggregation: string) {
    const aggregationButton = this.page.locator(`button:has-text("${aggregation}")`).first();
    await aggregationButton.click();
    // Wait for table to update
    await this.page.waitForTimeout(500);
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
   * @param headerText The expected header text (e.g., "Tier", "Wave", "Duration")
   */
  async hasColumnHeader(headerText: string): Promise<boolean> {
    const header = this.page.locator(`th:has-text("${headerText}")`);
    return await header.isVisible();
  }

  /**
   * Get cell value from table
   * @param rowIndex Row index (0-based)
   * @param columnIndex Column index (0-based)
   */
  async getCellValue(rowIndex: number, columnIndex: number): Promise<string | null> {
    const cell = this.page.locator(`tbody tr:nth-child(${rowIndex + 1}) td:nth-child(${columnIndex + 1})`);

    if (await cell.isVisible()) {
      return await cell.textContent();
    }

    return null;
  }

  /**
   * Get tier row data for coins earned
   * Returns an object with coins value and hourly rate for a specific tier
   * @param tier The tier number (e.g., 11)
   * @returns Object with coinsEarned and hourlyRate, or null if tier not found
   */
  async getTierCoinsData(tier: number): Promise<{ coinsEarned: string; hourlyRate: string } | null> {
    // Find the row for the specified tier (text contains "Tier 11" format)
    const tierRow = this.page.locator(`tbody tr:has(td:has-text("Tier ${tier}"))`).first();

    if (!(await tierRow.isVisible())) {
      return null;
    }

    // Find the "Coins Earned" column index by looking at headers
    const headers = await this.page.locator('th').allTextContents();
    const coinsEarnedIndex = headers.findIndex(h => h.includes('Coins Earned'));

    if (coinsEarnedIndex === -1) {
      return null;
    }

    // Get all cells in the tier row
    const cells = tierRow.locator('td');
    const cellCount = await cells.count();

    if (cellCount <= coinsEarnedIndex) {
      return null;
    }

    // Get the coins earned cell
    const coinsCell = cells.nth(coinsEarnedIndex);
    const coinsCellText = await coinsCell.textContent();

    if (!coinsCellText) {
      return null;
    }

    // Parse the cell text which contains value and hourly rate
    // Format: "10.1T\n1.0T/h" or just "10.1T"
    const lines = coinsCellText.split('\n').map(l => l.trim()).filter(l => l);

    return {
      coinsEarned: lines[0] || '',
      hourlyRate: lines[1] || ''
    };
  }

  /**
   * Sort by column (if sortable)
   * @param columnName The column header text to click
   */
  async sortByColumn(columnName: string) {
    const columnHeader = this.page.locator(`th:has-text("${columnName}")`).first();
    await columnHeader.click();
    await this.page.waitForTimeout(300);
  }
}
