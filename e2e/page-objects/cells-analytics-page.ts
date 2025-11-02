import { Page } from '@playwright/test';
import { BaseAnalyticsPage } from './base-analytics-page';

/**
 * Cells Analytics Page Object Model
 *
 * Extends BaseAnalyticsPage to provide Cells Analytics specific functionality.
 * Inherits period switching, chart verification, and chart data methods.
 */
export class CellsAnalyticsPage extends BaseAnalyticsPage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to cells analytics page
   */
  async goto() {
    await this.page.goto('/charts/cells');
    await this.waitForChartLoad();
  }
}
