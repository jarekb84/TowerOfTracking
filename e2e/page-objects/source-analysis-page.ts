import { Page } from '@playwright/test';
import { BaseAnalyticsPage } from './base-analytics-page';

/**
 * Source Analysis Page Object Model
 *
 * Extends BaseAnalyticsPage to provide Source Analysis specific functionality:
 * - Multi-chart page with timeline, pie, and bar charts
 * - Source ranking content verification
 *
 * Inherits from BaseAnalyticsPage:
 * - Time period switching
 * - Chart hover with optional chartTitle parameter for multi-chart targeting
 * - Tooltip content retrieval with multi-strategy detection
 */
export class SourceAnalysisPage extends BaseAnalyticsPage {
  // Timeline chart title for targeting hover interactions
  static readonly TIMELINE_CHART_TITLE = 'Source Proportions Over Time';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the Source Analysis page
   */
  async goto(): Promise<void> {
    await this.page.goto('/charts/sources');
    await this.waitForChartLoad();
  }

  /**
   * Hover over a specific X-axis label on the TIMELINE chart to trigger tooltip
   *
   * Overrides base implementation to automatically target the timeline chart
   * since Source Analysis has multiple charts.
   *
   * @param labelText - The X-axis label text to hover over (e.g., "Oct 25")
   */
  async hoverOverChartLabel(labelText: string): Promise<void> {
    // Call base implementation with the timeline chart title
    await super.hoverOverChartLabel(labelText, SourceAnalysisPage.TIMELINE_CHART_TITLE);
  }

  /**
   * Get the text content of the Source Ranking section (bar chart area)
   * This includes source names, values, and percentages displayed as inline labels
   */
  async getSourceRankingContent(): Promise<string> {
    const sourceRankingSection = this.page.locator('h3:has-text("Source Ranking")').locator('..').locator('..');

    try {
      await sourceRankingSection.waitFor({ state: 'visible', timeout: 2000 });
      const content = await sourceRankingSection.textContent();
      return content || '';
    } catch {
      return '';
    }
  }
}
