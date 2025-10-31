import { Page, Locator } from '@playwright/test';

/**
 * Coin Analytics Page Object Model
 *
 * Encapsulates interactions with the Coin Analytics page (/charts/coins):
 * - Time period switching (Hourly, Daily, Weekly, Monthly, Yearly)
 * - Chart rendering verification
 * - Chart data presence
 */
export class CoinAnalyticsPage {
  readonly page: Page;

  // Period filter buttons
  readonly hourlyButton: Locator;
  readonly dailyButton: Locator;
  readonly weeklyButton: Locator;
  readonly monthlyButton: Locator;
  readonly yearlyButton: Locator;

  // Chart elements
  readonly chartContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Period buttons - adjust selectors based on actual implementation
    this.hourlyButton = page.locator('button:has-text("Hourly")');
    this.dailyButton = page.locator('button:has-text("Daily")');
    this.weeklyButton = page.locator('button:has-text("Weekly")');
    this.monthlyButton = page.locator('button:has-text("Monthly")');
    this.yearlyButton = page.locator('button:has-text("Yearly")');

    // Chart container - may need adjustment based on actual implementation
    this.chartContainer = page.locator('.chart-container');
  }

  /**
   * Navigate to coin analytics page
   */
  async goto() {
    await this.page.goto('/charts/coins');
    await this.waitForChartLoad();
  }

  /**
   * Wait for chart to finish loading
   */
  async waitForChartLoad() {
    // Wait for chart container to be visible
    await this.chartContainer.waitFor({ state: 'visible' });
    // Add a small delay for chart rendering
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to hourly view
   */
  async switchToHourly() {
    await this.hourlyButton.click();
    await this.waitForChartLoad();
  }

  /**
   * Switch to daily view
   */
  async switchToDaily() {
    await this.dailyButton.click();
    await this.waitForChartLoad();
  }

  /**
   * Switch to weekly view
   */
  async switchToWeekly() {
    await this.weeklyButton.click();
    await this.waitForChartLoad();
  }

  /**
   * Switch to monthly view
   */
  async switchToMonthly() {
    await this.monthlyButton.click();
    await this.waitForChartLoad();
  }

  /**
   * Switch to yearly view
   */
  async switchToYearly() {
    await this.yearlyButton.click();
    await this.waitForChartLoad();
  }

  /**
   * Verify chart has data (checks for SVG elements)
   * Returns true if chart has data points
   */
  async hasChartData(): Promise<boolean> {
    // Check for SVG elements that represent data
    const svgElements = await this.page.locator('svg').count();
    return svgElements > 0;
  }

  /**
   * Get count of data points in chart
   */
  async getDataPointCount(): Promise<number> {
    // Count circle elements (typical for line charts) or rect elements (for bar charts)
    const circles = await this.page.locator('svg circle').count();
    const rects = await this.page.locator('svg rect').count();
    return Math.max(circles, rects);
  }
}
