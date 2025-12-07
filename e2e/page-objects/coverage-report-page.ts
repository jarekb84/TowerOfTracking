import { Page } from '@playwright/test';
import { BaseAnalyticsPage } from './base-analytics-page';

/**
 * Coverage Report Page Object Model
 *
 * Extends BaseAnalyticsPage to provide Coverage Report specific functionality:
 * - Multi-chart page with timeline and summary charts
 * - Targets "Coverage Percentages Over Time" chart for hover interactions
 *
 * Inherits from BaseAnalyticsPage:
 * - Time period switching
 * - Chart hover with optional chartTitle parameter for multi-chart targeting
 * - Tooltip content retrieval with multi-strategy detection
 */
export class CoverageReportPage extends BaseAnalyticsPage {
  // Timeline chart title for targeting hover interactions
  static readonly TIMELINE_CHART_TITLE = 'Coverage Percentages Over Time';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the Coverage Report page
   */
  async goto(): Promise<void> {
    await this.page.goto('/charts/coverage');
    await this.waitForChartLoad();
  }

  /**
   * Hover over a specific X-axis label on the TIMELINE chart to trigger tooltip
   *
   * Overrides base implementation to automatically target the timeline chart
   * since Coverage Report has multiple charts.
   *
   * @param labelText - The X-axis label text to hover over (e.g., "Oct 25")
   */
  async hoverOverChartLabel(labelText: string): Promise<void> {
    // Call base implementation with the timeline chart title
    await super.hoverOverChartLabel(labelText, CoverageReportPage.TIMELINE_CHART_TITLE);
  }
}
