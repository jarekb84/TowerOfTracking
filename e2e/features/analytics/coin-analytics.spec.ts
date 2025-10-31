import { test, expect } from '../../fixtures/seeded-page';
import { AppPage } from '../../page-objects/app-page';
import { CoinAnalyticsPage } from '../../page-objects/coin-analytics-page';

/**
 * Coin Analytics E2E Tests
 *
 * High-level smoke test: verify page loads, chart renders with data, and period switching works.
 * Unit tests cover detailed functionality.
 *
 * Uses seededPage fixture which loads localStorage from seed files.
 */

test.describe('Coin Analytics', () => {
  test('renders chart with data and supports period switching', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const coinAnalyticsPage = new CoinAnalyticsPage(seededPage);

    // Navigate to coin analytics page via sidebar
    await appPage.goto();
    await appPage.coinAnalyticsLink.click();
    await coinAnalyticsPage.waitForChartLoad();

    // Verify chart container is visible
    await expect(coinAnalyticsPage.chartContainer).toBeVisible();

    // Verify chart has data
    const hasData = await coinAnalyticsPage.hasChartData();
    expect(hasData).toBe(true);

    // Get initial data point count
    const initialDataPoints = await coinAnalyticsPage.getDataPointCount();
    expect(initialDataPoints).toBeGreaterThan(0);

    // Test period switching - switch to Weekly view
    await coinAnalyticsPage.switchToWeekly();
    await expect(coinAnalyticsPage.chartContainer).toBeVisible();

    // Verify chart updated
    const weeklyDataPoints = await coinAnalyticsPage.getDataPointCount();
    expect(weeklyDataPoints).toBeGreaterThan(0);
  });
});
