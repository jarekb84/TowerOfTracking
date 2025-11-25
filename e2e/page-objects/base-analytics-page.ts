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
   * Get chart area and axis labels for hover targeting
   * @internal
   */
  private getChartLocators(chartTitle?: string): { chartArea: Locator; axisTickLabels: Locator } {
    if (chartTitle) {
      // Multi-chart page: find the chart card by h3 title
      const chartCard = this.page.locator(`h3:has-text("${chartTitle}")`).locator('..').locator('..');
      const chartArea = chartCard.locator('.recharts-wrapper');
      return { chartArea, axisTickLabels: chartArea.locator('.recharts-cartesian-axis-tick-value') };
    }
    // Single-chart page: use first recharts-wrapper
    return {
      chartArea: this.page.locator('.recharts-wrapper').first(),
      axisTickLabels: this.page.locator('.recharts-cartesian-axis-tick-value'),
    };
  }

  /**
   * Find an axis label element by text
   * @internal
   */
  private async findAxisLabel(axisTickLabels: Locator, labelText: string): Promise<Locator | null> {
    const tickCount = await axisTickLabels.count();
    for (let i = 0; i < tickCount; i++) {
      const element = axisTickLabels.nth(i);
      const text = await element.textContent();
      if (text && text.trim() === labelText) {
        return element;
      }
    }
    return null;
  }

  /**
   * Find tooltip content from elements matching a selector
   * @internal
   */
  private async findTooltipInElements(selector: string, validator: (text: string) => boolean): Promise<string> {
    const elements = this.page.locator(selector);
    const count = await elements.count();
    for (let i = 0; i < count; i++) {
      const text = await elements.nth(i).textContent();
      if (text && validator(text)) {
        return text;
      }
    }
    return '';
  }

  /**
   * Hover over a specific X-axis label to trigger tooltip
   *
   * Works for both single-chart and multi-chart pages:
   * - Single-chart: Uses .recharts-wrapper for bounding box (default)
   * - Multi-chart: Pass chartTitle to target a specific chart by its h3 heading
   *
   * @param labelText - The X-axis label text to hover over (e.g., "Sep 2025", "Oct 25")
   * @param chartTitle - Optional chart title (h3 text) to target on multi-chart pages
   */
  async hoverOverChartLabel(labelText: string, chartTitle?: string) {
    await this.page.waitForTimeout(1000);

    const { chartArea, axisTickLabels } = this.getChartLocators(chartTitle);
    await chartArea.waitFor({ state: 'visible', timeout: 5000 });
    await chartArea.scrollIntoViewIfNeeded();

    const targetElement = await this.findAxisLabel(axisTickLabels, labelText);
    if (!targetElement) return;

    const labelBox = await targetElement.boundingBox();
    const chartBox = await chartArea.boundingBox();
    if (!labelBox || !chartBox) return;

    // Move mouse to: X position of label, Y at ~40% from top (in the data area)
    await this.page.mouse.move(
      labelBox.x + labelBox.width / 2,
      chartBox.y + chartBox.height * 0.4
    );
    await this.page.waitForTimeout(800);
  }

  /**
   * Get tooltip content if visible
   *
   * Uses multiple strategies since Recharts renders tooltips differently:
   * 1. Standard .recharts-tooltip-wrapper
   * 2. Elements with backdrop-blur class containing data
   * 3. Elements with slate-900 background containing percentages
   *
   * @returns The tooltip text content, or empty string if not visible
   */
  async getTooltipContent(): Promise<string> {
    // Strategy 1: Standard recharts tooltip wrapper
    const wrapperContent = await this.tryGetTooltipFromWrapper();
    if (wrapperContent) return wrapperContent;

    // Strategy 2: backdrop-blur elements with data
    const backdropContent = await this.findTooltipInElements(
      '[class*="backdrop-blur"]',
      (text) => text.includes('%') || text.includes('total')
    );
    if (backdropContent) return backdropContent;

    // Strategy 3: slate-900 elements with percentages
    return this.findTooltipInElements('[class*="slate-900"]', (text) => text.includes('%'));
  }

  /**
   * Try to get tooltip content from recharts-tooltip-wrapper
   * @internal
   */
  private async tryGetTooltipFromWrapper(): Promise<string> {
    const tooltipWrapper = this.page.locator('.recharts-tooltip-wrapper');
    try {
      await tooltipWrapper.waitFor({ state: 'visible', timeout: 2000 });
      const content = await tooltipWrapper.textContent();
      return content && content.length > 0 ? content : '';
    } catch {
      return '';
    }
  }
}
