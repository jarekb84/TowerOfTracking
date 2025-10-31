import { test, expect } from '../../fixtures/seeded-page';
import { AppPage } from '../../page-objects/app-page';
import { DeathAnalyticsPage } from '../../page-objects/death-analytics-page';

/**
 * Death Analytics E2E Tests
 *
 * High-level smoke test: verify page loads and radar chart renders with data.
 * Unit tests cover detailed functionality.
 *
 * Uses seededPage fixture which loads localStorage from seed files.
 */

test.describe('Death Analytics', () => {
  test('renders radar chart with data', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const deathAnalyticsPage = new DeathAnalyticsPage(seededPage);

    // Navigate to death analytics page via sidebar
    await appPage.goto();
    await appPage.deathAnalyticsLink.click();
    await deathAnalyticsPage.waitForChartLoad();

    // Verify chart container is visible
    await expect(deathAnalyticsPage.chartContainer).toBeVisible();

    // Verify chart has data
    const hasData = await deathAnalyticsPage.hasChartData();
    expect(hasData).toBe(true);

    // Verify chart has series (multiple tiers)
    const seriesCount = await deathAnalyticsPage.getSeriesCount();
    expect(seriesCount).toBeGreaterThan(0);
  });
});
