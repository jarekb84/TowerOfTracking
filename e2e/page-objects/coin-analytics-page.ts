import { Page } from '@playwright/test';
import { BaseAnalyticsPage } from './base-analytics-page';

/**
 * Coin Analytics Page Object Model
 *
 * Extends BaseAnalyticsPage to provide Coin Analytics specific functionality.
 * Inherits period switching, chart verification, and chart data methods.
 */
export class CoinAnalyticsPage extends BaseAnalyticsPage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to coin analytics page
   */
  async goto() {
    await this.page.goto('/charts/coins');
    await this.waitForChartLoad();
  }
}
