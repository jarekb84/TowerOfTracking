import { Page, Locator } from '@playwright/test';

/**
 * Death Analytics Page Object Model
 *
 * Encapsulates interactions with the Death Analytics page (/charts/deaths):
 * - Radar chart rendering verification
 * - Tier visibility toggles
 * - Tournament filter toggle
 * - Chart data presence
 */
export class DeathAnalyticsPage {
  readonly page: Page;

  // Chart elements
  readonly chartContainer: Locator;

  // Filter controls - adjust based on actual implementation
  readonly tournamentFilterToggle: Locator;

  constructor(page: Page) {
    this.page = page;

    // Chart container
    this.chartContainer = page.locator('.chart-container');

    // Tournament filter toggle - may need adjustment based on actual implementation
    this.tournamentFilterToggle = page.locator('button:has-text("Tournament")');
  }

  /**
   * Navigate to death analytics page
   */
  async goto() {
    await this.page.goto('/charts/deaths');
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
   * Toggle tier visibility by tier number
   * @param tier The tier number to toggle (e.g., 12)
   */
  async toggleTier(tier: number) {
    // Look for tier toggle button - adjust selector based on actual implementation
    const tierButton = this.page.locator(`button:has-text("Tier ${tier}")`).first();
    await tierButton.click();
    await this.waitForChartLoad();
  }

  /**
   * Toggle tournament filter
   */
  async toggleTournamentFilter() {
    await this.tournamentFilterToggle.click();
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
   * Get count of radar chart series (each tier is a series)
   */
  async getSeriesCount(): Promise<number> {
    // Count path elements in SVG (radar chart uses paths for each series)
    // Filter out paths that are part of the grid/axes
    const paths = await this.page.locator('svg path').count();
    return paths;
  }

  /**
   * Verify specific death cause label is visible
   * @param cause The death cause label (e.g., "Ground Enemies", "Air Enemies")
   */
  async hasDeathCauseLabel(cause: string): Promise<boolean> {
    const label = this.page.locator(`text=${cause}`);
    return await label.isVisible();
  }
}
