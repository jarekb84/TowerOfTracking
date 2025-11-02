import { Page, Locator } from '@playwright/test';

/**
 * Base Analytics Page Object Model
 *
 * Provides shared functionality for all analytics chart pages:
 * - Time period switching (Hourly, Daily, Weekly, Monthly, Yearly)
 * - Chart rendering verification
 * - Chart data presence validation
 *
 * Extend this class for specific analytics pages (Coin, Cell, Field, etc.)
 */
export abstract class BaseAnalyticsPage {
  readonly page: Page;

  // Period filter buttons - shared across all analytics pages
  readonly hourlyButton: Locator;
  readonly dailyButton: Locator;
  readonly weeklyButton: Locator;
  readonly monthlyButton: Locator;
  readonly yearlyButton: Locator;

  // Chart elements - shared across all analytics pages
  readonly chartContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Period buttons - consistent across all chart pages
    this.hourlyButton = page.locator('button:has-text("Hourly")');
    this.dailyButton = page.locator('button:has-text("Daily")');
    this.weeklyButton = page.locator('button:has-text("Weekly")');
    this.monthlyButton = page.locator('button:has-text("Monthly")');
    this.yearlyButton = page.locator('button:has-text("Yearly")');

    // Chart container - consistent selector
    this.chartContainer = page.locator('.chart-container');
  }

  /**
   * Navigate to the specific analytics page
   * Subclasses must implement to provide the correct route
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for chart to finish loading
   * Shared timeout and rendering delay logic
   */
  async waitForChartLoad() {
    // Wait for chart container to be visible
    await this.chartContainer.waitFor({ state: 'visible', timeout: 10000 });
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

  /**
   * Hover over a specific X-axis label to trigger tooltip
   *
   * @param labelText - The X-axis label text to hover over (e.g., "Sep 2025")
   *
   * @example
   * await page.hoverOverChartLabel('Sep 2025');
   */
  async hoverOverChartLabel(labelText: string) {
    // Wait for chart to be fully rendered
    await this.page.waitForTimeout(1500);

    // Find the specific X-axis label
    // Recharts renders axis ticks as: <text class="recharts-cartesian-axis-tick-value"><tspan>Label</tspan></text>
    const axisTickLabels = this.page.locator('.recharts-cartesian-axis-tick-value');
    const tickCount = await axisTickLabels.count();

    let targetElement = null;

    // Search through all tick labels to find the one with our text
    for (let i = 0; i < tickCount; i++) {
      const element = axisTickLabels.nth(i);
      const text = await element.textContent();

      if (text && text.trim() === labelText) {
        targetElement = element;
        break;
      }
    }

    if (!targetElement) {
      return;
    }

    // Found the label - get the chart container to find the data area
    const box = await targetElement.boundingBox();
    if (!box) {
      return;
    }

    // Get the chart container to find the actual chart area
    const chartBox = await this.chartContainer.boundingBox();
    if (!chartBox) {
      return;
    }

    // Move mouse to the X position of the label, but at the vertical center of the chart area
    // This ensures we're hovering over the data area, not too far above or below
    const targetX = box.x + (box.width / 2);
    const targetY = chartBox.y + (chartBox.height * 0.5);

    await this.page.mouse.move(targetX, targetY);

    // Wait for tooltip to appear and stabilize
    await this.page.waitForTimeout(1200);
  }

  /**
   * Get tooltip content if visible
   * Waits for tooltip to be visible and returns its text content
   *
   * @returns The tooltip text content, or empty string if not visible
   */
  async getTooltipContent(): Promise<string> {
    // Wait for tooltip wrapper to be visible
    const tooltipWrapper = this.page.locator('.recharts-tooltip-wrapper');

    try {
      // Wait for tooltip to become visible (with timeout)
      await tooltipWrapper.waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      // Tooltip didn't appear
      return '';
    }

    // Get the tooltip content from within the wrapper
    // The tooltip has a specific structure with backdrop-blur class
    const tooltipContent = tooltipWrapper.locator('[class*="backdrop-blur"]').first();
    const isContentVisible = await tooltipContent.isVisible({ timeout: 1000 }).catch(() => false);

    if (isContentVisible) {
      const content = await tooltipContent.textContent();
      return content || '';
    }

    // Fallback: get all text from the wrapper
    return await tooltipWrapper.textContent() || '';
  }
}
